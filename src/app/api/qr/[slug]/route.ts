import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const quest = await prisma.quest.findUnique({
    where: { slug },
    select: { slug: true, code: true },
  });

  if (!quest) {
    return new Response("Quest not found", { status: 404 });
  }

  const host = process.env.APP_URL ?? new URL(request.url).origin;
  const targetUrl = `${host}/q/${quest.slug}`;

  const svg = await QRCode.toString(targetUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: {
      dark: "#0F281E", // forest ink
      light: "#00000000", // transparent
    },
  });

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
