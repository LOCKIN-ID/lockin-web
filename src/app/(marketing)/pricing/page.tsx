import type { Metadata } from "next";
import Link from "next/link";

import {
  PLANS,
  PRICELIST_PLANS,
  CUSTOM_SERVICES,
  PLAN_FEATURES,
  type PlanId,
} from "@/content/plans";
import { InteractivePricingTable } from "@/components/marketing/interactive-pricing-table";
import { TaglineStrip } from "@/components/marketing/tagline-strip";

import "./pricing.css";

/**
 * `/pricing`: the three plans, the comparison, and the two facts a buyer needs before
 * clicking: what the period is, and what happens if they change their mind.
 *
 * The actions are real: each plan row posts to `createCheckout`, which prices the order
 * server-side and lands the reader on the pay page. A reader who is not signed in is sent
 * to sign in and comes straight back here.
 */

export const metadata: Metadata = {
  title: "Pricing | LOCK.IN",
  description:
    "Beginner is free. Pro is Rp49.000 for 30 days. Lifetime is Rp399.000 once, and every later edition of the same titles lands in your library.",
};

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "What do I get for free?",
    a: "The whole Beginner book: six chapters, both of its QR quests, the playground in all four languages, XP and badges. No card, no countdown, no trial that ends when you look away.",
  },
  {
    q: "Why thirty days, not a subscription?",
    a: "It is a subscription that runs for thirty days and stops. Nothing renews itself, so there is no cancellation flow to find and no charge you did not ask for. Renewing when the tier is unfinished is a button, not a support ticket.",
  },
  {
    q: "What does \"every later edition\" mean?",
    a: "The three titles this product sells today, and any revised edition of those same titles. A fourth book would be a new purchase, it would be a lie to promise otherwise.",
  },
  {
    q: "What if it is not for me?",
    a: "A refund within seven days of purchase, and the order reference is all we need. The receipt mail carries it, and it is on the orders list in settings.",
  },
  {
    q: "How do I pay?",
    a: "QRIS or a BCA virtual account, both handled by the payment provider. The QR and the account number are on the next screen, and the order holds for thirty minutes.",
  },
  {
    q: "Is there a certificate?",
    a: "No. What we can show is a real record: sections finished, checkpoints passed, quests completed, badges earned and XP: all on your profile. Anyone asking for more than that is asking for work, and the books end with a project you can point at.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: "var(--space-sm)" }}>
        <div className="container">
          <header className="pagehead" data-reveal="up" style={{ paddingBottom: "var(--space-md)" }}>
            <h1 style={{ fontSize: "var(--text-3xl)", fontWeight: 900 }}>
              Daftar Paket &amp; <span className="highlight-mint">Pricelist</span>
            </h1>
            <p className="lead" style={{ color: "var(--color-ink-2)" }}>
              Transparansi investasi belajar: bandingkan modul, kuota AI, dan paket hemat.
            </p>
          </header>

          <InteractivePricingTable plans={PRICELIST_PLANS} />
        </div>
      </section>

      <TaglineStrip
        tone="mint"
        direction="reverse"
        speed="fast"
        items={["FREE FOREVER TIER", "ONE-TIME PURCHASE", "30-DAY REFUND WINDOW", "UNLIMITED RUNTIME ACCESS", "PERMANENT STUDY MATERIALS"]}
      />

      <section className="section">
        <div className="container">
          <div className="section__head" data-reveal="up">
            <h2>Every row is a surface you can <span className="highlight-mint">go and check</span>.</h2>
          </div>
          {/* The whole comparison stays in the HTML: crawlable, printable, opened
              without scripting: and the head above names what is behind it. */}
          <details className="disclosure disclosure--plans" data-reveal="up" style={{ marginTop: "var(--space-xl)" }}>
            <summary>Compare all eight rows</summary>
            <div className="tbl__scroll" style={{ marginTop: "var(--space-lg)" }}>
              <table className="tbl">
                <caption>
                  Features as they ship today. Each one names where in the product it shows up.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">What</th>
                    {PLANS.map((plan) => (
                      <th scope="col" key={plan.id}>
                        {plan.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">
                        {row.label}
                        <span style={{ color: "var(--color-muted)" }}> · {row.proof}</span>
                      </th>
                      {PLANS.map((plan) => (
                        <td key={plan.id}>
                          {row.value[plan.id as PlanId] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="band-forest section--tight" data-reveal="plate" style={{ borderRadius: "var(--radius-card)", padding: "var(--space-2xl)" }}>
            <h2>Rewards are earned, <span className="highlight-mint">never bought</span>.</h2>
            <p className="lead" style={{ marginTop: "var(--space-md)" }}>
              XP comes only from finished sections, passed checkpoints, completed quests and
              running code. A purchase is worth twenty XP (four sections), so nobody levels up by
              paying. Badge rules are on the badges page.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head" data-reveal="up">
            <h2>The six things people ask <span className="highlight-mint">before paying</span>.</h2>
          </div>
          <div className="cols-2" data-reveal-group style={{ marginTop: "var(--space-xl)" }}>
            {FAQ.map((item) => (
              <details className="panel disclosure" data-reveal="up" key={item.q} style={{ padding: "var(--space-lg)" }}>
                <summary>{item.q}</summary>
                <p style={{ marginTop: "var(--space-sm)", color: "var(--color-ink-2)" }}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
