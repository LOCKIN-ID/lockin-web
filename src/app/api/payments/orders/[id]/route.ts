import { auth } from "@/lib/auth";
import { orderFor } from "@/lib/payments/order";

/**
 * The pay page polls this while it waits for the bank. Owner-only: someone else's order id
 * answers 404, not 403, so the route never confirms that an id exists.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: _request.headers });
  if (!session?.user) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await orderFor(session.user.id, id);
  if (!order) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  return Response.json({
    id: order.id,
    providerOrderId: order.providerOrderId,
    status: order.status,
    channel: order.channel,
    vaNumber: order.vaNumber,
    qrString: order.qrString,
    providerToken: order.providerToken,
    totalIdr: order.grossAmountIdr,
    discountIdr: order.discountIdr,
    couponCode: order.couponCode,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    failureReason: order.failureReason,
    items: order.items,
  });
}
