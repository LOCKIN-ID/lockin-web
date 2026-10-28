import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Mast } from "@/components/marketing/mast";
import { Masthead } from "@/components/marketing/masthead";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await currentUser();
  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { xp: true, streakCurrent: true },
  });

  return (
    <>
      <Masthead initialUser={session.user} initialProfile={profile} />
      <main id="main">{children}</main>
      <Mast />
    </>
  );
}
