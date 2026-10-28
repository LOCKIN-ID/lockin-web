import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEmailPreferences } from "./actions";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Account Settings | LOCK.IN",
  description: "Manage your profile, email preferences, and security settings.",
};

export default async function SettingsPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const pref = await prisma.emailPreference.findUnique({
    where: { userId },
  });

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "680px" }}>
        <header className="pagehead" data-reveal="up">
          <h1>Account <span className="highlight-mint">Settings</span></h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Manage notifications, profile information, and account security.
          </p>
        </header>

        {/* Profile Card */}
        <section className="panel" data-reveal="plate" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)", marginTop: "var(--space-xl)", display: "grid", gap: "var(--space-md)" }}>
          <h3>Profile Details</h3>
          <div className="cols-2" style={{ display: "grid", gap: "var(--space-md)" }}>
            <div className="field">
              <span className="label">Name</span>
              <div className="well" style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "var(--text-sm)" }}>
                {session.user.name}
              </div>
            </div>
            <div className="field">
              <span className="label">Email</span>
              <div className="well" style={{ padding: "var(--space-xs) var(--space-sm)", fontSize: "var(--text-sm)" }}>
                {session.user.email}
              </div>
            </div>
          </div>
        </section>

        {/* Email Preferences */}
        <section className="panel" data-reveal="plate" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)", marginTop: "var(--space-xl)" }}>
          <h3 style={{ marginBottom: "var(--space-md)" }}>Email Notifications</h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBottom: "var(--space-lg)" }}>
            We only send purposeful, low-frequency updates. You can toggle each category below.
          </p>

          <form action={updateEmailPreferences} style={{ display: "grid", gap: "var(--space-md)" }}>
            <label style={{ display: "flex", gap: "var(--space-sm)", alignItems: "start", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="tips"
                className="checkbox"
                defaultChecked={pref?.tips ?? true}
              />
              <div>
                <strong>Learning Tips &amp; Onboarding</strong>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0 }}>
                  Helpful concepts and study advice sent on days 1, 3, and 7.
                </p>
              </div>
            </label>

            <label style={{ display: "flex", gap: "var(--space-sm)", alignItems: "start", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="streakReminder"
                className="checkbox"
                defaultChecked={pref?.streak ?? true}
              />
              <div>
                <strong>Daily Streak Reminders</strong>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0 }}>
                  A gentle notification in the evening if your streak is about to reset.
                </p>
              </div>
            </label>

            <label style={{ display: "flex", gap: "var(--space-sm)", alignItems: "start", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="weeklyDigest"
                className="checkbox"
                defaultChecked={pref?.digest ?? true}
              />
              <div>
                <strong>Weekly Progress Digest</strong>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", margin: 0 }}>
                  A Monday recap of XP earned, sections cleared, and recommended next steps.
                </p>
              </div>
            </label>

            <div style={{ marginTop: "var(--space-sm)" }}>
              <button type="submit" className="btn btn--sm">
                Save Preferences
              </button>
            </div>
          </form>
        </section>

        {/* Account actions */}
        <section className="panel" data-reveal="plate" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)", marginTop: "var(--space-xl)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h4>Account Session</h4>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              Sign out from this browser session.
            </p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </div>
  );
}
