import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/payments/order";
import { checkoutSchema } from "@/lib/validation";
import { readJson } from "@/lib/api";

/**
 * Starts a purchase. The body names a plan or a book and this route prices it: see
 * `quoteFor`. The reply carries everything the pay page needs to draw a QRIS code, a
 * virtual account or a Snap token, so the page never has to ask twice.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Sign in to buy a book." }, { status: 401 });
  }

  const parsed = checkoutSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return Response.json({ error: "That purchase request did not make sense." }, { status: 400 });
  }

  const started = await createOrder(session.user.id, parsed.data);
  if (!started.ok) {
    return Response.json({ error: started.reason }, { status: 409 });
  }

  return Response.json({
    orderId: started.orderId,
    providerOrderId: started.providerOrderId,
    totalIdr: started.totalIdr,
    settled: started.settled,
    charge: started.charge,
    settleUrl: started.settled ? null : `/api/payments/mock/${started.orderId}/settle`,
  });
}
