import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { prisma } from "./prisma";
import { enqueue, enqueueWelcomeSequence } from "./email/queue";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    // A reset link goes out through the same queue as every other mail, so it works
    // against MailDev with no account anywhere, and it lands in `/admin/email` where a
    // stuck delivery is visible instead of vanishing into a provider dashboard.
    sendResetPassword: async ({ user, url }) => {
      await enqueue(user.id, "password_reset", {
        subject: "Set a new LOCK.IN password",
        payload: { name: user.name ?? "", userId: user.id, url, expiresMinutes: 60 },
        dedupeKey: new Date().toISOString().slice(0, 13), // one live link per hour
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh at most once a day
  },
  databaseHooks: {
    user: {
      create: {
        // A reader has a profile and a mail preference the moment they exist, so no page
        // has to cope with a half-built account (and `awardXp` never has to create one).
        after: async (user) => {
          await prisma.profile.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
          await prisma.emailPreference.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
          // Queue only: nothing is sent from a request that is still answering a sign-up,
          // and the drain picks it up on the next run (or the "Run now" button).
          await enqueueWelcomeSequence(user.id);
        },
      },
    },
  },
  // nextCookies() stays last: it is the plugin that writes Set-Cookie for server actions.
  plugins: [admin(), nextCookies()],
});

/** The reader reading, or null. Never redirects: pages decide what an anonymous visit means. */
export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session ?? null;
}

/**
 * The signed-in reader, or a bounce to /login that remembers where they were going.
 * `nextPath` is the page itself (`/app/library`); omit it when there is nowhere to return to.
 */
export async function requireUser(nextPath?: string) {
  const session = await currentUser();
  if (!session) {
    redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  }
  return session;
}

/** Signed in *and* an admin. A signed-in non-admin gets a 404, not a hint that /admin exists. */
export async function requireAdmin() {
  const session = await requireUser("/admin");
  const role = (session.user as { role?: string | null }).role;
  if (role !== "admin") notFound();
  return session;
}
