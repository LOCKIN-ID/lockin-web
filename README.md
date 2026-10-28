# LOCK.IN — Interactive Developer E-Books & Learning Ecosystem

Full-stack web platform for **LOCK.IN**: short, high-density, interactive e-books (15–25 pages) that teach by making readers run real code in the browser, complete with physical QR code continuations, Socratic AI coaching, and gamified retention.

Built with [hallmark](https://github.com/nutlope/hallmark) (commit `7ec868225c6caa040558c321ee0fefa0e73f83a8`) using brand tokens extracted directly from `Lock.in.pdf`.

```
Hallmark static: 0 FAIL · 0 REFLEX · 0 WARN across 55 files
Hallmark render: 0 FAIL across 12 public routes
47/47 unit tests passing · 51/51 routes statically/SSG compiled · 6/6 smoke flows verified
```

---

## Features

### 1. The Interactive Reader
- **15–25 Pages, Zero Fluff:** Curated chapters for *Beginner* ("Start here"), *Intermediate* ("Build things"), and *Expert* ("Spesialis Riko").
- **Real In-Browser Execution:** Every code block runs directly across HTML, JavaScript, Python (Pyodide), and Linux Shell (BusyBox WebAssembly).
- **Interactive Checkpoints:** Progressive multi-question quizzes with immediate explanations and Socratic hints.
- **Reading Heartbeat & Progress Rail:** Non-animated, scale-based progress tracking with 15s reading heartbeats.

### 2. Socratic AI Coaching
- **Guidance Over Answers:** Refuses to write code for the learner; instead uses a 4-level ladder (Clarify intent → Concept explanation → Micro-example with different variables → Guided self-correction).
- **Multi-Provider Support:** Supports `offline` (deterministic pure ladder), `openrouter`, and `gemini` with automatic fallback.
- **Help Center Support Coach:** Embedded support assistant that searches documentation and escalates to human tickets or WhatsApp.

### 3. QR Codes & Quests
- **Print + Digital Continuity:** Each chapter in the print PDF carries a unique QR code (SVG + PNG) and 6-character fallback code.
- **5 Quest Runners:** Quizzes, GitHub starter repos with change verification, video comprehension challenges, challenge banks (*bank soal*), and checkpoints.
- **Short Redirects (`/q/<slug>`):** HTTP 307 redirects to authenticated quest views, returning 410 on revoked/expired keys.

### 4. Full-Featured Code Playground
- Full-screen workspace with Tab indentation and line-number gutters.
- Persistent WebAssembly Linux filesystem (BusyBox) stored in browser storage.
- Shareable URL hashes (`#s=...`) using `CompressionStream("deflate-raw")` with zero server logging.

### 5. Gamification & Retention
- **XP Engine:** Idempotent event ledger (`XpEvent`) tracking points for reading, checkpoints, quests, streaks, and purchases.
- **Asia/Jakarta Streak Tracker:** Unbroken streak calculation based on fixed UTC+7 Jakarta calendar days.
- **11 Unlocked Badges:** Evaluated dynamically against real database activity (clean runs, language diversity, midnight sessions).
- **Rewards Store:** Spend XP on cheatsheets, code templates, and book discount coupons.
- **Weekly & All-Time Leaderboards:** Top 100 rankings with pinned viewer row.

### 6. Payments & Entitlements
- **Server-Side Pricing:** The client never sends a price; orders are priced strictly from the database.
- **Payment Providers:** Dual-mode support for Midtrans Snap / Webhooks and an instant sandbox Mock Gateway.
- **Entitlement Gates:** Single authority (`canOpen`) controlling the reader, PDF downloads, and playground exercises.

### 7. Administrative Suite
- Comprehensive admin operations at `/admin`: orders audit, catalog management, PDF upload, QR regeneration, user roles & XP adjustment, email queue management, and support ticket desk.

### 8. Printable A4 PDF Pipeline
- Dedicated printable route (`/print/books/[slug]`) adhering strictly to A4 margins and Hallmark typography.
- Puppeteer-Core + Microsoft Edge script (`npm run ebook:pdf`) compiling 21-page PDFs.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5 (Strict Mode, no unchecked casts)
- **Database & ORM:** SQLite via Better-SQLite3, Prisma 7 with Driver Adapter
- **Authentication:** Better-Auth with Admin & Next-Cookies plugins
- **Styling:** CSS Tokens & Base Rules (Design System from `Lock.in.pdf`)
- **Runtimes:** WebAssembly BusyBox (`wasi-sh`), Pyodide Python, Sandboxed Worker JS
- **Testing & Tooling:** Vitest 5, Puppeteer-Core, QRCode

---

## Quick Start

### 1. Setup Environment
```bash
cp .env.example .env
npm install
npm run wasm:sync
```

### 2. Database Migration & Seed
```bash
npm run db:migrate
npm run db:seed
```

Seeded credentials:
- **Admin:** `admin@lockin.test` / `lockin-admin-2026`
- **Learner:** `student@lockin.test` / `lockin-student-2026`

### 3. Generate QR Codes & E-Book PDFs
```bash
npm run qr:build
# Start the dev server in one terminal:
npm run dev
# Generate PDFs in another terminal:
npm run ebook:pdf
```

### 4. Run Tests & Validation
```bash
# Typecheck
npx tsc --noEmit

# Unit & runtime engine tests (47 tests)
npm run test

# Hallmark design lint (static source & structure: 0 FAIL, 0 REFLEX, 0 WARN)
npm run design:lint

# Hallmark render tier lint (12 routes at 1440 & 375 viewports: 0 FAIL)
npm run design:lint:render

# End-to-end smoke verification (6 behavioral flows)
npm run smoke

# Authenticated screenshot audit (learner & admin surfaces)
npm run shots

# Production build (51 routes)
npm run build
```
