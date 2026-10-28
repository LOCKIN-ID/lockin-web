import { settleOrder } from "@/lib/payments/order";
import { prisma } from "@/lib/prisma";

/**
 * The mock bank telling us the money moved.
 *
 * This is the demo's "transfer received" button and it runs the identical settlement the
 * Midtrans webhook runs, which is the point: the purchase path in a demo is the purchase
 * path in production. Refused unless `MOCK_PAYMENTS=1`, so no deployment can be settled by
 * a stranger.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.MOCK_PAYMENTS !== "1") {
    return Response.json({ error: "MOCK_PAYMENTS_DISABLED" }, { status: 403 });
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { providerOrderId: true, provider: true, status: true },
  });
  if (!order) return Response.json({ error: "not found" }, { status: 404 });
  if (order.provider !== "mock") {
    return Response.json({ error: "that order belongs to a real provider" }, { status: 409 });
  }

  const result = await settleOrder(order.providerOrderId, { channel: order.status === "paid" ? undefined : "qris" });
  return Response.json(result, { status: result.settled ? 200 : 409 });
}
