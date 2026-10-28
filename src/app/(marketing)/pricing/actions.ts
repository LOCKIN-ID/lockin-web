"use server";

import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { paymentProvider } from "@/lib/payments/gateway";
import { createOrder } from "@/lib/payments/order";
import { checkoutSchema, fail, type FormState } from "@/lib/validation";

/**
 * Turns a click on a plan into a real order.
 *
 * The browser sends a plan id and nothing else: the price is looked up server-side in
 * `quoteFor`, so a tampered form can change what someone buys but never what it costs.
 * Signed-out readers are sent to sign in and come back to the page they were on, because a
 * purchase is the one place losing your place is unforgivable.
 *
 * A refusal (`quoteFor` says why) is returned as a message rather than thrown: "your Pro
 * subscription already runs to 2026-11-24" is information, not an error page.
 */
export async function createCheckout(_state: FormState, form: FormData): Promise<FormState> {
  const parsed = checkoutSchema.safeParse({
    planId: form.get("planId") ?? undefined,
    bookSlug: form.get("bookSlug") ?? undefined,
    couponCode: form.get("couponCode") ?? undefined,
    channel: form.get("channel") ?? "qris",
  });

  if (!parsed.success) return fail("That purchase request did not make sense.");

  const session = await currentUser();
  if (!session) {
    const next = parsed.data.bookSlug ? `/books/${parsed.data.bookSlug}` : "/pricing";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (paymentProvider() === "midtrans" && !process.env.MIDTRANS_SERVER_KEY) {
    return fail("Card and bank payments are not configured on this deployment yet.");
  }

  const started = await createOrder(session.user.id, parsed.data);
  if (!started.ok) return fail(started.reason);

  redirect(`/app/upgrade/checkout/${started.orderId}`);
}
