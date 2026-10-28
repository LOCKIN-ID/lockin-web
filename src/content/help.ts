/**
 * The written help centre. Twelve articles, five categories, authored in Markdown and
 * rendered by `src/components/marketing/markdown.tsx`: headings, paragraphs, lists,
 * inline code and fenced code only, so there is no HTML passthrough and no injection
 * surface.
 *
 * `keywords` are what the support helper retrieves on (space-separated, matched against
 * the question with simple overlap scoring), so they hold the words a reader would type,
 * not the words the article uses.
 */
export interface HelpCategory {
  slug: string;
  title: string;
  blurb: string;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "start-here",
    title: "Start here",
    blurb: "What LOCK.IN is, what it costs, and the fastest way to your first run.",
  },
  {
    slug: "account",
    title: "Account & access",
    blurb: "Signing in, keeping a streak alive, devices, and deleting what we hold.",
  },
  {
    slug: "payments",
    title: "Payments",
    blurb: "Prices, QRIS and bank transfer, receipts, refunds, and coupons.",
  },
  {
    slug: "books-and-quests",
    title: "Books, playground & quests",
    blurb: "The reader, the four runtimes, QR codes, XP and badges.",
  },
  {
    slug: "legal",
    title: "Privacy, terms & licences",
    blurb: "What we hold about you, what a purchase buys, and whose code we ship.",
  },
];

export interface HelpArticleSeed {
  slug: string;
  title: string;
  category: string;
  summary: string;
  bodyMd: string;
  keywords: string;
  sortOrder: number;
}

