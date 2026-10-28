import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";

import { requireUser } from "@/lib/auth";
import { expireStaleOrders, orderFor } from "@/lib/payments/order";
import { ORDER_WINDOW_MINUTES, paymentProvider } from "@/lib/payments/gateway";
import { idr } from "@/lib/format";
import { PayPanel } from "./pay-panel";
import { SnapEmbed } from "./snap-embed";

/**
 * The pay page: what was bought, what it costs, and the one thing to do next.
 *
 * Two providers meet here. The mock gateway hands back a deterministic QRIS payload or a
 * BCA virtual account, both drawn from the strings the gateway returned; Midtrans hands
 * back a Snap token, which the browser embeds and which falls back to the redirect URL
 * when `snap.js` cannot load. Neither path changes what settlement means: both end at
 * `settleOrder`, which is why a demo exercises the production code.
 *
 * The page is a server component so the QR, the amount and the expiry are correct in the
 * first byte of HTML, with the client side only polling for the state change.
 */

export const dynamic = "force-dynamic";

function remainingMinutes(expiresAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 60_000));
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await requireUser("/pricing");
  const { orderId } = await params;

  // A page load is where a stale order gets noticed: a QR that has quietly expired must
  // never be shown as still payable.
  await expireStaleOrders();

  const order = await orderFor(session.user.id, orderId);
  if (!order) notFound();

  const now = new Date();
  const minutesLeft = remainingMinutes(order.expiresAt, now);
  const isPaid = order.status === "paid";
  const isOpen = order.status === "pending" && minutesLeft > 0;

  // Drawn on the server so the code is in the first paint; a QR that appears a second
  // after the amount is how a reader scans the wrong order.
  const qrSvg =
    isOpen && !order.providerToken && !order.vaNumber && order.qrString
      ? await QRCode.toString(order.qrString, { type: "svg", errorCorrectionLevel: "M", margin: 2 })
      : null;

  return (
    <div className="section">
      <div className="container">
        <div className="pagehead">
          <h1>{isPaid ? "Paid. It is in your library." : "Pay for your order."}</h1>
          <p className="lead">
            {isPaid
              ? "The receipt is in your inbox, and everything below is already unlocked."
              : `Transfer the exact amount. The order holds for ${ORDER_WINDOW_MINUTES} minutes, then the code stops working and nothing is charged.`}
          </p>
        </div>

        <div className="cols-2" style={{ alignItems: "start" }}>
          <section className="panel" style={{ padding: "var(--space-lg)" }} aria-labelledby="summary-heading">
            <h2 id="summary-heading">What you are buying</h2>
            <table className="tbl" style={{ marginTop: "var(--space-md)" }}>
              <caption>
                Priced on the server; the browser never sends an amount.
              </caption>
              <tbody>
                {order.items.map((item) => (
                  <tr key={`${item.kind}-${item.refId}-${item.title}`}>
                    <th scope="row">{item.title}</th>
                    <td className="num">{idr(item.priceIdr * item.qty)}</td>
                  </tr>
                ))}
                {order.discountIdr > 0 ? (
                  <tr>
                    <th scope="row">
                      Discount {order.couponCode ? `(${order.couponCode})` : ""}
                    </th>
                    <td className="num" style={{ color: "var(--color-success)" }}>
                      −{idr(order.discountIdr)}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <th scope="row">Total</th>
                  <td className="num">
                    <strong>{idr(order.grossAmountIdr)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <p style={{ marginTop: "var(--space-md)", color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
              Refund within seven days of purchase: the order reference above is all we need.
            </p>

            {isPaid ? (
              <div style={{ marginTop: "var(--space-lg)", display: "grid", gap: "var(--space-sm)" }}>
                <p className="eyebrow">Unlocked by this order</p>
                <ul style={{ display: "grid", gap: "var(--space-xs)" }}>
                  {order.items.map((item) => (
                    <li key={`unlocked-${item.refId}-${item.kind}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-xs)" }}>
                      <span aria-hidden="true" style={{ color: "var(--color-success)" }}>
                        ✓
                      </span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                  <Link className="btn" href="/app/library">
                    Open the library
                  </Link>
                  {order.items[0]?.kind === "book" && order.items[0].refId ? (
                    <Link className="btn btn--quiet" href={`/app/books/${order.items[0].refId}`}>
                      Start reading
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          {isPaid ? null : isOpen ? (
            <section aria-labelledby="pay-heading" style={{ display: "grid", gap: "var(--space-md)" }}>
              <div className="panel panel--raised" style={{ padding: "var(--space-lg)" }}>
                <h2 id="pay-heading">
                  {order.channel === "va_bca" ? "BCA virtual account" : "QRIS"}
                </h2>
                {order.providerToken ? (
                  <SnapEmbed
                    token={order.providerToken}
                    clientKey={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""}
                    redirectUrl={null}
                  />
                ) : order.vaNumber ? (
                  <PayPanel
                    orderId={order.id}
                    kind="va"
                    value={order.vaNumber}
                    qrSvg={null}
                    minutesLeft={minutesLeft}
                    mockEnabled={process.env.MOCK_PAYMENTS === "1"}
                    provider={paymentProvider()}
                  />
                ) : (
                  <PayPanel
                    orderId={order.id}
                    kind="qr"
                    value={order.qrString}
                    qrSvg={qrSvg}
                    minutesLeft={minutesLeft}
                    mockEnabled={process.env.MOCK_PAYMENTS === "1"}
                    provider={paymentProvider()}
                  />
                )}
              </div>

              <ol
                className="well"
                style={{ padding: "var(--space-lg)", display: "grid", gap: "var(--space-xs)", listStyle: "decimal", paddingInlineStart: "var(--space-2xl)" }}
              >
                <li>Open your bank or e-wallet app and choose the payment method above.</li>
                <li>Pay the exact total of {idr(order.grossAmountIdr)}.</li>
                <li>This page notices on its own; you do not have to come back and press anything.</li>
              </ol>
            </section>
          ) : (
            <section className="panel" style={{ padding: "var(--space-lg)" }} aria-labelledby="closed-heading">
              <h2 id="closed-heading">
                {order.status === "expired"
                  ? "This order expired."
                  : order.status === "failed"
                    ? "The payment did not go through."
                    : "This order is closed."}
              </h2>
              <p style={{ marginTop: "var(--space-sm)", color: "var(--color-ink-2)" }}>
                {order.failureReason === "not paid within 30 minutes"
                  ? `Nothing was charged. The code stopped working ${minutesLeft === 0 ? "thirty minutes after it was issued" : "and the order was released"}.`
                  : (order.failureReason ?? "Nothing was charged.")}
              </p>
              <div style={{ marginTop: "var(--space-lg)" }}>
                <Link className="btn" href="/pricing">
                  Start a new order
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
