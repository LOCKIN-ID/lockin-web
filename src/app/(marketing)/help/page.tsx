import type { Metadata } from "next";
import Link from "next/link";

import { HELP_ARTICLES, HELP_CATEGORIES } from "@/content/help";
import { HelpSearchList } from "@/components/help/search-list";
import { Helper } from "@/components/help/helper";

import "./help.css";

export const metadata: Metadata = {
  title: "Help Centre | LOCK.IN",
  description: "Guides, documentation, answers, and support for LOCK.IN e-books and platforms.",
};

export default function HelpPage() {
  const provider = process.env.TUTOR_PROVIDER ?? "offline";
  const whatsappUrl = process.env.WHATSAPP_SUPPORT_URL ?? null;

  return (
    <div className="section">
      <div className="container">
        {/* Modern Knowledge Hub Header */}
        <header className="pagehead" data-reveal="up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2xs)", marginBottom: "var(--space-xs)" }}>
            <span className="chip" style={{ background: "var(--color-paper-2)", color: "var(--color-forest)", fontWeight: 700 }}>
              Knowledge Base & Support
            </span>
            <span className="chip" style={{ background: "transparent", color: "var(--color-ink-2)" }}>
              {HELP_ARTICLES.length} Articles
            </span>
          </div>

          <h1>How can we <span className="highlight-mint">help you</span>?</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Guides on payments, account access, browser runtimes, QR codes, and curriculum.
          </p>
        </header>

        {/* Category Cards, Search Console and Filtered Articles */}
        <div style={{ marginTop: "var(--space-xl)" }} data-reveal="up">
          <HelpSearchList articles={HELP_ARTICLES} categories={HELP_CATEGORIES} />
        </div>

        {/* Split Support Hub: AI Coach + Human Desk */}
        <section className="help-support-split" data-reveal="plate">
          {/* Column A: AI Support Coach */}
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <div>
              <h2>Ask the <span className="highlight-mint">Support Coach</span></h2>
              <p style={{ color: "var(--color-ink-2)", maxWidth: "60ch", marginTop: "var(--space-2xs)", fontSize: "var(--text-sm)" }}>
                Answers are drawn directly from our verified documentation and learning specifications.
              </p>
            </div>

            <Helper provider={provider} whatsappUrl={whatsappUrl} compact />
          </div>

          {/* Column B: Human Escalation Desk */}
          <div className="help-escalation-card">
            <div>
              <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>
                Need direct human assistance?
              </h3>
              <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", margin: "var(--space-xs) 0 0", lineHeight: 1.5 }}>
                When you need personalized help with order receipts, payment verification, or custom inquiries, our team handles tickets directly.
              </p>
            </div>

            <div className="help-escalation-meta">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Average reply</strong>
                <span>Under 2 hours</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Active days</strong>
                <span>Monday to Saturday</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Resolution rate</strong>
                <span>100% of verified orders</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: "var(--space-xs)" }}>
              <Link href="/contact" className="btn" style={{ width: "100%" }}>
                Open Support Ticket
              </Link>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--quiet"
                  style={{ width: "100%" }}
                >
                  Chat via WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
