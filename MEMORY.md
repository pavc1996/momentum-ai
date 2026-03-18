# MEMORY.md — Long-Term Memory

## Who Am I
- **Name:** G (ghost in the machine, 👾)
- **Human:** Lucky (@LuckyNFT444 on Telegram, Pavc1996 on GitHub)
- **Style:** Sharp, fast, no-fluff. Lucky wants results over process. Driven, here to make big money.
- **Timezone:** America/Toronto (EST/EDT)
- **First contact:** Sunday 2026-03-15

## Important Credentials (REDACTED — in secure storage)
- **GitHub:** Pavc1996
- **GitHub Token:** [stored in git remote URLs, not in plaintext]

## Projects Built

### 1. Momentum AI
- **What:** AI services agency website for Canadian small businesses
- **Repo:** github.com/pavc1996/momentum-ai
- **Local:** http://localhost:8080 (PM2: momentum-ai)
- **Stack:** Node.js + Express + SQLite
- **Status:** Running locally, not deployed to public domain yet
- **DB:** 1 lead, 475 outreach prospects (225 London ON restaurants + 250 GTA mix)
- **Features:** Landing page, CRM, proposal PDF generator, chatbot, cold email sequences, outreach stats

### 2. Budget App (Canadian)
- **What:** Personal finance tracker for Canadians (TFSA, RRSP, HST, etc.)
- **Repo:** github.com/pavc1996/budget-app (PRIVATE)
- **Local:** http://localhost:8082 (PM2: budget-ca)
- **Stack:** Node.js + Express + SQLite
- **Status:** Running locally
- **Features:** Accounts, transactions, budgets, savings goals, recurring bills, insights, CSV import/export, net worth history, edit transactions

### 3. Shaadi Abroad
- **What:** Premium Indian destination wedding company targeting Canadian clients
- **Repo:** github.com/pavc1996/shaadi-abroad
- **Local:** npm run dev → http://localhost:3000
- **Stack:** Next.js 14 + TypeScript + Tailwind + SQLite
- **Status:** 22 pages, builds clean, pushed to GitHub, not yet deployed
- **Features:** Full marketing site, inquiry form, admin CRM, client dashboard, blog, gallery, real weddings, quiz, 6 destination pages, 4 packages
- **Admin password:** shaadi2026
- **Content pack:** social media, SEO, email templates, brand identity, launch checklist

## Key Patterns
- Lucky sends rapid-fire messages — don't wait for "are you done?", just build and report
- Lucky likes to see results on GitHub and live URLs
- When building, do it directly — Claude Code agent times out on big tasks
- Lucky goes to bed late (~1am EST) and wants overnight builds
- Push to GitHub every ~1 hour of work
- Always commit with clear, descriptive messages
- Create CLAUDE.md for every project — it's the brain for future sessions

## Technical Notes
- Mac mini (ClawBot's Mac mini), macOS arm64
- PM2 for process management
- SQLite for all local DBs
- GitHub token stored in git remote URLs (not in files)
- Vercel deployment pending (need Vercel token from Lucky)
- Port 8080: Momentum AI, Port 8082: Budget App, Port 3000: Shaadi Abroad (dev)

## What's Next
- Deploy Shaadi Abroad to Vercel (need Lucky's Vercel token)
- Get domains for all projects
- Start cold email outreach for Momentum AI
- Register businesses
- Lucky might want more projects — he moves fast

---

*Last updated: 2026-03-18 02:00 EST*

### 4. Bags (NFT & Crypto Portfolio Tracker)
- **What:** Track crypto/NFT holdings, P&L, trades, watchlist
- **Repo:** github.com/pavc1996/nft-tracker (PRIVATE)
- **Local:** http://localhost:8083 (PM2: bags)
- **Stack:** Node.js + Express + SQLite
- **Status:** Running locally
- **Features:** Dashboard with charts, holdings with auto P&L, transaction log, watchlist with price alerts, multi-wallet, bulk price update API
