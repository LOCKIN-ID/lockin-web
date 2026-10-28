import { failOrder, settleOrder } from "@/lib/payments/order";
import { midtransSignatureMatches } from "@/lib/payments/midtrans";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The provider's call, and the only place `Order.status` changes outside the mock button.
 *
 * Everything here is written to be safe under repetition, because webhooks are retried:
 * the raw event is stored once (unique on `[provider, eventId]`), settlement itself is
 * idempotent, and the route answers 200 to anything it has already dealt with. A bad
 * signature answers 401 and settles nothing.
 *
 * Midtrans signs `order_id + status_code + gross_amount + serverKey` with SHA-512; that is
 * checked in constant time before the body is trusted for anything.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_id?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  va_numbers?: Array<{ bank?: string; va_number?: string }>;
}

const FAILED_STATUSES = ["deny", "cancel", "expire", "failure"];
const SETTLED_STATUSES = ["capture", "settlement"];

export async function POST(request: Request) {
  const raw = await request.text();

  let body: MidtransNotification;
  try {
    body = JSON.parse(raw) as MidtransNotification;
  } catch {
    return Response.json({ error: "not json" }, { status: 400 });
  }

  // Prisma wants a JSON value, not an interface; the body is already known to be JSON, so
  // the cast is the whole conversion.
  const payload = body as unknown as Prisma.InputJsonValue;

  const orderId = body.order_id ?? "";
  const statusCode = body.status_code ?? "";
  const grossAmount = body.gross_amount ?? "";
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";

  const signatureValid =
    serverKey.length > 0 &&
    Boolean(body.signature_key) &&
    midtransSignatureMatches(body.signature_key ?? "", orderId, statusCode, grossAmount, serverKey);

  const eventId = body.transaction_id ?? `${orderId}:${statusCode}:${body.transaction_status ?? ""}`;

  // Logged whichever way it goes: an unsigned event is exactly the thing worth seeing in
  // `/admin/orders`.
  const event = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: "midtrans", eventId } },
    create: {
      provider: "midtrans",
      eventId,
      orderId: orderId || null,
      signatureValid,
      statusString: body.transaction_status ?? null,
      payload,
    },
    update: { signatureValid, statusString: body.transaction_status ?? null, payload },
    select: { id: true, processedAt: true },
  });

  if (!signatureValid) {
    return Response.json({ error: "bad signature" }, { status: 401 });
  }
  if (event.processedAt) {
    return Response.json({ ok: true, replay: true });
  }

  const status = body.transaction_status ?? "";
  const vaNumber = body.va_numbers?.[0]?.va_number;

  if (SETTLED_STATUSES.includes(status) && (body.fraud_status ?? "accept") !== "challenge") {
    const result = await settleOrder(orderId, { channel: "snap", vaNumber });
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return Response.json({ ok: true, ...result });
  }

  if (FAILED_STATUSES.includes(status)) {
    await failOrder(orderId, `midtrans: ${status}`);
    await prisma.webhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });
    return Response.json({ ok: true, failed: true });
  }

  // `pending` and friends: nothing to do yet, and marking it processed keeps the retry
  // cheap. The order itself carries the truth until a settling status arrives.
  return Response.json({ ok: true, ignored: status });
}
