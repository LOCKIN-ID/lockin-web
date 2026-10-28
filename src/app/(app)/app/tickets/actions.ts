"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runSerial } from "@/lib/db";

export async function replyToTicket(ticketId: string, formData: FormData): Promise<{ ok: boolean; message?: string }> {
  const session = await requireUser();
  const userId = session.user.id;
  const body = String(formData.get("message") ?? "").trim();

  if (!body || body.length < 5) {
    return { ok: false, message: "Reply must be at least 5 characters." };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
    select: { id: true, subject: true },
  });

  if (!ticket) {
    return { ok: false, message: "Ticket not found." };
  }

  const now = new Date();

  await runSerial<unknown>([
    () =>
      prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          authorRole: "user",
          authorName: session.user.name ?? "User",
          body,
          createdAt: now,
        },
      }),
    () =>
      prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "open",
          updatedAt: now,
        },
      }),
  ]);

  revalidatePath(`/app/tickets/${ticketId}`);
  revalidatePath("/app/tickets");

  return { ok: true };
}
