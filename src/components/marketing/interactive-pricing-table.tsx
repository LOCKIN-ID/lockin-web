"use client";

import { useActionState, useState } from "react";
import type { Plan, PlanId } from "@/content/plans";
import { PRICING_MATRIX, PRICELIST_PLANS } from "@/content/plans";
import { createCheckout } from "@/app/(marketing)/pricing/actions";
import { idleState } from "@/lib/validation";
import { priceLabel } from "@/lib/format";

interface Props {
  plans?: Plan[];
}

export function InteractivePricingTable({ plans = PRICELIST_PLANS }: Props) {
  const [state, action, pending] = useActionState(createCheckout, idleState);
  const [activePlan, setActivePlan] = useState<PlanId>("bundle");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...PRICING_MATRIX.map((m) => m.category)];

  const filteredMatrix =
    activeCategory === "all"
      ? PRICING_MATRIX
      : PRICING_MATRIX.filter((m) => m.category === activeCategory);

  return (
    <div style={{ display: "grid", gap: "var(--space-xl)" }} data-reveal="plate">
      {/* Category Filter Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", alignItems: "center" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontWeight: 600, marginRight: "var(--space-2xs)" }}>
          Kategori Fitur:
        </span>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          const label = cat === "all" ? "Semua Fitur" : cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="chip"
              style={{
                cursor: "pointer",
                background: isSelected ? "var(--color-forest)" : "var(--color-paper-2)",
                color: isSelected ? "var(--color-paper)" : "var(--color-ink-2)",
                borderColor: isSelected ? "var(--color-forest)" : "var(--color-rule)",
                fontWeight: isSelected ? 700 : 500,
                transition: "all var(--dur-micro) var(--ease-out)",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Interactive Table Container */}
      <div
        className="panel"
        style={{
          background: "var(--color-paper-3)",
          border: "1px solid var(--color-rule)",
          borderRadius: "var(--radius-card)",
          overflow: "hidden",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="tbl__scroll" style={{ overflowX: "auto" }}>
          <table
            className="tbl"
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "var(--text-sm)",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    width: "280px",
                    minWidth: "240px",
                    padding: "var(--space-lg)",
                    background: "var(--color-paper-3)",
                    borderBottom: "2px solid var(--color-rule)",
                    verticalAlign: "bottom",
                  }}
                >
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontWeight: 600 }}>
                    PILIHAN PAKET
                  </span>
                  <div style={{ fontSize: "var(--text-lg)", fontWeight: 800, marginTop: "var(--space-3xs)" }}>
                    Fitur &amp; Kemampuan
                  </div>
                </th>

                {plans.map((plan) => {
                  const isSelected = activePlan === plan.id;
                  const isFeatured = plan.id === "bundle" || plan.featured;

                  return (
                    <th
                      key={plan.id}
                      onClick={() => setActivePlan(plan.id)}
                      onMouseEnter={() => setActivePlan(plan.id)}
                      style={{
                        padding: "var(--space-lg) var(--space-md)",
                        textAlign: "center",
                        minWidth: "200px",
                        cursor: "pointer",
                        background: isSelected
                          ? "color-mix(in oklab, var(--color-accent) 14%, var(--color-paper-3))"
                          : isFeatured
                            ? "var(--color-paper-2)"
                            : "var(--color-paper-3)",
                        borderBottom: "2px solid var(--color-rule)",
                        borderInline: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-rule)",
                        transition: "background var(--dur-micro) var(--ease-out)",
                      }}
                    >
                      <div style={{ display: "grid", gap: "var(--space-2xs)", justifyItems: "center" }}>
                        {plan.badge ? (
                          <span
                            className="chip"
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: isFeatured
                                ? "var(--color-forest)"
                                : "var(--color-paper-2)",
                              color: isFeatured ? "#ffffff" : "var(--color-ink-2)",
                              padding: "2px 8px",
                            }}
                          >
                            {plan.badge}
                          </span>
                        ) : null}

                        <div style={{ fontWeight: 800, fontSize: "var(--text-md)", color: "var(--color-ink)" }}>
                          {plan.title}
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3xs)" }}>
                          <span className="num" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 900 }}>
                            {priceLabel(plan.priceIdr)}
                          </span>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                            / {plan.period}
                          </span>
                        </div>

                        <form action={action} style={{ width: "100%", marginTop: "var(--space-xs)" }}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <button
                            type="submit"
                            className={isFeatured ? "btn" : "btn btn--quiet btn--sm"}
                            disabled={pending}
                            aria-busy={pending}
                            style={{ width: "100%", justifyContent: "center", fontSize: "var(--text-xs)" }}
                          >
                            {plan.cta}
                          </button>
                        </form>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredMatrix.map((catGroup) => (
                <tr key={catGroup.category} style={{ background: "transparent" }}>
                  <td colSpan={plans.length + 1} style={{ padding: 0 }}>
                    <div
                      style={{
                        padding: "var(--space-sm) var(--space-lg)",
                        background: "var(--color-paper-2)",
                        fontWeight: 800,
                        fontSize: "var(--text-xs)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--color-forest)",
                        borderBlock: "1px solid var(--color-rule)",
                      }}
                    >
                      {catGroup.category}
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {catGroup.features.map((feat, fIdx) => (
                          <tr
                            key={feat.name}
                            style={{
                              borderBottom: fIdx === catGroup.features.length - 1 ? "none" : "1px solid var(--color-rule)",
                            }}
                          >
                            <td
                              style={{
                                width: "280px",
                                minWidth: "240px",
                                padding: "var(--space-md) var(--space-lg)",
                                verticalAlign: "top",
                              }}
                            >
                              <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{feat.name}</div>
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "var(--space-3xs)", lineHeight: 1.4 }}>
                                {feat.description}
                              </div>
                            </td>

                            {plans.map((plan) => {
                              const isSelected = activePlan === plan.id;
                              const val = feat.values[plan.id];

                              return (
                                <td
                                  key={plan.id}
                                  style={{
                                    padding: "var(--space-md)",
                                    textAlign: "center",
                                    verticalAlign: "middle",
                                    minWidth: "200px",
                                    background: isSelected
                                      ? "color-mix(in oklab, var(--color-accent) 8%, var(--color-paper-3))"
                                      : "transparent",
                                    borderInline: isSelected ? "2px solid var(--color-accent)" : "1px solid var(--color-rule)",
                                  }}
                                >
                                  {val === true ? (
                                    <span style={{ color: "var(--color-forest)", fontWeight: 900, fontSize: "var(--text-md)" }}>
                                      ✓
                                    </span>
                                  ) : val === false || val === undefined ? (
                                    <span style={{ color: "var(--color-rule)", fontWeight: 700 }}>
                                      —
                                    </span>
                                  ) : (
                                    <span
                                      className="chip"
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: isSelected ? "var(--color-forest)" : "var(--color-paper-2)",
                                        color: isSelected ? "var(--color-paper)" : "var(--color-ink)",
                                      }}
                                    >
                                      {val}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {state.message ? (
        <p className="field__help" data-tone="error" role="status" style={{ margin: 0 }}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
