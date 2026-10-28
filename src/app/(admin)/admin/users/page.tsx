import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XpSource } from "@/lib/gamification/xp";
import { dayKey } from "@/lib/gamification/streak";

export const metadata: Metadata = {
  title: "Users Admin | LOCK.IN",
};

async function toggleRoleAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const currentRole = String(formData.get("currentRole") ?? "user");
  const nextRole = currentRole === "admin" ? "user" : "admin";

  await prisma.user.update({
    where: { id: userId },
    data: { role: nextRole },
  });

  revalidatePath("/admin/users");
}

async function adjustXpAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const amount = parseInt(String(formData.get("amount") ?? "0"), 10);
  const note = String(formData.get("note") ?? "").trim() || "admin-adjustment";

  if (amount !== 0) {
    await prisma.$transaction([
      prisma.xpEvent.create({
        data: {
          userId,
          source: XpSource.ADMIN,
          refId: `${note}-${Date.now()}`,
          amount,
          dayKey: dayKey(new Date()),
        },
      }),
      prisma.profile.update({
        where: { userId },
        data: { xp: { increment: amount } },
      }),
    ]);
  }

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
    },
    take: 50,
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Learners &amp; Staff</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Inspect profiles, manage permissions, and adjust XP balances.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Role</th>
                <th>XP &amp; Streak</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSeed = u.email.endsWith("@lockin.test");
                const isAdmin = u.role === "admin";

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                        <strong>{u.name}</strong>
                        {isSeed ? (
                          <span className="chip" style={{ fontSize: "10px", padding: "1px 5px", background: "var(--color-paper-2)" }}>
                            seed
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        {u.email}
                      </div>
                    </td>
                    <td>
                      <span
                        className="chip"
                        style={{
                          fontSize: "var(--text-xs)",
                          background: isAdmin ? "var(--color-forest)" : "var(--color-paper-2)",
                          color: isAdmin ? "var(--color-paper)" : "var(--color-ink)",
                          fontWeight: isAdmin ? 700 : undefined,
                        }}
                      >
                        {u.role ?? "user"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-outlier)" }}>
                      <div>{u.profile?.xp ?? 0} XP</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        {u.profile?.streakCurrent ?? 0}d streak
                      </div>
                    </td>
                    <td style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                      {u.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                        <form action={toggleRoleAction}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="currentRole" value={u.role ?? "user"} />
                          <button type="submit" className="btn btn--quiet btn--sm" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                            {isAdmin ? "Demote" : "Make Admin"}
                          </button>
                        </form>

                        <form action={adjustXpAction} style={{ display: "flex", gap: "2px" }}>
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="amount" value="50" />
                          <input type="hidden" name="note" value="bonus" />
                          <button type="submit" className="btn btn--quiet btn--sm" title="Add 50 bonus XP" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                            +50 XP
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
