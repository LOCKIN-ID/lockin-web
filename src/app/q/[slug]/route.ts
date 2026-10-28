import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const quest = await prisma.quest.findUnique({
    where: { slug },
    select: { slug: true, revokedAt: true, expiresAt: true },
  });

  if (!quest) {
    return new Response("Quest not found", { status: 404 });
  }

  const now = new Date();
  if (quest.revokedAt !== null || (quest.expiresAt !== null && quest.expiresAt <= now)) {
    return new Response("This quest code has expired or was revoked. Please ask your instructor.", {
      status: 410,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 307 temporary redirect to the interactive quest runner
  const redirectUrl = new URL(`/app/quests/${quest.slug}?via=qr`, _request.url);
  return NextResponse.redirect(redirectUrl, { status: 307 });
}
