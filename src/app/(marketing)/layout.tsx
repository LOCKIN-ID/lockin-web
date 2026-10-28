import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Mast } from "@/components/marketing/mast";
import { Masthead } from "@/components/marketing/masthead";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await currentUser();
  const profile = session?.user?.id
    ? await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { xp: true, streakCurrent: true },
      })
    : null;

  return (
    <>
      <Masthead initialUser={session?.user} initialProfile={profile} />
      <main id="main">{children}</main>
      <Mast />
    </>
  );
}
