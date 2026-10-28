import nodemailer from "nodemailer";

/**
 * Where a mail leaves the machine.
 *
 * `smtp` is the local default and points at MailDev (SMTP 1025, web UI 1080): no
 * account, no domain, and every mail the product sends is visible while it is being
 * built, which is the only way to check a retention sequence honestly.
 * `resend` takes over in production when `RESEND_API_KEY` is set, because Resend needs a
 * verified domain for arbitrary recipients, not merely a key.
 */

export type TransportName = "smtp" | "resend";

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function emailTransport(): TransportName {
  return (process.env.EMAIL_TRANSPORT ?? "smtp").trim().toLowerCase() === "resend"
    ? "resend"
    : "smtp";
}

export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "LOCK.IN <hello@lockin.test>";
}

async function sendSmtp(mail: OutgoingMail): Promise<string> {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    // MailDev takes no credentials; only pass them when they were configured.
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  });

  const info = await transport.sendMail({
    from: emailFrom(),
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return info.messageId ?? "smtp-accepted";
}

async function sendResend(mail: OutgoingMail): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("EMAIL_TRANSPORT=resend needs RESEND_API_KEY.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom(),
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`resend refused the message: ${response.status} ${detail.slice(0, 300)}`);
  }

  const body = (await response.json()) as { id?: string };
  return body.id ?? "resend-accepted";
}

/** Sends one message and returns the provider's id. Throws with the provider's words. */
export async function sendMail(mail: OutgoingMail): Promise<string> {
  return emailTransport() === "resend" ? sendResend(mail) : sendSmtp(mail);
}
