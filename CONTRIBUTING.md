# Contributing to LOCK.IN

## Prerequisites

- **Node 24** (`.nvmrc`); `nvm use` or `fnm use` picks it up.
- **npm ≥ 11**. Node 24 ships npm 11, which runs install scripts normally. npm 12 blocks them by
  default and needs one extra approval (see Setup).

## Setup

```bash
cp .env.example .env
npm install
npm run wasm:sync
npm run db:migrate
npm run db:seed
npm run dev
```

The app then runs at <http://localhost:3000> with an empty-but-populated demo database.

Two things about this project that differ from a stock Next.js app:

- **`.env`, not `.env.local`.** The Prisma CLI (`prisma.config.ts`) and the seed
  (`prisma/seed.ts`) both `import "dotenv/config"`, which reads `.env` only. A variable placed in
  `.env.local` is invisible to `db:migrate` and `db:seed`.
- **If `npm install` ran on npm ≥ 12**, approve the SQLite binding once before touching the
  database, or every query fails with `Could not locate the bindings file`:
  ```bash
  npm install-scripts approve better-sqlite3
  ```
  `@prisma/adapter-better-sqlite3` pins `better-sqlite3@^12.6.0`, which ships no prebuild, so it
  must be compiled locally. The root `better-sqlite3@13.0.3` does ship one.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lockin.test` | `lockin-admin-2026` |
| Learner | `student@lockin.test` | `lockin-student-2026` |

The learner starts with three days of history (XP, streak, two badges) so the dashboard,
leaderboard and rewards screens are not empty.

## Branches and pull requests

Prefix every branch: `feat/`, `fix/`, `chore/`, or `docs/`.

**Never push to `main` directly.** Branch protection cannot be enabled on this repository: the
`LOCKIN-ID` organisation is on the GitHub free plan, and GitHub answers
`403 Upgrade to GitHub Pro or make this repository public`. This rule is therefore enforced by
agreement, not by GitHub. Keep `main` green by merging only through a pull request with at least
one approval from another collaborator, squash merge, and a description that says what you
verified.

## What CI runs

Every pull request and every push to `main` runs `.github/workflows/ci.yml` on Node 24:

```bash
npm ci
cp .env.example .env
npm run db:deploy
npx tsc --noEmit
npm run test
npm run build
```

`npm run db:deploy` is `prisma migrate deploy`: it applies committed migrations without writing
new ones. Use `npm run db:migrate` locally instead.

## Checks CI does not run

These need a real browser or a running server, so run them locally before requesting review when
your change touches their area.

| Command | Needs | Covers |
| --- | --- | --- |
| `npm run smoke` | dev server on :3000; Chrome/Chromium (`CHROME_PATH`, or `scripts/chrome-path.mjs` finds one) | six end-to-end flows: landing, catalogue, roadmap, help search, pricing, QR redirect |
| `npm run shots` | dev server; Chrome; seeded users | screenshot audit of learner and admin surfaces into `.hallmark/shots/` |
| `npm run ebook:pdf` | dev server; Chrome | prints the three A4 PDFs into `public/ebooks/`, asserting 15–25 pages each |
| `npm run design:lint` | **unusable here** | see below |

`npm run design:lint` and `npm run design:lint:render` resolve
`$USERPROFILE/.omp/agent/skills/hallmark/scripts/sloplint.mjs`, which lives outside this repository
and is not installed on a normal machine. `design:lint` catches the failure and exits `0` anyway, so
a green run means nothing. Do not cite it as verification; if you need it, install Hallmark
yourself and point the script at it.

## Migrations

```bash
npm run db:migrate -- --name add_slippage_column
```

Commit the generated `prisma/migrations/<timestamp>_<name>/migration.sql`. Never edit a migration
that is already merged: add a new one. `npm run db:reset` rebuilds the local database from the
migrations and re-runs the seed.

## Authoring book content

Books live in `src/content/books/{beginner,intermediate,expert}.ts` and are validated at import
time by `assertBooksContent` (`src/content/assert.ts`). A dangling quest slug, a duplicate id, or a
chapter whose derived page count leaves the 15–25 range fails `npm run build`, `npm run test` and
`npm run db:seed` together, so content mistakes cannot reach a reader silently.

Do not write page numbers: `defineBook` (`src/content/define.ts`) derives them from each chapter's
`minutes` at ten minutes per page, with a two-page floor. After editing content, re-run
`npm run db:seed`; every write in it is an upsert, so it is safe to repeat.

## Secrets

`.env*` is git-ignored except `.env.example`. Every value the app reads must have an entry there
with a default that keeps the offline demo working (SQLite, mock payments, MailDev SMTP, offline
tutor). Never commit a real key, and never add a required secret without a working local default.
