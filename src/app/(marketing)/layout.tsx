import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Mast } from "@/components/marketing/mast";
import { Masthead } from "@/components/marketing/masthead";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  let profile = null;

  try {
    session = await currentUser();
    if (session?.user?.id) {
      profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { xp: true, streakCurrent: true },
      });
    }
  } catch {
    // Guest visit or unconfigured DB in edge deployment
  }
  return (
    <>
      <Masthead initialUser={session?.user} initialProfile={profile} />
      <main id="main">{children}</main>
      <Mast />
    </>
  );
}
