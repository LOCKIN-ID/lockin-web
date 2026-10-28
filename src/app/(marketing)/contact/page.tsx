import type { Metadata } from "next";
import Link from "next/link";

import { currentUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us | LOCK.IN",
  description: "Get in touch with the LOCK.IN team for help with e-books, payments, runtimes, or licensing.",
};

export default async function ContactPage() {
  const user = await currentUser();

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "860px" }}>
        <header className="pagehead" data-reveal="up">
          <h1>Talk to the <span className="highlight-mint">team</span>.</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Need help with an exercise, payment, or access? We read every message.
          </p>
        </header>

        <div className="cols-2" style={{ display: "grid", gap: "var(--space-2xl)", marginTop: "var(--space-xl)", alignItems: "start" }}>
          <div data-reveal="left">
            <ContactForm initialEmail={user?.user?.email ?? ""} initialName={user?.user?.name ?? ""} />
          </div>

          <aside data-reveal="right" style={{ display: "grid", gap: "var(--space-xl)" }}>
            <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
              <h3>What happens next</h3>
              <ol style={{ marginTop: "var(--space-sm)", display: "grid", gap: "var(--space-sm)", fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
                <li style={{ display: "flex", gap: "var(--space-xs)" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-forest)" }}>1.</span>
                  <span>You receive an immediate ticket reference code.</span>
                </li>
                <li style={{ display: "flex", gap: "var(--space-xs)" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-forest)" }}>2.</span>
                  <span>An engineer reviews the issue, reproducing any code bugs if needed.</span>
                </li>
                <li style={{ display: "flex", gap: "var(--space-xs)" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-forest)" }}>3.</span>
                  <span>You can track replies directly in your account tickets dashboard.</span>
                </li>
              </ol>
            </div>

            <div className="well" style={{ padding: "var(--space-xl)" }}>
              <h4>Looking for fast answers?</h4>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
                Most common questions regarding QR codes, subscriptions, refunds, and runtimes are answered in our knowledge base.
              </p>
              <Link href="/help" className="btn btn--quiet btn--sm" style={{ marginTop: "var(--space-xs)" }}>
                Browse Help Topics
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
