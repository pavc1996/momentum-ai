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
  CREATE TABLE IF NOT EXISTS budget_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'CAD',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS budget_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    hst_included INTEGER DEFAULT 0,
    hst_amount REAL DEFAULT 0,
    recurring_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS budget_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    UNIQUE(category, month, year)
  );
  CREATE TABLE IF NOT EXISTS budget_recurring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    account_id INTEGER,
    frequency TEXT DEFAULT 'monthly',
    next_due TEXT,
    active INTEGER DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
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

// View leads
app.get('/api/leads', (req, res) => {
  const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  res.json(leads);
});

// Update lead status/notes
app.patch('/api/leads/:id', (req, res) => {
  const { status, notes } = req.body;
  db.prepare('UPDATE leads SET status=COALESCE(?,status), notes=COALESCE(?,notes), updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .run(status || null, notes || null, req.params.id);
  res.json({ success: true });
});

// Generate proposal PDF
app.post('/api/proposals', async (req, res) => {
  try {
    const pdfPath = await generateProposal(req.body);
    res.download(pdfPath);
  } catch (e) {
    console.error('Proposal error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Outreach CRM
app.get('/api/outreach', (req, res) => {
  const rows = db.prepare('SELECT * FROM outreach ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/outreach', (req, res) => {
  const { business_name, owner_name, email, phone, website, city, industry, notes } = req.body;
  const result = db.prepare(
    'INSERT INTO outreach (business_name,owner_name,email,phone,website,city,industry,notes) VALUES (?,?,?,?,?,?,?,?)'
  ).run(business_name, owner_name||'', email||'', phone||'', website||'', city||'Toronto', industry||'', notes||'');
  res.json({ success: true, id: result.lastInsertRowid });
});

app.patch('/api/outreach/:id', (req, res) => {
  const { status, notes } = req.body;
  db.prepare('UPDATE outreach SET status=COALESCE(?,status), notes=COALESCE(?,notes) WHERE id=?')
    .run(status||null, notes||null, req.params.id);
  res.json({ success: true });
});

app.delete('/api/outreach/:id', (req, res) => {
  db.prepare('DELETE FROM outreach WHERE id=?').run(req.params.id);
  res.json({ success: true });
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

// ============ BUDGET API ============

// Accounts
app.get('/api/budget/accounts', (req, res) => {
  res.json(db.prepare('SELECT * FROM budget_accounts ORDER BY name').all());
});
app.post('/api/budget/accounts', (req, res) => {
  const { name, type, balance, notes } = req.body;
  const r = db.prepare('INSERT INTO budget_accounts (name,type,balance,notes) VALUES (?,?,?,?)').run(name, type, balance||0, notes||'');
  res.json({ success: true, id: r.lastInsertRowid });
});
app.patch('/api/budget/accounts/:id', (req, res) => {
  const { name, type, balance, notes } = req.body;
  db.prepare('UPDATE budget_accounts SET name=COALESCE(?,name), type=COALESCE(?,type), balance=COALESCE(?,balance), notes=COALESCE(?,notes) WHERE id=?')
    .run(name||null, type||null, balance!=null?balance:null, notes||null, req.params.id);
  res.json({ success: true });
});
app.delete('/api/budget/accounts/:id', (req, res) => {
  db.prepare('DELETE FROM budget_accounts WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Transactions
app.get('/api/budget/transactions', (req, res) => {
  const { month, year, category, account_id } = req.query;
  let q = 'SELECT t.*, a.name as account_name FROM budget_transactions t LEFT JOIN budget_accounts a ON t.account_id=a.id WHERE 1=1';
  const params = [];
  if (month && year) { q += ' AND strftime("%m",date)=? AND strftime("%Y",date)=?'; params.push(String(month).padStart(2,'0'), String(year)); }
  if (category) { q += ' AND category=?'; params.push(category); }
  if (account_id) { q += ' AND account_id=?'; params.push(account_id); }
  q += ' ORDER BY date DESC';
  res.json(db.prepare(q).all(...params));
});
app.post('/api/budget/transactions', (req, res) => {
  const { account_id, date, amount, type, category, description, hst_included, recurring_id } = req.body;
  const hst = hst_included ? Math.round(amount / 1.13 * 0.13 * 100) / 100 : 0;
  const r = db.prepare('INSERT INTO budget_transactions (account_id,date,amount,type,category,description,hst_included,hst_amount,recurring_id) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(account_id||null, date, amount, type, category, description||'', hst_included?1:0, hst, recurring_id||null);
  // Update account balance
  if (account_id) {
    const delta = type === 'income' ? amount : -amount;
    db.prepare('UPDATE budget_accounts SET balance=balance+? WHERE id=?').run(delta, account_id);
  }
  res.json({ success: true, id: r.lastInsertRowid });
});
app.delete('/api/budget/transactions/:id', (req, res) => {
  const tx = db.prepare('SELECT * FROM budget_transactions WHERE id=?').get(req.params.id);
  if (tx && tx.account_id) {
    const delta = tx.type === 'income' ? -tx.amount : tx.amount;
    db.prepare('UPDATE budget_accounts SET balance=balance+? WHERE id=?').run(delta, tx.account_id);
  }
  db.prepare('DELETE FROM budget_transactions WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Budget limits
app.get('/api/budget/limits', (req, res) => {
  const { month, year } = req.query;
  let q = 'SELECT * FROM budget_limits WHERE 1=1';
  const params = [];
  if (month) { q += ' AND month=?'; params.push(Number(month)); }
  if (year) { q += ' AND year=?'; params.push(Number(year)); }
  res.json(db.prepare(q).all(...params));
});
app.post('/api/budget/limits', (req, res) => {
  const { category, monthly_limit, month, year } = req.body;
  db.prepare('INSERT OR REPLACE INTO budget_limits (category,monthly_limit,month,year) VALUES (?,?,?,?)').run(category, monthly_limit, month, year);
  res.json({ success: true });
});
app.delete('/api/budget/limits/:id', (req, res) => {
  db.prepare('DELETE FROM budget_limits WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Recurring
app.get('/api/budget/recurring', (req, res) => {
  res.json(db.prepare('SELECT * FROM budget_recurring WHERE active=1 ORDER BY next_due').all());
});
app.post('/api/budget/recurring', (req, res) => {
  const { name, amount, category, account_id, frequency, next_due, notes } = req.body;
  const r = db.prepare('INSERT INTO budget_recurring (name,amount,category,account_id,frequency,next_due,notes) VALUES (?,?,?,?,?,?,?)')
    .run(name, amount, category, account_id||null, frequency||'monthly', next_due||'', notes||'');
  res.json({ success: true, id: r.lastInsertRowid });
});
app.patch('/api/budget/recurring/:id', (req, res) => {
  const { name, amount, category, frequency, next_due, active, notes } = req.body;
  db.prepare('UPDATE budget_recurring SET name=COALESCE(?,name), amount=COALESCE(?,amount), category=COALESCE(?,category), frequency=COALESCE(?,frequency), next_due=COALESCE(?,next_due), active=COALESCE(?,active), notes=COALESCE(?,notes) WHERE id=?')
    .run(name||null, amount!=null?amount:null, category||null, frequency||null, next_due||null, active!=null?active:null, notes||null, req.params.id);
  res.json({ success: true });
});
app.delete('/api/budget/recurring/:id', (req, res) => {
  db.prepare('DELETE FROM budget_recurring WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Summary stats
app.get('/api/budget/summary', (req, res) => {
  const now = new Date();
  const month = String(now.getMonth()+1).padStart(2,'0');
  const year = String(now.getFullYear());
  const totalAssets = db.prepare("SELECT COALESCE(SUM(balance),0) as v FROM budget_accounts WHERE type IN ('chequing','savings','tfsa','rrsp','cash')").get().v;
  const totalDebt = db.prepare("SELECT COALESCE(SUM(balance),0) as v FROM budget_accounts WHERE type IN ('credit_card','line_of_credit','loan')").get().v;
  const monthIncome = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM budget_transactions WHERE type='income' AND strftime('%m',date)=? AND strftime('%Y',date)=?").get(month,year).v;
  const monthExpenses = db.prepare("SELECT COALESCE(SUM(amount),0) as v FROM budget_transactions WHERE type='expense' AND strftime('%m',date)=? AND strftime('%Y',date)=?").get(month,year).v;
  const byCategory = db.prepare("SELECT category, SUM(amount) as total FROM budget_transactions WHERE type='expense' AND strftime('%m',date)=? AND strftime('%Y',date)=? GROUP BY category ORDER BY total DESC").all(month,year);
  const monthlyTrend = db.prepare("SELECT strftime('%Y-%m',date) as ym, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses FROM budget_transactions GROUP BY ym ORDER BY ym DESC LIMIT 6").all();
  res.json({ netWorth: totalAssets - Math.abs(totalDebt), totalAssets, totalDebt: Math.abs(totalDebt), monthIncome, monthExpenses, byCategory, monthlyTrend });
});

// CSV export
app.get('/api/budget/export', (req, res) => {
  const txs = db.prepare('SELECT t.*, a.name as account_name FROM budget_transactions t LEFT JOIN budget_accounts a ON t.account_id=a.id ORDER BY date DESC').all();
  let csv = 'Date,Type,Category,Description,Amount,HST,Account\n';
  txs.forEach(t => { csv += `${t.date},${t.type},${t.category},"${(t.description||'').replace(/"/g,'""')}",${t.amount},${t.hst_amount},"${t.account_name||''}"\n`; });
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="budget-export.csv"');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Momentum AI server running at http://localhost:${PORT}`);
});