export const HELP_ARTICLES: HelpArticleSeed[] = [
  {
    slug: "what-is-lockin",
    title: "What LOCK.IN actually is",
    category: "start-here",
    summary: "Three books, four runtimes, and a notebook of things you can run on the page.",
    keywords: "what is lockin ebook course indonesia belajar coding beginner start",
    sortOrder: 1,
    bodyMd: `LOCK.IN is three e-books that you read and run at the same time. Every code block in them can be executed in the page: HTML renders beside the text, JavaScript and Python print to the panel below the block, and shell commands list a small in-memory filesystem.

## What you get

- **Beginner: "Zero to one page".** HTML and CSS, written for someone who has never opened a code editor.
- **Intermediate: "Bikin yang hidup".** JavaScript: values, functions, the DOM, events, and the small state that makes a page feel alive.
- **Expert: "Spesialis Riko".** Python and the shell on real files: read a log, turn it into a report, and make the whole job safe to run twice.

## What it is not

- No video lectures you have to sit through. The text is the lesson and the run button is the practice.
- No subscription required to start. The first chapter of every book is free, and the playground is free.
- No certificate for reading a page. Badges and XP are earned by finishing sections, passing checkpoints and completing quests.

If you want to know what to do first, read [How to get your first run working](/help/first-run).`,
  },
  {
    slug: "first-run",
    title: "Your first run, in two minutes",
    category: "start-here",
    summary: "Where the Run button is, what it is doing, and why nothing installs.",
    keywords: "run button playground error python first section install editor",
    sortOrder: 2,
    bodyMd: `Every runnable block has a **Run** button in its header. Press it and the block's output appears underneath. Nothing is installed on your machine: the page runs the code for you.

## The four runtimes

- **HTML**: the block's markup is rendered in a sandboxed frame next to it.
- **JavaScript**: runs in a Web Worker, so \`console.log\` output arrives as lines.
- **Python**: a real CPython build compiled to WebAssembly, loaded the first time you press Run. That first press takes a few seconds.
- **Shell**: one command per line, against a small in-memory filesystem. \`ls\`, \`cat\`, \`mkdir\`, \`echo\` and friends all work; nothing you do there touches your computer.

## When nothing appears

1. Check the output panel for a red line. The engine reports errors in the same place as normal output.
2. Read the last line of the error first: that is usually the message, and the lines above it are the trail.
3. Still stuck? Open the coach panel and paste the error. With no AI key configured it still answers, from a fixed four-step ladder that starts by pointing you at the exact section.

Read-only blocks are labelled: \`HTML\` blocks that show a file's contents are marked **read-only** and have no Run button, because a fragment is not a whole document.`,
  },
  {
    slug: "streaks-and-xp",
    title: "Streaks, XP and what resets them",
    category: "account",
    summary: "A streak counts days you practised, not days you signed in.",
    keywords: "streak xp points reset lost timezone jakarta midnight day badge level",
    sortOrder: 3,
    bodyMd: `Days are counted in **Asia/Jakarta (UTC+7)** and roll over at midnight. A streak day is a day on which you did at least one qualifying thing: finished a section, passed a checkpoint, completed a quest, or ran a snippet.

## XP you can count on

| Action | XP |
| --- | --- |
| Finish a section | 5 |
| Pass a checkpoint | 25 |
| Quiz quest | 15 |
| Repo, video or bank soal quest | 10 |
| A playground run | 2, up to 10 a day |
| Daily streak | 10, more once the streak is long |
| A new badge | its own reward, 5–40 |

XP is awarded once per thing. Finishing the same section a second time moves nothing: that is deliberate, so grinding cannot buy position on the leaderboard.

## When a streak breaks

If a day passes with no qualifying action, \`streakCurrent\` goes back to 1 on your next action; your best streak is kept forever. The reminder e-mail (if you left it on) is sent at 19:00 Jakarta time on a day you have not acted yet. You can turn it off in [Settings](/app/settings).`,
  },
  {
    slug: "sign-in-and-devices",
    title: "Signing in and using more than one device",
    category: "account",
    summary: "One account everywhere; progress follows you, not the browser.",
    keywords: "login register password reset email session device phone laptop sign in",
    sortOrder: 4,
    bodyMd: `Your progress lives with your account, so signing in on a phone shows the same streak, XP and finished sections as your laptop.

## Settling a password

Use **Forgot password** on the sign-in page. The e-mail arrives from the address in the footer; if it does not appear within a few minutes, look in spam, then [open a ticket](/contact).

## Sessions

A session lasts 30 days and is refreshed at most once a day. Signing out on one device does not sign you out on the others. If you think someone else has your password, change it from [Settings](/app/settings): old sessions stop working at the next refresh.`,
  },
  {
    slug: "prices-and-payment",
    title: "Prices, and how paying works",
    category: "payments",
    summary: "What each book costs, and what happens after you scan the QRIS code.",
    keywords: "price harga payment bayar qris bank transfer va receipt invoice midtrans refund coupon",
    sortOrder: 5,
    bodyMd: `Prices are in Indonesian rupiah and shown before you commit to anything. Each book is bought once and stays in your library.

## Paying

1. Press **Buy** on a book or on [Pricing](/pricing). We create the order first and show you the amount.
2. Choose a channel: **QRIS** (scan the code with any Indonesian banking or e-wallet app) or a **virtual account** number to transfer to.
3. The order holds for 30 minutes. After that it expires and nothing is charged.
4. As soon as the payment settles, the book appears in your library and the reader unlocks. A receipt is e-mailed to you.

## Coupons

A coupon code is entered on the checkout page before payment. Codes are single-use per account and are checked against their expiry date and use cap at the moment you pay, not when you typed them.

## Refunds

If a book does not work for you: wrong level, a runtime that will not load on your device: [open a ticket](/contact) within 7 days of buying and we refund it. Include the order reference from your receipt.`,
  },
  {
    slug: "missing-book-after-payment",
    title: "Paid but the book is still locked",
    category: "payments",
    summary: "Usually a settlement that has not arrived yet; here is how to check.",
    keywords: "paid not unlocked locked missing book entitlement pending order payment stuck",
    sortOrder: 6,
    bodyMd: `Payment confirmation is asynchronous: your bank tells the gateway, and the gateway tells us. That gap is normally seconds, occasionally a few minutes.

## Check it yourself

1. Open [Orders](/app/settings): an order that says **pending** has not settled yet; **paid** means the entitlement exists.
2. Reload the book page. Entitlement is read fresh on every load, so there is no cache to clear.
3. If the order is **paid** and the book is still locked, sign out and back in so a new session is issued, then reload once more.

## If it is still locked

[Open a ticket](/contact) with the order reference (it looks like \`LOCKIN-...\`) and the e-mail address you paid with. Do not pay twice: a second payment for the same book is refunded in full.`,
  },
  {
    slug: "playground-limits",
    title: "What the playground will not do",
    category: "books-and-quests",
    summary: "Python in WebAssembly and a shell in a sandbox: capable, but not your terminal.",
    keywords: "playground python shell limit package pip install network file download wasm sandbox error",
    sortOrder: 7,
    bodyMd: `The playground runs real interpreters in your browser, inside a sandbox. That is what keeps it free and safe, and it comes with a few honest limits.

## Python

- Standard library only. \`pip install\` is unavailable, so a snippet that imports \`requests\` or \`pandas\` will fail with \`ModuleNotFoundError\`.
- No network access and no writing to your disk.
- The first Run in a session downloads the runtime (a few megabytes), so it is slower than the ones after it.

## Shell

- One command per line. Pipes, redirects and quoting behave as in a shell, but loops and multi-line constructs are not supported.
- The filesystem is in memory: it starts with the same seed files every session and forgets everything when you reload.
- \`curl\`, \`git\` and anything that leaves the sandbox are not available.

## When the panel stays empty

If a Run produces no output at all, the block printed nothing: check for a \`print\` or a \`console.log\`. A run that fails always says so.`,
  },
  {
    slug: "quests-and-qr",
    title: "Quests, QR codes and the 6-character code",
    category: "books-and-quests",
    summary: "How a printed code turns into XP, and what to do when it is expired.",
    keywords: "quest qr code scan camera expired revoked 410 class instructor bank soal quiz",
    sortOrder: 8,
    bodyMd: `A quest is a short piece of work with a reward at the end. Some are printed on paper with a QR code; some sit inside a chapter.

## Scanning or typing

- Point your camera at the QR code: the Scan button appears on [Quests](/app/quests) only when your browser can decode it.
- No camera, or a code photographed badly? Type the **6-character code** printed under the QR. Case does not matter.

## Five kinds of quest

\`quiz\` and \`checkpoint\` check understanding, \`repo\` asks for a link and a note about what you changed, \`video\` pairs a clip with three recall questions, and \`bank_soal\` gives twelve randomised items and keeps your best score.

## If a code does not work

- **"Code expired"**: the quest's window has closed. Nothing is lost; ask your instructor for the next one.
- **"Code withdrawn"**: the instructor revoked it. The manual code field on [Quests](/app/quests) is still the way in if a replacement exists.
- **Nothing at all**: check for a typo, then type it rather than photographing it; \`B\` and \`8\` are the usual culprits.`,
  },
  {
    slug: "certificates-and-pdf",
    title: "The PDF edition, printing, and proof of finishing",
    category: "books-and-quests",
    summary: "What the PDF tab is, how to print a book, and what we do not issue.",
    keywords: "pdf download print certificate certificate of completion offline ebook proof qr",
    sortOrder: 9,
    bodyMd: `Every book you own has a PDF tab in the reader. It is the same text as the web edition, laid out for A4 with the chapter's QR codes printed inline so a paper copy still leads back to the online quest.

## Getting the file

- **PDF tab**: reads the edition online, and stays on the same chapter's page.
- **Download**: from the tab, and from [Library](/app/library).
- If the tab says *PDF not generated yet*, the edition has not been built for that book. The web reader is complete without it.

## Printing

Print from the PDF (A4, colour). The cover is forest green with the lockup; the shapes and rules are part of the brand, so print backgrounds on if your printer supports it.

## Certificates

We do not issue certificates. What we can show you is a real record: sections finished, checkpoints passed, quests completed, badges earned and XP: all on [Profile](/app). Employers who want more than that are asking for work, and the books end with a project you can point at.`,
  },
  {
    slug: "privacy",
    title: "What LOCK.IN keeps about you",
    category: "legal",
    summary: "The account, the progress, the orders: and the three things that never leave your browser.",
    keywords: "privacy data personal information delete account gdpr trackers cookies analytics storage",
    sortOrder: 10,
    bodyMd: `Everything below is what the running site actually stores. There is no analytics script, no advertising pixel and no cross-site tracker in the page.

## On your account

- **You**: the e-mail address you signed up with, the name you gave, and how to check your password: a hash, never the password itself. Signing in with Google stores the provider's account id instead.
- **Your work**: which books and which days you have read, the XP those days earned, badges, quest completions and their scores, and the chapters you stopped at.
- **What you make**: a playground run is saved only when you press **Share**; the tutoring and support threads you start are kept so the next answer knows what was already said.
- **Money**: the order: what it was, what it cost, which channel it used, and whether it settled: plus the receipt already e-mailed to you. Card, QRIS and virtual-account numbers go to the payment provider, never to us; we are told the result, not the instrument.
- **Tickets**: what you wrote and our replies, because a thread that forgets itself is not support.

## On your machine only

Theme, language, the draft in the playground editor and the section you were reading are kept in the browser's own storage. Clearing site data clears those and nothing else: your account and progress are untouched.

## Deleting it

Deletion is done by hand: [open a ticket](/contact) from the account's own e-mail and the profile goes with its progress, XP, badges, quest completions, saved runs and threads. Order records that a receipt has been issued for are kept for accounting; nothing else about you is.`,
  },
  {
    slug: "terms-of-sale",
    title: "What a purchase buys, and what happens after",
    category: "legal",
    summary: "One book forever, Pro for thirty-one days, and a seven-day refund on either.",
    keywords: "terms of sale licence license license agreement refund cancel subscription renew pro buy invoice tax",
    sortOrder: 11,
    bodyMd: `## What you are buying

- **A book**: the web edition, its PDF, its quests and its corrections, for as long as the site runs. Bought once. [The three books](/books).
- **Pro**: every book for thirty days, plus one day of grace so a renewal is never late. [Pricing](/pricing).

Prices are in Indonesian rupiah and are the amount you pay: nothing is added at checkout. An order holds for 30 minutes while you pay, and after that it expires with nothing charged.

## Nothing renews by itself

Pro is a one-off purchase, not a standing charge. Buying it again while a term is still running **extends** that term day for day from its end, so no day is lost.

## Refunds

Write to us within **7 days** of buying: [open a ticket](/contact) with the order reference from your receipt: and we refund it, in full, no reason required. If you paid twice for the same book, the second payment is refunded in full whether or not you ask.

## The deal

- The books, their PDFs and their videos are for you: read them, run them, keep them. They are not for resale, and a PDF sent round a group chat is not a sale.
- The code in the books is yours to reuse in your own work, with no attribution owed.
- One purchase, one reader. An account is personal; the sessions on it are yours.
- Quest codes are meant to expire, be withdrawn and be handed out per class. A code that stops working is the system working.

## Changes

The books are corrected as mistakes are found, and buyers get those corrections without paying again. Prices can change for new buyers; what you have already bought and what you have already paid do not.`,
  },
  {
    slug: "licences",
    title: "Third-party licences",
    category: "legal",
    summary: "Whose runtime, font and framework this site is built on, and where each licence text lives.",
    keywords: "licences licenses open source gpl mit ofl pyodide busybox wasm fonts attribution",
    sortOrder: 12,
    bodyMd: `LOCK.IN ships other people's work. This is the list, with the licence and how to reach its text.

## The runtimes

- **busybox.wasm**: the shell runtime, a WebAssembly build of [busybox](https://busybox.net) from the wasi-sh project, under the **GNU GPL v2**. Licence text: [\`/licenses/busybox-GPL-2.0.txt\`](/licenses/busybox-GPL-2.0.txt).
- **wasi-sh glue**: the syscall shim around it, under the **ISC licence**: [\`/licenses/wasi-sh-ISC.txt\`](/licenses/wasi-sh-ISC.txt).
- **Pyodide**: the Python runtime, under the **Mozilla Public License 2.0**, loaded into the page's worker from the jsDelivr CDN when you run a Python block.

A GPL binary is offered with its source. Write to us from [Contact](/contact) and we send the exact source of the busybox build this site serves, or point you at the build recipe.

## The type and the framework

- **Archivo**, **Inter** and **JetBrains Mono** are under the **SIL Open Font License 1.1**, self-hosted in the app.
- **Next.js** and **React** are under the **MIT licence**.
- The design system follows [hallmark](https://github.com/nutlope/hallmark) (**MIT**).

## Your side of it

Nothing in your account depends on these: they are the reason a code block on a page can actually run. The books themselves are ours, and [the terms of sale](/help/terms-of-sale) say what you may do with them.`,
  },
];
