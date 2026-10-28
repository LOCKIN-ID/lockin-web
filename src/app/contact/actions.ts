"use server";

import { currentUser } from "@/lib/auth";
import { runSerial } from "@/lib/db";
import { enqueue } from "@/lib/email/queue";
import { ordersFor } from "@/lib/payments/order";
import { prisma } from "@/lib/prisma";
import { contactSchema, fail, fieldErrors, formValues, type FormState } from "@/lib/validation";

/**
 * `/contact`'s one write: a support ticket.
 *
 * Three things about it are deliberate.
 *
 * First, the reference is the ticket's own id, minted here from the same
 * ambiguity-free alphabet an order id uses, so there is one identifier in the
 * system rather than two that can drift apart, and it can be read aloud over a
 * phone without `O`/`0` or `I`/`1` confusion.
 *
 * Second, `orderRef` is only *verified* when there is a session: `ordersFor` is
 * the user's own list, so a typo cannot attach someone else's order to the
 * ticket. A signed-out sender has nothing to match against and their reference is
 * stored as typed for an agent to check by hand.
 *
 * Third, the acknowledgement mail is only queued for a signed-in sender. An
 * `EmailJob` is addressed through its `User` row, so a guest ticket has no
 * recipient the queue could reach; the ticket itself still exists, and the
 * reference is rendered on the page the sender is looking at either way.
 */

export interface TicketState extends FormState {
  /** The ticket's reference. Present only when a ticket really was created. */
  ref?: string;
}

/** Same alphabet as `newProviderOrderId`: no `O`/`0`, no `I`/`1`, no lowercase. */
const REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function newTicketRef(now: Date = new Date()): string {
  const stamp = now.getTime().toString(36).toUpperCase();
  const random = Array.from(
    { length: 4 },
    () => REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)],
  ).join("");
  return `TKT-${stamp}-${random}`;
}

export async function createTicket(_state: TicketState, form: FormData): Promise<TicketState> {
  const parsed = contactSchema.safeParse(formValues(form));

  if (!parsed.success) {
    return {
      ...fail("Check the highlighted fields and send it again.", fieldErrors(parsed.error)),
    };
  }

  const { name, email, subject, message, category } = parsed.data;

  // The honeypot: a person never sees this field, so anything in it came from a
  // script. Accepting without a word is the point: a bot that gets an error
  // learns which field to skip. No ticket is written, and no reference is
  // invented, because a real person whose password manager filled the field would
  // then be holding a reference to something that does not exist.
  if (parsed.data.website) {
    return { ok: true, message: "Thanks, your message is with us." };
  }

  const session = await currentUser();
  const typedRef = parsed.data.orderRef?.trim();

  let orderRef: string | null = typedRef ? typedRef : null;
  if (typedRef && session) {
    const orders = await ordersFor(session.user.id);
    const matched = orders.find(
      (order) => order.providerOrderId.toUpperCase() === typedRef.toUpperCase(),
    );
    if (!matched) {
      return {
        ...fail("We could not send that.", {
          orderRef: "That reference is not on your account. Check your receipt, or leave it empty.",
        }),
      };
    }
    orderRef = matched.providerOrderId;
  }

  const ref = newTicketRef();

  // Two rows, in order: the ticket, then the message that opened it. Written
  // through `runSerial` so the same code holds on D1, which has no transactions.
  await runSerial([
    () =>
      prisma.ticket.create({
        data: {
          id: ref,
          userId: session?.user.id ?? null,
          email,
          name,
          subject,
          category,
          status: "open",
          orderRef,
        },
        select: { id: true },
      }),
    () =>
      prisma.ticketMessage.create({
        data: { ticketId: ref, authorRole: "user", authorName: name, body: message },
        select: { id: true },
      }),
  ]);

  if (session) {
    // The `ack` template reads `reference` and `ticketSubject`, and names the
    // sender with `name`; the row's subject mirrors the one it renders.
    await enqueue(session.user.id, "ack", {
      subject: `We have your message (${ref})`,
      payload: { name, reference: ref, ticketSubject: subject },
      dedupeKey: ref,
    }).catch(() => null);
  }

  return {
    ok: true,
    ref,
    message: "Thanks, your message is with us.",
  };
}
