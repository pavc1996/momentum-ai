# CLAUDE.md — Momentum AI

> Everything I need to know about this project. Updated as changes are made.

---

## What Is This

**Momentum AI** is a Canadian AI services agency website targeting small businesses. It's a full-stack web app running locally — landing page, lead capture, CRM, outreach tools, and proposal generator. The goal is to sign clients for AI services (websites, chatbots, automation, SEO).

**Owner:** Lucky  
**Status:** Built, running locally. Not yet deployed to a live domain.  
**Local URL:** http://localhost:8080  
**Server:** Node.js + Express, managed by PM2  
**Database:** SQLite (`leads.db`)  
**Port:** 8080  

---

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite via `better-sqlite3`
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **PDF:** Puppeteer (proposal generator)
- **Process Manager:** PM2 (`momentum-ai` process)
- **Fonts:** Inter (Google Fonts)

---

## File Structure

```
momentum-ai/
├── index.html              # Main landing page (public-facing website)
├── style.css               # Global styles for landing page
├── admin.html              # Leads admin panel (view contact form submissions)
├── crm.html                # CRM / Outreach pipeline UI
├── server.js               # Express server — all routes + DB logic
├── proposal-generator.js   # Puppeteer PDF proposal generator
├── leads.db                # SQLite database
├── leads.log               # Backup log of lead submissions
├── cold-email-sequences.md # 4-track cold email sequences (written, ready to send)
├── proposals/              # Generated PDF proposals output folder
├── package.json
└── README.md
```

---

## Website — index.html

**Brand:** Momentum AI — *"We Build The Tools. You Make The Money."*  
**Design:** Dark background (#050508), purple accent (#7c5cfc), Inter font

### Sections
1. **Nav** — sticky, blur backdrop, mobile hamburger menu
2. **Hero** — headline, CTA buttons, 3 stat cards (10x faster, $0 upfront, 24/7)
3. **Services** — 6 service cards with hover effects
4. **Why Us** — 4 reasons (Speed, ROI First, No Lock-In, Always Current)
5. **How It Works** — 3-step visual (Call → Build → Grow)
6. **Pricing** — 3 tiers: Starter $299/mo, Growth $699/mo, Scale $1,499/mo
7. **Testimonials** — 3 fake Canadian client reviews (plumber, yoga studio, restaurant)
8. **Blog** — 3 article cards (AI automation, Local SEO, chatbots)
9. **FAQ** — 5 expandable questions (accordion)
10. **CTA Banner** — "Ready to Make a Move?" conversion section
11. **Contact Form** — submits to `/api/leads`, saves to DB
12. **Footer** — full footer with links, email, social, legal
13. **Chatbot Widget** — floating chat bubble, calls `/api/chat`

### Services Listed
- Website Design & Build
- AI Chatbots
- Business Automation
- AI Content & Copywriting
- SEO & Local Search
- AI Analytics & Insights

### Pricing
| Plan | Price | Key Features |
|------|-------|-------------|
| Starter | $299/mo | 5-page site, basic chatbot, 8 posts/mo |
| Growth | $699/mo | 10-page site, advanced chatbot, automation, 20 content pieces, SEO |
| Scale | $1,499/mo | Everything + custom AI tools, dashboard, account manager, weekly calls |

---

## CRM — crm.html

Full outreach pipeline UI with tabs:
- **Leads tab** — contact form submissions with status management (new → contacted → proposal → won/lost)
- **Outreach tab** — prospect list with filtering, add/edit/delete, status tracking
- **Proposals tab** — generate PDF proposals for prospects

### Outreach Database
- **Total prospects:** 475
  - **225 London ON restaurants** (added March 17 2026)
  - **250 GTA/Toronto** mixed industries (trades, health, professional services, restaurants)
- Fields: business_name, owner_name, email, phone, website, city, industry, notes, status

---

## API Endpoints

### Leads
- `POST /api/leads` — submit contact form
- `GET /api/leads` — list all leads
- `PATCH /api/leads/:id` — update status/notes

### Outreach
- `GET /api/outreach` — list prospects
- `POST /api/outreach` — add prospect
- `PATCH /api/outreach/:id` — update status/notes
- `DELETE /api/outreach/:id` — delete prospect

### Proposals
- `POST /api/proposals` — generate PDF proposal (Puppeteer), returns download

### Chat
- `POST /api/chat` — chatbot responses (rule-based, handles pricing/services/contact queries)

---

## Cold Email Sequences

File: `cold-email-sequences.md`

4 industry tracks, each with 3-part sequences:
1. **Trades** (plumbing, HVAC, electrical, roofing)
2. **Health & Wellness** (gyms, yoga, clinics)
3. **Restaurant & Food Service**
4. **Professional Services** (lawyers, accountants)

Status: Written and ready. Not yet integrated with an email sending tool.

---

## Proposal Generator

File: `proposal-generator.js`

- Uses Puppeteer to render and save PDFs
- 3 tiers: Starter / Growth / Scale
- Branded dark design matching the site
- Output saved to `/proposals/` folder

---

## Database Schema

### leads
```sql
id, name, email, business, service, message, status, source, notes, created_at, updated_at
```

### outreach
```sql
id, business_name, owner_name, email, phone, website, city, industry, notes, status, created_at
```

---

## Git History

```
157efd7 fix: remove nested budget-app from workspace root tracking
48d3e63 refactor: remove budget app — split into separate repo (budget-app). Clean nav links
f993262 feat: major upgrade — testimonials, how-it-works, FAQ, mobile nav, new footer
5fc9e31 feat: full Canadian budget app — (later extracted to own repo)
8920e29 feat: budget-ca tips engine, static middleware fix, 251 outreach prospects
189d403 feat: Budget.CA — (later extracted)
932bf5e chore: +32 outreach prospects (114 total)
c3c899f feat: CRM, proposal generator, 82 leads, cold email sequences
e19bed2 chore: add .gitignore, remove node_modules and db from tracking
c3e4d4f feat: momentum-ai backend, chatbot, blog, lead admin
```

---

## What Still Needs to Be Done

- [ ] **Deploy to live domain** — register momentum-ai.ca, get VPS, SSL cert
- [ ] **Push to GitHub** — waiting on Lucky's GitHub credentials
- [ ] **Start cold outreach** — email sequences are ready, need email setup (SendGrid or similar)
- [ ] **Business registration** — NUANS search, register Momentum AI Inc.
- [ ] **Real chatbot** — upgrade from rule-based to actual AI (OpenAI API)
- [ ] **Email notifications** — alert Lucky when new lead submits form
- [ ] **Social media** — Instagram + LinkedIn profiles

---

## Running the Server

```bash
# Via PM2 (auto-restart)
npx pm2 start server.js --name momentum-ai
npx pm2 restart momentum-ai

# Manual
node server.js
```

---

*Last updated: 2026-03-17*
