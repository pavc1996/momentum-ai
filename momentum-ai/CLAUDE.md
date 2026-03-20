# CLAUDE.md — Momentum AI
> The brain for this project. Read this before touching anything.

---

## What Is This

**Momentum AI** is a Canadian AI services agency targeting small businesses. Full-stack web app: landing page, lead capture, CRM, outreach pipeline, cold email sequences, and PDF proposal generator.

**Goal:** Sign paying clients for AI services (websites, chatbots, automation, SEO, content).

**Owner:** Lucky (@LuckyNFT444)
**Status:** Built and functional. Not deployed. Zero outreach sent.
**Local URL:** http://localhost:8080
**PM2 process:** `momentum-ai`
**Port:** 8080

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express |
| Database | SQLite via `better-sqlite3` |
| Frontend | Vanilla HTML/CSS/JS (no frameworks) |
| PDF Generator | Puppeteer |
| Process Manager | PM2 |
| Fonts | Inter (Google Fonts) |

---

## File Structure

```
momentum-ai/
├── index.html              # Public-facing landing page
├── style.css               # Landing page styles
├── admin.html              # Lead admin panel (form submissions)
├── crm.html                # Full CRM + outreach pipeline UI
├── server.js               # Express server — all routes + DB logic
├── proposal-generator.js   # Puppeteer PDF proposal generator
├── leads.db                # SQLite DB (source of truth)
├── leads.log               # Flat-file backup of lead submissions
├── cold-email-sequences.md # 4-track sequences, written, ready to send
├── proposals/              # Generated PDF output folder
├── package.json
├── CLAUDE.md               # This file
└── README.md
```

---

## Running the App

```bash
# Start via PM2
cd /Users/clawbot/Projects/momentum-ai/momentum-ai
npx pm2 start server.js --name momentum-ai
npx pm2 restart momentum-ai
npx pm2 logs momentum-ai

# Manual
node server.js
```

---

## Website — index.html

