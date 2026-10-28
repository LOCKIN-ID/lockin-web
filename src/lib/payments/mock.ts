import {
  mockQrString,
  mockVaNumber,
  ORDER_WINDOW_MINUTES,
  type Charge,
  type ChargeInput,
  type PaymentChannel,
  type PaymentGateway,
} from "./gateway";

/**
 * The default provider: no account, no network, and deterministic.
 *
 * Money never moves here. What does happen is everything else: the same order rows, the
 * same expiry, the same `settleOrder` that the Midtrans webhook calls. `POST
 * /api/payments/mock/[id]/settle` is the "the bank just told us" button, and it is behind
 * `MOCK_PAYMENTS=1` so a deployment cannot be settled by a stranger.
 */
export class MockGateway implements PaymentGateway {
  readonly name = "mock" as const;

  async createCharge(input: ChargeInput): Promise<Charge> {
    const channel = normaliseChannel(input.channel);
    const expiresAt = new Date(Date.now() + ORDER_WINDOW_MINUTES * 60_000);

    if (channel === "va_bca") {
      return { vaNumber: mockVaNumber(input.providerOrderId), expiresAt, channel };
    }

    return {
      qrString: mockQrString(input.providerOrderId, input.grossAmountIdr),
      expiresAt,
      channel,
    };
  }

  /**
   * The mock has no signer to verify, so the test is the environment: only a deployment
   * that switched the mock on explicitly may settle an order through this gateway.
   */
  verifySignature(_rawBody: string, headers: Headers): boolean {
    if (process.env.MOCK_PAYMENTS !== "1") return false;
    return headers.get("x-mock-signature") === "mock";
  }
}

function normaliseChannel(channel?: string): PaymentChannel {
  if (channel === "va_bca" || channel === "qris" || channel === "gopay" || channel === "card") {
    return channel;
  }
  return "qris";
}
