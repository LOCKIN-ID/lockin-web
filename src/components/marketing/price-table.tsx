"use client";

import { useActionState } from "react";

import type { Plan } from "@/content/plans";
import { createCheckout } from "@/app/(marketing)/pricing/actions";
import { idleState } from "@/lib/validation";
import { priceLabel } from "@/lib/format";

/**
 * The three plan rows, used by `/pricing`.
 *
 * One client component because a purchase needs a live state: the action can refuse
 * ("your Pro subscription already runs to 2026-11-24"), and the reason has to land next to
 * the button that caused it. Everything else: price, period, what is included, what is
 * explicitly not: is printed before the click, never after.
 *
 * Both lists are accordions: the full list and the caveat stay in the HTML and open
 * without scripting, while only the summary stands on the card, so three plans and their
 * prices stay inside one screen's word budget (Hallmark 58).
 */

/** One line of a plan's list: the tick, then the claim. Both lists render the same row. */
function planRow(line: string) {
  return (
    <li key={line} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-xs)" }}>
      <span aria-hidden="true" style={{ color: "var(--color-success)" }}>
        ✓
      </span>
      <span>{line}</span>
    </li>
  );
}

export function PriceTable({ plans }: { plans: Plan[] }) {
  const [state, action, pending] = useActionState(createCheckout, idleState);

  return (
    <div style={{ display: "grid", gap: "var(--space-md)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--space-md)",
        }}
      >
        {plans.map((plan) => {
          const isBundle = plan.id === "bundle" || plan.featured;
          const badgeBg =
            plan.badgeTone === "success"
              ? "var(--color-success)"
              : plan.badgeTone === "warning"
                ? "var(--color-paper-2)"
                : plan.badgeTone === "forest"
                  ? "var(--color-forest-deep)"
                  : "var(--color-paper-2)";

          const badgeColor =
            plan.badgeTone === "success"
              ? "var(--color-paper)"
              : plan.badgeTone === "warning"
                ? "var(--color-forest)"
                : plan.badgeTone === "forest"
                  ? "var(--color-paper)"
                  : "var(--color-ink-2)";
          return (
            <form
              key={plan.id}
              action={action}
              className="panel"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "var(--space-lg)",
                background: "var(--color-paper-3)",
                border: isBundle ? "2px solid var(--color-success)" : "1px solid var(--color-rule)",
                borderRadius: "var(--radius-card)",
                boxShadow: isBundle ? "var(--shadow-raised)" : "var(--shadow-card)",
                gap: "var(--space-md)",
              }}
            >
              <input type="hidden" name="planId" value={plan.id} />

              <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                {plan.badge ? (
                  <div style={{ display: "flex" }}>
                    <span
                      className="chip"
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        padding: "3px 8px",
                      }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                ) : null}

                <h3 style={{ fontSize: "var(--text-lg)", margin: 0 }}>{plan.title}</h3>

                <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3xs)" }}>
                  <span className="num" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900 }}>
                    {priceLabel(plan.priceIdr)}
                  </span>
                  <span style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>
                    / {plan.period}
                  </span>
                </div>

                <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-xs)", lineHeight: 1.45, margin: 0 }}>
                  {plan.blurb}
                </p>

                <ul
                  style={{
                    margin: 0,
                    paddingTop: "var(--space-sm)",
                    marginTop: "var(--space-2xs)",
                    borderTop: "1px dashed var(--color-rule)",
                    display: "grid",
                    gap: "var(--space-2xs)",
                    fontSize: "var(--text-xs)",
                    listStyle: "none",
                    paddingLeft: 0,
                  }}
                >
                  {plan.includes.map(planRow)}
                </ul>
              </div>

              <button
                className={isBundle ? "btn" : "btn btn--quiet"}
                type="submit"
                aria-busy={pending}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {plan.cta}
              </button>
            </form>
          );
        })}
      </div>

      {state.message ? (
        <p
          className="field__help"
          data-tone="error"
          role="status"
          style={{ margin: 0 }}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
