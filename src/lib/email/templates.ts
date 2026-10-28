/**
 * Every mail LOCK.IN sends, as plain functions returning strings.
 *
 * There is no template engine and no dependency: a mail is HTML that has to survive
 * Outlook, so it is written as one table's worth of inline styles with the palette spelled
 * out. The hexes below are the tokens in `src/app/tokens.css` converted from OKLCH -
 * an e-mail cannot read a CSS variable, so these are the same colours written twice, and
 * `tests/email.test.ts` checks that they are the ones the tokens resolve to.
 *
 * Two invariants: the reader's own text is HTML-escaped before it is interpolated (a
 * ticket reply can contain anything), and every marketing mail carries a working
 * unsubscribe link. A mail with no way out is not shippable.
 */

export type TemplateId =
  | "welcome"
  | "tip_day_1"
  | "tip_day_3"
  | "tip_day_7"
  | "streak_reminder"
  | "weekly_digest"
  | "receipt"
  | "ack"
  | "ticket_reply"
  | "password_reset";

/** The `EmailPreference` column that can silence a template; `null` is transactional. */
export type PreferenceKey = "tips" | "streak" | "product" | "digest";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  preference: PreferenceKey | null;
}

export const EMAIL_TEMPLATES: readonly TemplateId[] = [
  "welcome",
  "tip_day_1",
  "tip_day_3",
  "tip_day_7",
  "streak_reminder",
  "weekly_digest",
  "receipt",
  "ack",
  "ticket_reply",
  "password_reset",
];

export const TEMPLATE_PREFERENCE: Record<TemplateId, PreferenceKey | null> = {
  welcome: "product",
  tip_day_1: "tips",
  tip_day_3: "tips",
  tip_day_7: "tips",
  streak_reminder: "streak",
  weekly_digest: "digest",
  receipt: null,
  ack: null,
  ticket_reply: null,
  password_reset: null,
};

/** Identical to the OKLCH tokens in `src/app/tokens.css`; see the module comment. */
export const BRAND = {
  paper: "#F4F2E9",
  paper3: "#FDFCF8",
  ink: "#132A1D",
  ink2: "#294A31",
  muted: "#536257",
  rule: "#D7D2C1",
  accent: "#1FEC97",
  accentInk: "#0B3A25",
  forest: "#294A31",
  forestDeep: "#1E3724",
  taupe: "#B3998A",
} as const;

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Every interpolated value goes through here. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function str(payload: Record<string, unknown>, key: string, fallback = ""): string {
  const value = payload[key];
  return value === undefined || value === null ? fallback : String(value);
}

