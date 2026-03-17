const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Lead submission
app.post('/api/leads', (req, res) => {
  const { name, email, business, service, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  
  const stmt = db.prepare(
    'INSERT INTO leads (name, email, business, service, message) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, email, business || '', service || '', message || '');
  
  console.log(`[LEAD] ${name} <${email}> - ${business || 'N/A'} - ${service || 'N/A'}`);
  
  // Log to file as backup
  const logLine = `[${new Date().toISOString()}] ${name} | ${email} | ${business} | ${service}\n`;
  fs.appendFileSync(path.join(__dirname, 'leads.log'), logLine);
  
  res.json({ success: true, id: result.lastInsertRowid });
});

// View leads (simple admin)
app.get('/api/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

// AI Chatbot endpoint
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

app.listen(PORT, () => {
  console.log(`Momentum AI server running at http://localhost:${PORT}`);
});
