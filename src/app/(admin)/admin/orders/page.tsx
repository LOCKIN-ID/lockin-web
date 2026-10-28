import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { priceLabel } from "@/lib/format";
import { settleOrder } from "@/lib/payments/order";

export const metadata: Metadata = {
  title: "Orders Admin | LOCK.IN",
};

async function settleOrderAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const providerOrderId = String(formData.get("providerOrderId") ?? "");
  if (providerOrderId) {
    await settleOrder(providerOrderId);
    revalidatePath("/admin/orders");
  }
}

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
    },
    take: 50,
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Customer Orders</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Review checkouts, audit settlement receipts, and simulate mock settlements.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Order Reference</th>
                <th>Purchased Items</th>
                <th>Total</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-muted)" }}>
                    No orders placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isPending = o.status === "pending";
                  const isPaid = o.status === "paid";

                  return (
                    <tr key={o.id}>
                      <td>
                        <strong style={{ fontFamily: "var(--font-outlier)" }}>{o.providerOrderId}</strong>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                          {o.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                        </div>
                      </td>
                      <td>
                        {o.items.map((it) => (
                          <div key={it.id} style={{ fontSize: "var(--text-xs)" }}>
                            • {it.titleSnapshot} ({priceLabel(it.priceIdr)})
                          </div>
                        ))}
                      </td>
                      <td style={{ fontFamily: "var(--font-outlier)", fontWeight: 700 }}>
                        {priceLabel(o.grossAmountIdr)}
                      </td>
                      <td style={{ textTransform: "uppercase", fontSize: "var(--text-xs)" }}>
                        {o.provider}
                      </td>
                      <td>
                        <span
                          className="chip"
                          style={{
                            fontSize: "var(--text-xs)",
                            background: isPaid ? "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))" : "var(--color-paper-2)",
                            color: isPaid ? "var(--color-forest)" : undefined,
                            fontWeight: isPaid ? 700 : undefined,
                          }}
                        >
                          {o.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <form action={settleOrderAction}>
                            <input type="hidden" name="providerOrderId" value={o.providerOrderId} />
                            <button
                              type="submit"
                              className="btn btn--quiet btn--sm"
                              style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}
                            >
                              Settle (Simulate)
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
