const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { generateProposal } = require('./proposal-generator');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Init DB
const db = new Database(path.join(__dirname, 'leads.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    business TEXT,
    service TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    source TEXT DEFAULT 'website',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT,
    owner_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    city TEXT,
    industry TEXT,
    notes TEXT,
    status TEXT DEFAULT 'prospect',
    last_contacted DATETIME,
    email_sequence TEXT DEFAULT 'none',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  -- Add columns if they don't exist (safe for existing DB)
`);

// Safe column additions for existing databases
try { db.exec('ALTER TABLE outreach ADD COLUMN last_contacted DATETIME'); } catch(e) {}
try { db.exec('ALTER TABLE outreach ADD COLUMN email_sequence TEXT DEFAULT "none"'); } catch(e) {}
try { db.exec('ALTER TABLE leads ADD COLUMN status TEXT DEFAULT "new"'); } catch(e) {}
try { db.exec('ALTER TABLE leads ADD COLUMN notes TEXT'); } catch(e) {}
try { db.exec('ALTER TABLE leads ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'); } catch(e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    industry TEXT,
    sequence_order INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============ LEAD ENDPOINTS ============

app.post('/api/leads', (req, res) => {
  const { name, email, business, service, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const stmt = db.prepare('INSERT INTO leads (name, email, business, service, message) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(name, email, business || '', service || '', message || '');
  console.log(`[LEAD] ${name} <${email}> - ${business || 'N/A'} - ${service || 'N/A'}`);
  const logLine = `[${new Date().toISOString()}] ${name} | ${email} | ${business} | ${service}\n`;
  fs.appendFileSync(path.join(__dirname, 'leads.log'), logLine);
  res.json({ success: true, id: result.lastInsertRowid });
});

app.get('/api/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

app.patch('/api/leads/:id', (req, res) => {
  const { status, notes } = req.body;
  db.prepare('UPDATE leads SET status=COALESCE(?,status), notes=COALESCE(?,notes), updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status || null, notes || null, req.params.id);
  res.json({ success: true });
});

// ============ OUTREACH CRM ============

app.get('/api/outreach', (req, res) => {
  const { city, industry, status } = req.query;
  let q = 'SELECT * FROM outreach WHERE 1=1';
  const params = [];
  if (city) { q += ' AND city=?'; params.push(city); }
  if (industry) { q += ' AND industry=?'; params.push(industry); }
  if (status) { q += ' AND status=?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  res.json(db.prepare(q).all(...params));
});

app.post('/api/outreach', (req, res) => {
  const { business_name, owner_name, email, phone, website, city, industry, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO outreach (business_name,owner_name,email,phone,website,city,industry,notes) VALUES (?,?,?,?,?,?,?,?)'
  ).run(business_name, owner_name||'', email||'', phone||'', website||'', city||'Toronto', industry||'', notes||'');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.patch('/api/outreach/:id', (req, res) => {
  const { status, notes, email_sequence, last_contacted, owner_name, email, phone, website } = req.body;
  db.prepare(`UPDATE outreach SET 
    status=COALESCE(?,status), notes=COALESCE(?,notes), email_sequence=COALESCE(?,email_sequence),
    last_contacted=COALESCE(?,last_contacted), owner_name=COALESCE(?,owner_name), 
    email=COALESCE(?,email), phone=COALESCE(?,phone), website=COALESCE(?,website)
    WHERE id=?`)
    .run(status||null, notes||null, email_sequence||null, last_contacted||null, 
         owner_name||null, email||null, phone||null, website||null, req.params.id);
  res.json({ success: true });
});

app.delete('/api/outreach/:id', (req, res) => {
  db.prepare('DELETE FROM outreach WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Outreach stats
app.get('/api/outreach/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM outreach').get().c;
  const byCity = db.prepare('SELECT city, COUNT(*) as c FROM outreach GROUP BY city ORDER BY c DESC').all();
  const byIndustry = db.prepare('SELECT industry, COUNT(*) as c FROM outreach GROUP BY industry ORDER BY c DESC').all();
  const byStatus = db.prepare('SELECT status, COUNT(*) as c FROM outreach GROUP BY status ORDER BY c DESC').all();
  const withEmail = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE email != '' AND email IS NOT NULL").get().c;
  const withPhone = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE phone != '' AND phone IS NOT NULL").get().c;
  const withWebsite = db.prepare("SELECT COUNT(*) as c FROM outreach WHERE website != '' AND website IS NOT NULL").get().c;
  res.json({ total, byCity, byIndustry, byStatus, withEmail, withPhone, withWebsite });
});

// Bulk status update
app.post('/api/outreach/bulk-update', (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || !status) return res.status(400).json({ error: 'ids array and status required' });
  const stmt = db.prepare('UPDATE outreach SET status=? WHERE id=?');
  const update = db.transaction((ids) => {
    for (const id of ids) stmt.run(status, id);
  });
  update(ids);
  res.json({ success: true, updated: ids.length });
});

// ============ EMAIL TEMPLATES ============

app.get('/api/email-templates', (req, res) => {
  res.json(db.prepare('SELECT * FROM email_templates ORDER BY industry, sequence_order').all());
});

app.post('/api/email-templates', (req, res) => {
  const { name, subject, body, industry, sequence_order } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ error: 'Name, subject, body required' });
  const r = db.prepare('INSERT INTO email_templates (name, subject, body, industry, sequence_order) VALUES (?,?,?,?,?)')
    .run(name, subject, body, industry||'', sequence_order||1);
  res.json({ success: true, id: r.lastInsertRowid });
});

app.delete('/api/email-templates/:id', (req, res) => {
  db.prepare('DELETE FROM email_templates WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ============ PROPOSALS ============

app.post('/api/proposals', async (req, res) => {
  try {
    const pdfPath = await generateProposal(req.body);
    res.download(pdfPath);
  } catch (e) {
    console.error('Proposal error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ============ CHATBOT ============

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const msg = (message || '').toLowerCase();
  
  let reply = '';
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    reply = "Our plans start at $299/month for the Starter package, $699/month for Growth, and $1,499/month for Scale. All include a free consultation. Want to book one?";
  } else if (msg.includes('service') || msg.includes('what do you')) {
    reply = "We offer: Website Design & Build, AI Chatbots, Business Automation, AI Content & Copywriting, SEO & Local Search, and AI Analytics. Which sounds most useful for your business?";
  } else if (msg.includes('contact') || msg.includes('talk') || msg.includes('human') || msg.includes('person')) {
    reply = "Absolutely — scroll down to the contact form and we'll get back to you within 24 hours. Or email us directly at hello@momentum-ai.ca";
  } else if (msg.includes('chatbot') || msg.includes('bot')) {
    reply = "We build custom AI chatbots that handle customer questions, book appointments, and qualify leads 24/7. That's actually what I am! Want one for your business?";
  } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    reply = "Hey! 👋 I'm the Momentum AI assistant. Ask me about our services, pricing, or how we can help grow your business.";
  } else if (msg.includes('seo') || msg.includes('google') || msg.includes('search')) {
    reply = "We handle local SEO so your business shows up when people in your area search for what you offer. Most clients see results in 60-90 days.";
  } else if (msg.includes('automat')) {
    reply = "We automate the repetitive stuff — appointment reminders, follow-up emails, invoicing, social posting. Saves most clients 10+ hours/week.";
  } else {
    reply = "Great question! I'd need a bit more context. Can you tell me a bit about your business? Or scroll down to book a free consultation and we'll figure out the best fit.";
  }
  res.json({ reply });
});

// ============ DASHBOARD STATS ============

app.get('/api/stats', (req, res) => {
  const totalLeads = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const totalOutreach = db.prepare('SELECT COUNT(*) as c FROM outreach').get().c;
  const leadsByStatus = db.prepare('SELECT status, COUNT(*) as c FROM leads GROUP BY status').all();
  const outreachByCity = db.prepare('SELECT city, COUNT(*) as c FROM outreach GROUP BY city ORDER BY c DESC LIMIT 10').all();
  const recentLeads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5').all();
  res.json({ totalLeads, totalOutreach, leadsByStatus, outreachByCity, recentLeads });
});

app.listen(PORT, () => {
  console.log(`Momentum AI server running at http://localhost:${PORT}`);
});
