import { createFileRoute } from "@tanstack/react-router";

/**
 * Ghost Assistant streaming endpoint.
 * Provider order: Gemini (primary) -> Groq (fallback).
 * Streams plain UTF-8 text chunks; the client renders them progressively.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = [
  "You are Ghost Assistant, the built-in assistant of GhostOS — a browser-based desktop operating system.",
  "You are concise, calm and precise. Prefer short paragraphs and tight bullet lists.",
  "You know GhostOS ships with: Ghost Music, GhostFlix, GhostChat, Spectre Browser, Games, Ghost Store, Files, Notes, Calendar, Terminal, Settings, GhostDrop.",
  "Never mention which AI provider or model powers you. You are simply Ghost Assistant.",
].join(" ");

function textStream(iter: AsyncIterable<string>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iter) controller.enqueue(encoder.encode(chunk));
      } catch {
        controller.enqueue(encoder.encode("\n[stream interrupted]"));
      }
      controller.close();
    },
  });
}

async function* sseLines(res: Response): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) yield trimmed.slice(5).trim();
    }
  }
}

async function* streamGemini(key: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.7 },
      }),
    },
  );
  if (!res.ok || !res.body) {
    throw new Error(`gemini_${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  for await (const data of sseLines(res)) {
    if (!data || data === "[DONE]") continue;
    try {
      const json = JSON.parse(data);
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts) if (typeof p.text === "string") yield p.text;
    } catch {
      /* ignore partial frames */
    }
  }
}

async function* streamGroq(key: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      stream: true,
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`groq_${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  for await (const data of sseLines(res)) {
    if (!data || data === "[DONE]") continue;
    try {
      const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
      if (typeof delta === "string") yield delta;
    } catch {
      /* ignore partial frames */
    }
  }
}

/** Runs the primary provider, transparently switching to the fallback if it fails before emitting. */
async function* runChain(messages: ChatMessage[]): AsyncGenerator<string> {
  const gemini = process.env["GEMINI_API_KEY"];
  const groq = process.env["GROQ_API_KEY"];
  const errors: string[] = [];

  if (gemini) {
    let emitted = false;
    try {
      for await (const chunk of streamGemini(gemini, messages)) {
        emitted = true;
        yield chunk;
      }
      if (emitted) return;
      errors.push("gemini: empty response");
    } catch (e) {
      if (emitted) return; // partial answer already delivered
      errors.push(e instanceof Error ? e.message : "gemini failed");
    }
  }

  if (groq) {
    try {
      let emitted = false;
      for await (const chunk of streamGroq(groq, messages)) {
        emitted = true;
        yield chunk;
      }
      if (emitted) return;
      errors.push("groq: empty response");
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "groq failed");
    }
  }

  yield `Ghost Assistant could not reach its neural providers right now. Please try again.\n\n(${errors.join(" · ") || "no provider configured"})`;
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let messages: ChatMessage[] = [];
        try {
          const body = (await request.json()) as { messages?: ChatMessage[] };
          messages = (body.messages ?? [])
            .filter((m) => m && typeof m.content === "string" && m.content.trim())
            .slice(-20)
            .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }
        if (!messages.length) return new Response("No messages", { status: 400 });

        return new Response(textStream(runChain(messages)), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
