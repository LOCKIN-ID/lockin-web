import type { TutorContext } from "../socratic";
import type { StreamTutorResult } from "./openrouter";

export async function streamGemini(
  question: string,
  context: TutorContext,
  onDelta: (delta: string) => void,
): Promise<StreamTutorResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const start = Date.now();

  const systemInstruction = `You are LOCK.IN's Socratic programming tutor.
Never provide complete solutions directly. Guide the student with questions, concept names, and small hints.
Context:
Book: ${context.bookTitle ?? "N/A"}
Chapter: ${context.chapterTitle ?? "N/A"}
Section: ${context.sectionTitle ?? "N/A"}
Keywords: ${context.keywords?.join(", ") ?? "N/A"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Gemini");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (delta) {
            fullText += delta;
            onDelta(delta);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return {
    text: fullText,
    model,
    latencyMs: Date.now() - start,
  };
}