**Brand:** Momentum AI — *"We Build The Tools. You Make The Money."*
**Design:** Dark (#050508 bg), purple accent (#7c5cfc), Inter font

### Sections (in order)
1. Sticky nav + mobile hamburger
2. Hero — headline, CTAs, 3 stat cards (10x faster / $0 upfront / 24/7)
3. Services — 6 cards with hover
4. Why Us — 4 reasons (Speed, ROI First, No Lock-In, Always Current)
5. How It Works — 3-step visual (Call → Build → Grow)
6. Pricing — 3 tiers (below)
7. Testimonials — 3 fake Canadian clients (plumber, yoga studio, restaurant)
8. Blog — 3 article cards
9. FAQ — 5 accordion items
10. CTA Banner — conversion section
11. Contact Form — POSTs to `/api/leads`
12. Footer
13. Floating chatbot widget — calls `/api/chat`

### Services
- Website Design & Build
- AI Chatbots
- Business Automation
- AI Content & Copywriting
- SEO & Local Search
- AI Analytics & Insights

### Pricing
| Plan | Price | Notes |
|---|---|---|
| Starter | $299/mo | 5-page site, basic chatbot, 8 posts/mo |
| Growth | $699/mo | 10-page site, advanced chatbot, automation, 20 content pieces, SEO |
| Scale | $1,499/mo | Everything + custom AI tools, dashboard, account manager, weekly calls |

---

## Database — leads.db

### Tables

**leads** — inbound contact form submissions
```sql
id, name, email, business, service, message,
status (new/contacted/proposal/won/lost),
source, notes, created_at, updated_at
```

**outreach** — prospect pipeline for cold outreach
```sql
id, business_name, owner_name, email, phone, website,
city, industry, notes,
status (prospect/contacted/replied/interested/not-interested/won/lost),
last_contacted, email_sequence (none/A/B/C/D),
created_at
```

**email_templates** — stored email templates
```sql
id, name, subject, body, industry, sequence_order, created_at
```

### Key Stats (as of 2026-03-19)
- **Leads (inbound):** 1 (test lead)
- **Outreach prospects:** 2,028 — all status: `prospect` (zero contacted)

### Outreach Breakdown by City
| City | Count |
|---|---|
| Toronto | 363 |
| London | 351 |
| Mississauga | 107 |
| Hamilton | 96 |
| Ottawa | 90 |
| Calgary | 90 |
| Kitchener | 80 |
| Vancouver | 75 |
| Brampton | 61 |
| Edmonton | 55 |
| + more... | |

### Outreach Breakdown by Industry
| Industry | Count |
|---|---|
| Restaurant | 1,058 |
| Dental | 229 |
| Physiotherapy | 160 |
| Plumbing | 53 |
| Roofing | 50 |
| Landscaping | 48 |
| HVAC | 48 |
| Accounting | 39 |
| Fitness/Yoga | 22 |
| Auto Repair | 22 |
| + more... | |

> ⚠️ Most prospects have no email on record — scraping/enrichment needed before bulk send.

---

## API Endpoints

### Leads
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/leads` | Submit contact form |
| GET | `/api/leads` | List all inbound leads |
| PATCH | `/api/leads/:id` | Update status/notes |

### Outreach CRM
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/outreach` | List prospects (filter: city, industry, status) |
| POST | `/api/outreach` | Add prospect |
| PATCH | `/api/outreach/:id` | Update status/notes/email/sequence |
| DELETE | `/api/outreach/:id` | Remove prospect |
| GET | `/api/outreach/stats` | Aggregate stats |
| POST | `/api/outreach/bulk-update` | Bulk status update (ids[], status) |

### Proposals
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/proposals` | Generate branded PDF proposal (Puppeteer), returns download |

### Email Templates
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/email-templates` | List all templates |
| POST | `/api/email-templates` | Add template |
| DELETE | `/api/email-templates/:id` | Delete template |

### Misc
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/chat` | Rule-based chatbot (handles pricing, services, contact queries) |
| GET | `/api/stats` | Dashboard stats (lead counts, outreach by city, recent leads) |

---

## Cold Email Sequences

File: `cold-email-sequences.md`

4 industry tracks, each with 3 emails (spaced 4-5 days apart):

| Track | Target |
|---|---|
| A | Trades & Home Services (plumbing, HVAC, roofing, electrical) |
| B | Health & Wellness (physio, chiro, yoga, clinics) |
| C | Restaurants & Food |
| D | Professional Services (lawyers, accountants, financial) |

**Status: Written and ready. Zero emails sent.**

Best send times: Tue–Thu, 8–10am or 1–3pm.

---

## Chatbot — `/api/chat`

Currently rule-based (keyword matching). Handles:
- Pricing questions
- Services questions
- Contact/human requests
- Chatbot-specific questions
- SEO questions
- Automation questions
- Generic fallback

**Upgrade path:** Swap for OpenAI API call to make it actually intelligent.

---

## What's Done ✅
- Full landing page with all sections
- Admin panel (lead management)
- CRM with outreach pipeline UI
- 2,028 prospects in DB across Canada
- 4 cold email sequences written
- PDF proposal generator (Puppeteer)
- Rule-based chatbot
- All API endpoints working
- PM2 process management

## What's NOT Done ❌ (Priority Order)

### 🔴 Immediate (to make money)
1. **Enrich prospect emails** — most records have no email. Need scraping (Apollo.io, Hunter.io, or manual) before outreach can start
2. **Email sending infrastructure** — need domain + SendGrid/Mailgun/SMTP setup
3. **Domain registration** — momentum-ai.ca (or .com)
4. **Deploy to live server** — VPS or Vercel + domain

### 🟡 Soon
5. **Upgrade chatbot** — connect to OpenAI API for real responses
6. **Email notifications** — alert Lucky when new lead submits
7. **Email tracking** — open/click tracking in sequences
8. **Business registration** — Momentum AI Inc. (NUANS search)

### 🟢 Nice to Have
9. **Social media** — Instagram + LinkedIn
10. **Real testimonials** — replace fake ones once clients sign
11. **Blog content** — populate 3 article stubs

---

## GitHub

**Repo:** github.com/pavc1996/momentum-ai
**Owner:** Pavc1996

```bash
# Push changes
git add -A && git commit -m "feat: description" && git push
```

---

## Biggest Bottleneck

**The list is loaded but emails are missing.** 2,028 prospects, zero contacted. The infrastructure to send doesn't exist yet (no domain, no email sending setup). Once those two things are in place, outreach can start immediately — the sequences are already written.

---

*Last updated: 2026-03-19 by G*
