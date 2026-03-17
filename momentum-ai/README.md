# Momentum AI — Business Stack

**"We Build The Tools. You Make The Money."**

## What's Running

| Service | URL |
|---------|-----|
| Main website | http://localhost:8080 |
| Admin / Leads | http://localhost:8080/admin.html |
| CRM / Outreach | http://localhost:8080/crm.html |
| Server process | `pm2 status` |

## Stack
- **Node.js + Express** — backend server
- **SQLite (better-sqlite3)** — leads + outreach database
- **Puppeteer** — PDF proposal generation
- **PM2** — process manager (auto-restart)

## Key Files
```
server.js              — API backend (leads, chat, proposals, outreach)
proposal-generator.js  — PDF proposal engine
index.html             — Main website
admin.html             — Leads dashboard
crm.html               — CRM + outreach tracker + proposal generator
cold-email-sequences.md — 4 industry-specific email sequences
```

## APIs
```
POST /api/leads         — Submit contact form lead
GET  /api/leads         — View all leads
PATCH /api/leads/:id    — Update lead status/notes

POST /api/chat          — AI chatbot response
POST /api/proposals     — Generate + download PDF proposal

GET  /api/outreach      — View all prospects
POST /api/outreach      — Add prospect
PATCH /api/outreach/:id — Update prospect status
DELETE /api/outreach/:id — Remove prospect
```

## Cold Outreach
- **82 prospects** loaded in the CRM (Toronto + GTA)
- Industries: restaurants, trades, health/wellness, legal/finance, retail, auto, childcare, pet, events
- **4 email sequences** ready in `cold-email-sequences.md`
- Recommended tool for scale: Instantly.ai or Lemlist

## Proposal Packages
| Package | Price | Best For |
|---------|-------|----------|
| Starter | $299/mo | Basic website + SEO |
| Growth  | $699/mo | Chatbot + automation + SEO content |
| Scale   | $1,499/mo | Full AI suite + dedicated manager |

## Server Management
```bash
pm2 status              # Check status
pm2 restart momentum-ai # Restart
pm2 logs momentum-ai    # View logs
```

## Next Steps
1. Register domain (momentum-ai.ca)
2. Deploy to VPS (DigitalOcean / Hetzner)
3. Set up SSL (Let's Encrypt)
4. Start cold outreach with email sequences
5. Build Telegram bot for mobile control
