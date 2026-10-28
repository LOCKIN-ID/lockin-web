import type { TutorContext } from "../socratic";

export interface StreamTutorResult {
  text: string;
  model: string;
  latencyMs: number;
}

export async function streamOpenRouter(
  question: string,
  context: TutorContext,
  onDelta: (delta: string) => void,
): Promise<StreamTutorResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const model = process.env.OPENROUTER_MODEL ?? "meta-llama/llama-3.3-70b-instruct";
  const start = Date.now();

  const systemPrompt = `You are LOCK.IN's Socratic programming tutor.
Your rules are strict:
1. NEVER give the user the complete solution or full code block if they ask for the answer.
2. Guide them step-by-step: first restate the goal, point them to the concept or line, provide a tiny micro-example with DIFFERENT variables, and prompt them to think.
3. Be concise and technical.
Context:
Book: ${context.bookTitle ?? "N/A"}
Chapter: ${context.chapterTitle ?? "N/A"}
Section: ${context.sectionTitle ?? "N/A"}
Keywords: ${context.keywords?.join(", ") ?? "N/A"}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://lockin.study",
      "X-Title": "LOCK.IN",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter returned status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from OpenRouter");

  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith(":") || !line.trim()) continue; // skip comments / empty
      if (line.startsWith("data: ")) {
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") break;
        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
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
