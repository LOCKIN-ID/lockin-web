# Contributing to LOCK.IN

## Prerequisites

- **Node 22.12 or newer.** `.nvmrc` pins 24, which is what CI uses; `nvm use` or `fnm use` picks
  it up. 22.12 is the floor because that is what `vitest` declares; nothing here needs 24 exactly.
- **npm** (any version; Node 24 ships npm 11).
- **Git.**

Nothing else. No database server, no Docker, no API keys, no accounts with any service — the demo
runs entirely offline on a SQLite file.

## Setup

```bash
git clone https://github.com/LOCKIN-ID/lockin-web.git
cd lockin-web
npm run setup
npm run dev
```

`npm run setup` is safe to run again at any time. It reinstalls dependencies, re-applies
migrations, and skips seeding when the database already exists, so your test data survives.

The app then runs at <http://localhost:3000>.

### If the one-liner fails

Run the same steps by hand. `cp` is the only platform-specific part — it works in macOS, Linux,
PowerShell and Git Bash, but **not** in `cmd.exe`, where it is `copy`:

```bash
cp .env.example .env          # macOS, Linux, PowerShell, Git Bash
copy .env.example .env        # Windows cmd.exe
npm install
npm run wasm:sync
npm run db:deploy
npm run db:seed
npm run test
```

Two things about this project that differ from a stock Next.js app:

- **`.env`, not `.env.local`.** The Prisma CLI (`prisma.config.ts`) and the seed
  (`prisma/seed.ts`) both `import "dotenv/config"`, which reads `.env` only. A variable placed in
  `.env.local` is invisible to `db:deploy` and `db:seed`.
- **`db:deploy`, not `db:migrate`.** `db:migrate` is `prisma migrate dev`: it is interactive and
  writes new migration files, which a fresh clone does not have. `db:deploy` only applies what is
  committed.

The SQLite binding needs no manual approval on any npm version: `package.json` already lists
`allowScripts: { "better-sqlite3": true }` (npm ≥ 12 blocks install scripts by default), and
`better-sqlite3@12.11.1` publishes prebuilt binaries for Linux, macOS and Windows on x64 and arm64,
so nothing is compiled locally and no compiler toolchain is required.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lockin.test` | `lockin-admin-2026` |
| Learner | `student@lockin.test` | `lockin-student-2026` |

The learner starts with three days of history (XP, streak, two badges) so the dashboard,
leaderboard and rewards screens are not empty.

## Inviting a collaborator

The repository is **private**: an org admin must invite the person on GitHub before any of this
works for them. After they accept, send them this:

> Clone the repo and run two commands:
>
> ```bash
> git clone https://github.com/LOCKIN-ID/lockin-web.git
> cd lockin-web
> npm run setup
> npm run dev
> ```
>
> Open <http://localhost:3000>. Sign in as `admin@lockin.test` / `lockin-admin-2026`, or as a
> learner with `student@lockin.test` / `lockin-student-2026`.
>
> You need Node 22.12+ (24 is pinned in `.nvmrc`) and Git. Nothing else: **no API keys, no Docker,
> no database server.** Everything runs offline against a local SQLite file.
>
> To contribute: never push to `main`. Make a branch, open a pull request. The details are in
> `CONTRIBUTING.md` in the repo.

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
