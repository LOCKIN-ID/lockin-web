/**
 * The shape every server action returns, and the schemas the forms post.
 *
 * One rule: an action never throws at the reader. It returns a `FormState` whose
 * `errors` is keyed by field name, so the page can put the message beside the input it
 * belongs to and wire `aria-describedby` to it. A form that answers with a toast, or
 * with a blank screen, is a form that failed silently.
 */

import { z } from "zod";

export interface FormState {
  ok: boolean;
  /** The one sentence shown above the form when the failure is not field-specific. */
  message?: string;
  /** Field name -> message. Never a nested path: forms are flat. */
  errors?: Record<string, string>;
}

export const idleState: FormState = { ok: false };

export function ok(message?: string): FormState {
  return { ok: true, message };
}

export function fail(message: string, errors?: Record<string, string>): FormState {
  return { ok: false, message, errors };
}

/** zod issues as a flat `field -> message` map. The first issue per field wins. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "form";
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/* ------------------------------------------------------------------ *
 * Fields
 * ------------------------------------------------------------------ */

export const emailField = z
  .string()
  .trim()
  .min(3, "Enter an email address.")
  .max(160, "That address is longer than an address can be.")
  .pipe(z.email("That does not look like an email address."));

export const nameField = z
  .string()
  .trim()
  .min(2, "Use at least two characters.")
  .max(80, "Keep it under 80 characters.");

export const passwordField = z
  .string()
  .min(8, "Use at least eight characters.")
  .max(200, "Keep it under 200 characters.");

export const messageField = z
  .string()
  .trim()
  .min(10, "Give us at least ten characters to work with.")
  .max(4000, "Keep it under 4000 characters.");

export const subjectField = z
  .string()
  .trim()
  .min(4, "Summarise it in at least four characters.")
  .max(120, "Keep the subject under 120 characters.");

/** The honeypot: a field no person sees, filled by every bot. Never rejected loudly. */
export const honeypotField = z.string().max(0).optional().or(z.literal(""));

/** An id the client may send; always re-checked against the database before it is used. */
export const idField = z.string().trim().min(6).max(64);

export const slugField = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lower-case letters, numbers and dashes only.");

export const codeField = z
  .string()
  .trim()
  .min(4)
  .max(12)
  .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only.");

/* ------------------------------------------------------------------ *
 * Forms
 * ------------------------------------------------------------------ */

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
  next: z.string().trim().max(200).optional(),
});

export const signUpSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  next: z.string().trim().max(200).optional(),
});

export const resetRequestSchema = z.object({ email: emailField });

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  subject: subjectField,
  category: z.enum(["account", "payment", "content", "bug", "other"]),
  message: messageField,
  orderRef: z.string().trim().max(64).optional(),
  website: honeypotField,
});

export const ticketReplySchema = z.object({
  ticketId: idField,
  body: messageField,
});

export const settingsSchema = z.object({
  name: nameField,
  tips: z.coerce.boolean(),
  streak: z.coerce.boolean(),
  product: z.coerce.boolean(),
  digest: z.coerce.boolean(),
});

export const checkoutSchema = z.object({
  planId: z.enum(["free", "bundle", "booster", "pro", "lifetime"]).optional(),
  bookSlug: z.string().trim().max(64).optional(),
  couponCode: z.string().trim().max(32).optional(),
  channel: z.enum(["qris", "va_bca", "gopay", "card"]).default("qris"),
});

export const bookmarkSchema = z.object({
  bookSlug: slugField,
  chapterId: idField,
  sectionId: z.string().trim().max(64).default(""),
  note: z.string().trim().max(600, "Keep a note under 600 characters.").default(""),
});

export const snippetSchema = z.object({
  title: z.string().trim().min(2, "Give it a name.").max(80, "Keep the name under 80 characters."),
  language: z.enum(["html", "js", "python", "shell"]),
  code: z.string().min(1, "There is nothing to save.").max(60_000, "That snippet is too large."),
});

export const questNoteSchema = z.object({
  questSlug: idField,
  note: z
    .string()
    .trim()
    .min(20, "Ten words or so, so future you knows what changed.")
    .max(600, "Keep it under 600 characters."),
});

export const questCodeSchema = z.object({ code: codeField });

/** A page open as the browser reports it: the path only; the rest is the edge's to add. */
export const pageViewSchema = z.object({
  path: z.string().trim().min(1, "A page open needs a path.").max(200),
});

export const adminBookSchema = z.object({
  slug: slugField,
  priceIdr: z.coerce.number().int().min(0).max(5_000_000),
  compareAtIdr: z.coerce.number().int().min(0).max(5_000_000).optional(),
  bandToken: z.enum(["forest", "mint", "taupe"]),
  published: z.coerce.boolean(),
});

export const adminXpSchema = z.object({
  userId: idField,
  amount: z.coerce.number().int().min(-5000).max(5000).refine((n) => n !== 0, "Zero changes nothing."),
  note: z.string().trim().min(4, "Say why, in four characters or more.").max(200),
});

export const adminQuestSchema = z.object({
  id: idField,
  code: codeField.optional(),
  expiresAt: z.string().trim().max(32).optional(),
});

export const adminHelpSchema = z.object({
  id: idField.optional(),
  slug: slugField,
  title: z.string().trim().min(4).max(120),
  category: z.string().trim().min(2).max(40),
  summary: z.string().trim().min(10).max(240),
  bodyMd: z.string().trim().min(20).max(20_000),
  keywords: z.string().trim().max(400),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

/** Reads a `FormData` into a plain object, dropping the `$ACTION_*` plumbing Next adds. */
export function formValues(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (key.startsWith("$ACTION_")) continue;
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

/** Checkboxes are absent from `FormData` when unchecked; this makes them booleans. */
export function checkbox(form: FormData, name: string): boolean {
  return form.get(name) === "on" || form.get(name) === "true";
}
