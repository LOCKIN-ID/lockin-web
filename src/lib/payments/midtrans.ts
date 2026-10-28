import { createHash, timingSafeEqual } from "node:crypto";

import { ORDER_WINDOW_MINUTES, type Charge, type ChargeInput, type PaymentGateway } from "./gateway";

/**
 * Midtrans Snap, over plain `fetch`. The `midtrans-client` package is a thin wrapper around
 * the same two requests, and a wrapper is not worth a dependency here.
 *
 * Two facts about Midtrans shape this file. The Snap token is fetched server-side and
 * embedded in the browser with `window.snap.embed`, falling back to the redirect URL when
 * the script cannot load: a browser without `snap.js` must still be able to pay. And the
 * webhook signature is SHA-512 over `order_id + status_code + gross_amount + serverKey`,
 * compared in constant time.
 */

export function midtransBase(): string {
  return (process.env.MIDTRANS_BASE ?? "https://app.sandbox.midtrans.com").replace(/\/+$/, "");
}

/** The exact string Midtrans signs. Kept pure so the webhook and its test share it. */
export function midtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

export function midtransSignatureMatches(
  provided: string,
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): boolean {
  const expected = midtransSignature(orderId, statusCode, grossAmount, serverKey);
  const a = Buffer.from(provided.trim().toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class MidtransGateway implements PaymentGateway {
  readonly name = "midtrans" as const;

  private readonly serverKey: string;

  constructor(serverKey = process.env.MIDTRANS_SERVER_KEY ?? "") {
    if (!serverKey) {
      throw new Error("PAYMENTS_PROVIDER=midtrans needs MIDTRANS_SERVER_KEY.");
    }
    this.serverKey = serverKey;
  }

  async createCharge(input: ChargeInput): Promise<Charge> {
    const response = await fetch(`${midtransBase()}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: input.providerOrderId,
          gross_amount: input.grossAmountIdr,
        },
        customer_details: {
          first_name: input.customer.name.slice(0, 40),
          email: input.customer.email,
        },
        item_details: input.items.map((item) => ({
          id: item.title.slice(0, 40),
          name: item.title.slice(0, 50),
          price: item.priceIdr,
          quantity: item.qty,
        })),
        expiry: { unit: "minutes", duration: ORDER_WINDOW_MINUTES },
      }),
    });

    const body = (await response.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !body.token) {
      const detail = body.error_messages?.join("; ") ?? `HTTP ${response.status}`;
      throw new Error(`midtrans refused the charge: ${detail}`);
    }

    return {
      token: body.token,
      redirectUrl: body.redirect_url,
      expiresAt: new Date(Date.now() + ORDER_WINDOW_MINUTES * 60_000),
      // Snap lets the buyer choose at the Snap screen, so the channel is not decided here.
      channel: "snap",
    };
  }

  verifySignature(rawBody: string, headers: Headers): boolean {
    void rawBody;
    void headers;
    // Midtrans carries the signature in the body, not a header, so the webhook route
    // verifies it with `midtransSignatureMatches` after parsing. Answering false here keeps
    // a caller from mistaking this for a header check.
    return false;
  }
}