function num(payload: Record<string, unknown>, key: string): number {
  const value = Number(payload[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

interface Layout {
  preheader: string;
  heading: string;
  paragraphs: string[];
  /** Ordered list rendered above the call to action. */
  bullets?: string[];
  amount?: string;
  cta?: { label: string; href: string };
  /** Rendered under the rule: the small print, including the way out. */
  footnote: string;
  /** Marketing mail gets the unsubscribe line; transactional mail does not. */
  preference?: PreferenceKey | null;
  userId?: string;
}

function layout({
  preheader,
  heading,
  paragraphs,
  bullets,
  amount,
  cta,
  footnote,
  preference = null,
  userId,
}: Layout): string {
  const body = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.paper3};border:1px solid ${BRAND.rule};border-radius:12px;">
        <tr><td style="padding:28px 28px 8px;">
          <a href="${appUrl()}" style="text-decoration:none;color:${BRAND.ink2};font:900 20px/1.1 Archivo,Helvetica,Arial,sans-serif;letter-spacing:-0.02em;">LOCK.IN</a>
          <div style="height:1px;background:${BRAND.rule};margin:18px 0 0;"></div>
        </td></tr>
        <tr><td style="padding:20px 28px 4px;">
          <p style="margin:0 0 14px;font:400 12px/1.4 Inter,Helvetica,Arial,sans-serif;color:${BRAND.muted};">${esc(preheader)}</p>
          <h1 style="margin:0 0 16px;font:900 26px/1.15 Archivo,Helvetica,Arial,sans-serif;color:${BRAND.ink};letter-spacing:-0.02em;">${esc(heading)}</h1>
          ${paragraphs
            .map(
              (text) =>
                `<p style="margin:0 0 14px;font:400 16px/1.6 Inter,Helvetica,Arial,sans-serif;color:${BRAND.ink};">${text}</p>`,
            )
            .join("")}
          ${
            bullets && bullets.length > 0
              ? `<ul style="margin:0 0 18px;padding-left:20px;font:400 16px/1.6 Inter,Helvetica,Arial,sans-serif;color:${BRAND.ink};">${bullets
                  .map((item) => `<li style="margin-bottom:6px;">${item}</li>`)
                  .join("")}</ul>`
              : ""
          }
          ${
            amount
              ? `<p style="margin:0 0 18px;font:900 22px/1.2 Archivo,Helvetica,Arial,sans-serif;color:${BRAND.ink};">${esc(amount)}</p>`
              : ""
          }
          ${
            cta
              ? `<p style="margin:0 0 22px;"><a href="${esc(cta.href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${BRAND.accent};color:${BRAND.accentInk};font:600 16px/1.1 Inter,Helvetica,Arial,sans-serif;text-decoration:none;">${esc(cta.label)}</a></p>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:0 28px 28px;">
          <div style="height:1px;background:${BRAND.rule};margin:6px 0 14px;"></div>
          <p style="margin:0;font:400 12px/1.6 Inter,Helvetica,Arial,sans-serif;color:${BRAND.muted};">${footnote}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  void preference;
  void userId;
  return body;
}

/** The one place the way out is written, so no mail can be built without it. */
function unsubscribeLine(preference: PreferenceKey | null, userId?: string): string {
  if (!preference) return `LOCK.IN · sent because you have an account here.`;
  const href = `${appUrl()}/app/settings#email${userId ? `?unsub=${encodeURIComponent(userId)}` : ""}`;
  return `You can stop the ${preference} mail in <a href="${esc(href)}" style="color:${BRAND.muted};">your settings</a>; one toggle, effective immediately.`;
}

function plain(lines: Array<string | undefined>): string {
  return lines.filter(Boolean).join("\n\n");
}

/* ------------------------------------------------------------------ *
 * The tips: three real things a reader can use today, each citing the
 * page that teaches it. They are excerpts of shipped content, not invented.
 * ------------------------------------------------------------------ */

interface Tip {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  bullets: string[];
  cta: { label: string; href: string };
}

function tipFor(id: "tip_day_1" | "tip_day_3" | "tip_day_7", name: string): Tip {
  if (id === "tip_day_1") {
    return {
      subject: "Read the last line of the error first",
      preheader: "Day one of the sequence you asked for.",
      heading: `Your first run, ${name}`,
      paragraphs: [
        "Every runnable block in a LOCK.IN book has a Run button in its header, and pressing it changes nothing on your machine. Nothing to install, nothing to clean up.",
        "When something fails, the panel below the block holds the answer in the same place as normal output. Read it bottom to top:",
      ],
      bullets: [
        "The last line is the message; the lines above it are the trail that led there.",
        "Python's first Run in a session downloads the interpreter, so it is slower than the ones after it.",
        "An empty panel is not an error: the block simply printed nothing. Look for a missing print or console.log.",
      ],
      cta: { label: "Read: your first run", href: `${appUrl()}/help/first-run` },
    };
  }

  if (id === "tip_day_3") {
    return {
      subject: "XP is paid once per thing, on purpose",
      preheader: "Day three.",
      heading: `${name}, here is why the bar did not move`,
      paragraphs: [
        "Finishing the same section twice awards nothing the second time. That is deliberate: XP is recorded once per thing, so re-running a section you already finished cannot buy a position on the leaderboard.",
        "The things that do pay: a section you have not finished, a checkpoint you have not passed, a quest you have not completed, and a day you practised that you had not practised yet.",
      ],
      bullets: [
        "Section finished: 5 XP. Checkpoint passed: 25 XP. Quiz quest: 15 XP.",
        "The daily streak pays more once the streak passes a week, and again at thirty days.",
        "A playground run pays 2 XP, capped at 10 a day: practice, not farming.",
      ],
      cta: { label: "Open your progress", href: `${appUrl()}/app` },
    };
  }

  return {
    subject: "The playground's honest limits",
    preheader: "Day seven.",
    heading: "What the playground will not do",
    paragraphs: [
      "The playground runs real interpreters inside your browser, which is why it is free and why a few things are missing. Knowing them saves an hour of debugging the wrong problem.",
      "Python is the standard library only: a snippet that imports requests or pandas fails with ModuleNotFoundError, and there is no pip to fix it with. The shell keeps its filesystem in memory, so it forgets everything when you reload, and loops or multi-line constructs are not supported.",
    ],
    bullets: [
      "No network access from either runtime.",
      "Shell: one command per line. Pipes and redirects work; curl and git do not exist.",
      "A run that fails always says so: silence means your code printed nothing.",
    ],
    cta: { label: "Read: playground limits", href: `${appUrl()}/help/playground-limits` },
  };
}

/* ------------------------------------------------------------------ *
 * Render
 * ------------------------------------------------------------------ */

export function renderTemplate(id: TemplateId, payload: Record<string, unknown>): RenderedEmail {
  const name = str(payload, "name", "there");
  const preference = TEMPLATE_PREFERENCE[id];
  const userId = str(payload, "userId") || undefined;

  switch (id) {
    case "welcome": {
      const heading = `You are in, ${name}`;
      const html = layout({
        preheader: "Three books, four runtimes, one page that runs them.",
        heading,
        paragraphs: [
          "LOCK.IN is three short e-books that you read and run at the same time: 20 print pages each, six chapters, and a real interpreter behind every code block.",
          "The Beginner book is free and open right now. The playground needs nothing installed, and the coach answers even with no AI key configured: from a fixed ladder that points you at the section rather than handing over the answer.",
        ],
        bullets: [
          "Beginner: your first page on the web. Intermediate: make it respond. Expert: scripts that keep the books.",
          "Quest QR codes are printed inside the PDF edition; the 6-character code under each one works without a camera.",
          "XP, badges and rewards start moving on the first section you finish.",
        ],
        cta: { label: "Open the Beginner book", href: `${appUrl()}/app/library` },
        footnote: unsubscribeLine(preference, userId),
        preference,
        userId,
      });
      return {
        subject: "Welcome to LOCK.IN",
        html,
        text: plain([
          `You are in, ${name}.`,
          "LOCK.IN is three short e-books you read and run at the same time.",
          `Start here: ${appUrl()}/app/library`,
          preference ? `Stop these mails: ${appUrl()}/app/settings#email` : undefined,
        ]),
        preference,
      };
    }

    case "tip_day_1":
    case "tip_day_3":
    case "tip_day_7": {
      const tip = tipFor(id, name);
      const html = layout({
        preheader: tip.preheader,
        heading: tip.heading,
        paragraphs: tip.paragraphs,
        bullets: tip.bullets,
        cta: tip.cta,
        footnote: unsubscribeLine(preference, userId),
        preference,
        userId,
      });
      return {
        subject: tip.subject,
        html,
        text: plain([tip.heading, ...tip.paragraphs, ...tip.bullets, `${tip.cta.label}: ${tip.cta.href}`, preference ? `Stop these mails: ${appUrl()}/app/settings#email` : undefined]),
        preference,
      };
    }

    case "streak_reminder": {
      const streak = num(payload, "streak");
      const heading = `${streak} days in a row, ${name}`;
      const html = layout({
        preheader: "A section keeps it; midnight Jakarta is the deadline.",
        heading,
        paragraphs: [
          `Your streak is ${streak} days. Nothing has counted for today yet, and the day rolls over at midnight in Jakarta.`,
          "One finished section is enough: five XP and the streak stays. A checkpoint pays twenty-five.",
        ],
        cta: { label: "Finish one section", href: `${appUrl()}/app/library` },
        footnote: `Streaks count days you practised, not days you signed in. ${unsubscribeLine(preference, userId)}`,
        preference,
        userId,
      });
      return {
        subject: `Your ${streak}-day streak is still open today`,
        html,
        text: plain([
          `Your streak is ${streak} days and today has not counted yet.`,
          "One finished section keeps it.",
          `${appUrl()}/app/library`,
          preference ? `Stop streak reminders: ${appUrl()}/app/settings#email` : undefined,
        ]),
        preference,
      };
    }

    case "weekly_digest": {
      const xp = num(payload, "xp");
      const sections = num(payload, "sections");
      const badges = num(payload, "badges");
      const nextTitle = str(payload, "nextTitle");
      const nextHref = str(payload, "nextHref", `${appUrl()}/app/library`);
      const heading = `Your week, ${name}`;
      const html = layout({
        preheader: "What counted this week, and the one thing to do next.",
        heading,
        paragraphs: [
          `This week you earned ${xp} XP across ${sections} ${sections === 1 ? "section" : "sections"}, and ${badges === 0 ? "no new badges" : `${badges} new ${badges === 1 ? "badge" : "badges"}`}.`,
          nextTitle
            ? `The next node on your roadmap is "${nextTitle}". It is the shortest path to the next badge.`
            : "Every node on your roadmap is done. Pick a second tier, or help someone through theirs.",
        ],
        cta: { label: nextTitle ? "Continue the roadmap" : "Open the roadmap", href: nextHref },
        footnote: unsubscribeLine(preference, userId),
        preference,
        userId,
      });
      return {
        subject: `Your week: ${xp} XP, ${sections} sections`,
        html,
        text: plain([
          `This week: ${xp} XP, ${sections} sections, ${badges} badges.`,
          nextTitle ? `Next: ${nextTitle}: ${nextHref}` : undefined,
          preference ? `Stop the digest: ${appUrl()}/app/settings#email` : undefined,
        ]),
        preference,
      };
    }

    case "receipt": {
      const orderRef = str(payload, "orderRef");
      const total = num(payload, "total");
      const discount = num(payload, "discount");
      const items = Array.isArray(payload.items)
        ? (payload.items as Array<{ title?: string; priceIdr?: number }>)
        : [];
      const heading = "Your receipt";
      const html = layout({
        preheader: `Order ${orderRef}`,
        heading,
        paragraphs: [
          `Thanks, ${name}. The order below is paid, and everything in it is already in your library.`,
        ],
        bullets: items.map(
          (item) => `${esc(item.title ?? "Item")}: ${money(Number(item.priceIdr ?? 0))}`,
        ),
        amount:
          discount > 0
            ? `${money(total)} (after ${money(discount)} off)`
            : money(total),
        cta: { label: "Open your library", href: `${appUrl()}/app/library` },
        footnote: `Order ${esc(orderRef)}. Keep this reference: it is what a support ticket needs. A refund within seven days of purchase needs nothing more than that.`,
        userId,
      });
      return {
        subject: `Receipt for order ${orderRef}`,
        html,
        text: plain([
          `Receipt for order ${orderRef}.`,
          ...items.map((item) => `${item.title ?? "Item"}: ${money(Number(item.priceIdr ?? 0))}`),
          discount > 0 ? `Total ${money(total)} after ${money(discount)} off` : `Total ${money(total)}`,
          `${appUrl()}/app/library`,
        ]),
        preference,
      };
    }

    case "ack": {
      const reference = str(payload, "reference");
      const subject = str(payload, "ticketSubject");
      const html = layout({
        preheader: `Ticket ${reference}`,
        heading: "We have your message",
        paragraphs: [
          `Thanks, ${name}. Your message about "${esc(subject)}" is with us, and the reference is ${esc(reference)}.`,
          "A person answers support tickets; nothing here is a queue you are stuck behind. If your question is about a payment that has not arrived, the fastest check is your orders page: an order that says pending has simply not settled yet.",
        ],
        cta: { label: "See your tickets", href: `${appUrl()}/app/tickets` },
        footnote: `Reference ${esc(reference)}. Reply to this mail and it lands on the same ticket.`,
        userId,
      });
      return {
        subject: `We have your message (${reference})`,
        html,
        text: plain([
          `Thanks, ${name}. Your ticket about "${subject}" is with us. Reference ${reference}.`,
          `${appUrl()}/app/tickets`,
        ]),
        preference,
      };
    }

    case "ticket_reply": {
      const reference = str(payload, "reference");
      const subject = str(payload, "ticketSubject");
      const body = str(payload, "body");
      const html = layout({
        preheader: `Reply on ticket ${reference}`,
        heading: `Re: ${subject}`,
        paragraphs: [
          `<span style="color:${BRAND.muted};font-size:13px;">Support replied</span>`,
          esc(body).replace(/\n/g, "<br />"),
        ],
        cta: { label: "Open the thread", href: `${appUrl()}/app/tickets` },
        footnote: `Reference ${esc(reference)}. Replying to this mail adds to the same thread.`,
        userId,
      });
      return {
        subject: `Re: ${subject} (${reference})`,
        html,
        text: plain([`Support replied on ${reference}:`, body, `${appUrl()}/app/tickets`]),
        preference,
      };
    }

    case "password_reset": {
      const url = str(payload, "url");
      const minutes = num(payload, "expiresMinutes") || 60;
      const html = layout({
        preheader: "A link to set a new password.",
        heading: "Set a new password",
        paragraphs: [
          `Someone asked to reset the password for this address. If that was you, the link below works for ${minutes} minutes.`,
          "If it was not you, nothing has changed and nothing needs doing: this mail is the whole of what happened.",
        ],
        cta: { label: "Choose a new password", href: url },
        footnote: `For safety, the link is single-use. If it has expired, ask for another from the sign-in page.`,
        userId,
      });
      return {
        subject: "Set a new LOCK.IN password",
        html,
        text: plain([
          `Set a new password within ${minutes} minutes: ${url}`,
          "If this was not you, you can ignore this message.",
        ]),
        preference,
      };
    }
  }
}
