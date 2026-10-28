/**
 * The shape a payment provider has to have.
 *
 * Two implementations ship and the app never knows which one is live: `MockGateway` is the
 * default so the whole purchase path: order, charge, settlement, entitlement, receipt -
 * runs on a laptop with no account anywhere, and `MidtransGateway` takes over the moment
 * `PAYMENTS_PROVIDER=midtrans` and `MIDTRANS_SERVER_KEY` are set.
 *
 * The important property is that both drive the *same* `settleOrder`, so the demo exercises
 * the production code path rather than a shortcut beside it.
 */

export type PaymentProvider = "mock" | "midtrans";

export type PaymentChannel = "qris" | "va_bca" | "gopay" | "card" | "snap";

/** What a gateway needs to know: how much, for which order, and who is paying. */
export interface ChargeInput {
  providerOrderId: string;
  grossAmountIdr: number;
  customer: { name: string; email: string };
  /** The channel the buyer picked, when the provider offers a choice. */
  channel?: string;
  items: Array<{ title: string; priceIdr: number; qty: number }>;
}

export interface Charge {
  /** Snap's embed token; absent for the mock. */
  token?: string;
  /** Where to send the browser when embedding is not possible. */
  redirectUrl?: string;
  vaNumber?: string;
  qrString?: string;
  expiresAt: Date;
  channel: PaymentChannel;
}

export interface PaymentGateway {
  readonly name: PaymentProvider;
  createCharge(input: ChargeInput): Promise<Charge>;
  /** Whether this request really came from the provider. */
  verifySignature(rawBody: string, headers: Headers): boolean;
}

export function paymentProvider(): PaymentProvider {
  return (process.env.PAYMENTS_PROVIDER ?? "mock").trim().toLowerCase() === "midtrans"
    ? "midtrans"
    : "mock";
}

/** The order holds for half an hour, on every provider; the copy says so too. */
export const ORDER_WINDOW_MINUTES = 30;

/**
 * The mock gateway is deterministic on purpose: the same order always produces the same
 * virtual account, so a screenshot from yesterday still matches today's demo, and a test
 * can assert an exact number without freezing a clock.
 */
export function mockVaNumber(providerOrderId: string): string {
  // FNV-1a over the order id, widened to 16 digits and prefixed the way BCA numbers are.
  let hash = 0x811c9dc5;
  for (const char of providerOrderId) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const tail = `${hash}`.padStart(10, "0").slice(0, 10);
  return `8808${tail}${(hash % 100).toString().padStart(2, "0")}`.slice(0, 16);
}

/** What the QR encodes. A real QRIS payload is far longer; this is what a scan would see. */
export function mockQrString(providerOrderId: string, amountIdr: number): string {
  return `LOCKIN|${providerOrderId}|${amountIdr}|IDR`;
}
