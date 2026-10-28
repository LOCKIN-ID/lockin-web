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
        <header className="pagehead" data-reveal="up">
          <h1>How can we <span className="highlight-mint">help</span>?</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Guides on payments, accounts, runtimes, QR codes and curriculum.
          </p>
        </header>

        {/* Search and articles */}
        <div style={{ marginTop: "var(--space-xl)" }} data-reveal="up">
          <HelpSearchList articles={HELP_ARTICLES} categories={HELP_CATEGORIES} />
        </div>

        {/* Support coach */}
        <section
          data-reveal="plate"
          style={{
            marginTop: "var(--space-3xl)",
            paddingTop: "var(--space-2xl)",
            borderTop: "1px solid var(--color-rule)",
          }}
        >
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <h2>Ask the <span className="highlight-mint">Support Coach</span></h2>
            <p style={{ color: "var(--color-ink-2)", maxWidth: "60ch", marginTop: "var(--space-2xs)" }}>
              Answers come from the articles above.
            </p>
          </div>

          <div style={{ maxWidth: "75ch" }}>
            <Helper provider={provider} whatsappUrl={whatsappUrl} compact />
          </div>
        </section>

        {/* Escalation CTA */}
        <section
          className="well"
          data-reveal="up"
          style={{
            marginTop: "var(--space-2xl)",
            padding: "var(--space-xl)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "var(--space-md)",
          }}
        >
          <div>
            <h3>Still stuck? Open a human ticket.</h3>
            <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
              A person usually answers within a few hours.
            </p>
          </div>
          <Link href="/contact" className="btn">
            Open Support Ticket
          </Link>
        </section>
      </div>
    </div>
  );
}
