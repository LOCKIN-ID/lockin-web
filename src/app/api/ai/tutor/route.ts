import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTutorContext, buildSupportContext } from "@/lib/ai/context";
import { nextHint } from "@/lib/ai/socratic";
import { streamOpenRouter } from "@/lib/ai/providers/openrouter";
import { streamGemini } from "@/lib/ai/providers/gemini";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024; // 8 KB
const RATE_LIMIT_PER_HOUR = 20;

export async function POST(req: Request) {
  // Body size check
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    persona?: "support" | "tutor";
    message?: string;
    bookSlug?: string;
    chapterId?: string;
    sectionId?: string;
    code?: string;
  };

  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const message = (body.message ?? "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = await currentUser();
  const userId = session?.user?.id;

  // Rate limiting for signed in users
  if (userId) {
    const oneHourAgo = new Date(Date.now() - 3600_000);
    const messageCount = await prisma.chatMessage.count({
      where: {
        thread: { userId },
        createdAt: { gte: oneHourAgo },
      },
    });

    if (messageCount >= RATE_LIMIT_PER_HOUR) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded (20 questions per hour). Try again later or open a ticket.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const persona = body.persona ?? "tutor";
  const configuredProvider = (process.env.TUTOR_PROVIDER ?? "offline").toLowerCase();

  let activeProvider: "offline" | "openrouter" | "gemini" = "offline";
  if (configuredProvider === "openrouter" && process.env.OPENROUTER_API_KEY) {
    activeProvider = "openrouter";
  } else if (configuredProvider === "gemini" && process.env.GEMINI_API_KEY) {
    activeProvider = "gemini";
  }

  const context = buildTutorContext(body.bookSlug, body.chapterId, body.sectionId);

  // Set up SSE streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const pushDelta = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
      };

      try {
        if (persona === "support") {
          // Support persona
          const supportInfo = buildSupportContext(message);
          const responseText = `Here is what our documentation says:\n\n${supportInfo}\n\nNeed further help? You can open a ticket at /contact or reach us on WhatsApp.`;
          pushDelta(responseText);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, provider: "offline", model: "support-knowledge-base" })}\n\n`,
            ),
          );
        } else if (activeProvider === "openrouter") {
          const res = await streamOpenRouter(message, context, pushDelta);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, provider: "openrouter", model: res.model })}\n\n`,
            ),
          );
        } else if (activeProvider === "gemini") {
          const res = await streamGemini(message, context, pushDelta);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, provider: "gemini", model: res.model })}\n\n`,
            ),
          );
        } else {
          // Deterministic Offline Socratic Engine
          const hint = nextHint({
            question: message,
            code: body.code,
            context,
          });

          pushDelta(hint.text);
          if (hint.example) {
            pushDelta(`\n\n\`\`\`\n${hint.example}\n\`\`\``);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                hintLevel: hint.level,
                provider: "offline",
                model: "socratic-ladder",
              })}\n\n`,
            ),
          );
        }

        // Record message in database if user is authenticated
        if (userId) {
          try {
            const thread =
              (await prisma.chatThread.findFirst({ where: { userId } })) ??
              (await prisma.chatThread.create({ data: { userId, title: "Tutor session" } }));
            await prisma.chatMessage.create({
              data: {
                threadId: thread.id,
                role: "user",
                content: message,
                provider: activeProvider,
                model: activeProvider,
              },
            });
          } catch {
            // non-fatal for stream completion
          }
        }
      } catch (err: unknown) {
        // Fallback to offline hint on runtime error
        const hint = nextHint({ question: message, context });
        pushDelta(`(Offline fallback) ${hint.text}`);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              hintLevel: hint.level,
              provider: "offline",
              model: "socratic-ladder",
            })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Tutor-Mode": activeProvider,
    },
  });
}
