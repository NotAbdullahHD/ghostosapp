import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw, Square } from "lucide-react";
import { GhostLogo } from "../GhostLogo";

interface Msg { id: string; role: "user" | "assistant"; text: string }

const SUGGESTIONS = [
  "Explain what GhostOS can do",
  "Write a short sci-fi opening line",
  "Summarise this in three bullets",
  "Help me plan my week",
];

const uid = () => Math.random().toString(36).slice(2);

/** Ghost Assistant — streaming OS-level assistant (Gemini primary, Groq fallback). */
export function GhostAIApp() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");

    const history = [...messages, { id: uid(), role: "user" as const, text }];
    setMessages(history);
    setStreaming(true);

    const replyId = uid();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.text })),
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Assistant unavailable (${res.status})`);

      setMessages((m) => [...m, { id: replyId, role: "assistant", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, text: x.text + chunk } : x)));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setMessages((m) => m.filter((x) => x.id !== replyId || x.text));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [messages, streaming]);

  const stop = () => abortRef.current?.abort();

  const lastIsEmptyAssistant =
    streaming && messages[messages.length - 1]?.role === "assistant" && !messages[messages.length - 1]?.text;

  return (
    <div className="flex h-full flex-col bg-[#0b0b0d] text-white/90">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
        <GhostLogo size={26} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tracking-tight">Ghost Assistant</div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/35">
            <span className={`h-1.5 w-1.5 rounded-full ${streaming ? "bg-[var(--ice)] animate-pulse" : "bg-emerald-400/70"}`} />
            {streaming ? "Thinking" : "Ready"}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { stop(); setMessages([]); setError(null); }}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/50 transition hover:border-white/20 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" /> New chat
          </button>
        )}
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto scrollbar-hide px-4 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div>
              <div className="text-[22px] font-semibold tracking-tight text-white">Ghost Assistant</div>
              <p className="mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-white/40">
                Built into GhostOS. Ask anything — it answers as it thinks.
              </p>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s} onClick={() => send(s)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left text-[11.5px] text-white/60 transition hover:border-[var(--ice)]/30 hover:bg-white/[0.06] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <motion.div
            key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-[var(--ice)]/15 text-white ring-1 ring-[var(--ice)]/25"
                  : "rounded-bl-md border border-white/[0.08] bg-white/[0.04] text-white/85"
              }`}
            >
              {m.text}
            </div>
          </motion.div>
        ))}

        {lastIsEmptyAssistant && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--ice)]"
                  style={{ animation: "typing-dot 1.2s infinite", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-center text-[11.5px] text-rose-200/90">
            {error}
            <button onClick={() => send(messages[messages.length - 1]?.text ?? "")} className="ml-2 underline underline-offset-2">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.07] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2 focus-within:border-[var(--ice)]/35">
          <textarea
            ref={inputRef} rows={1} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); }
            }}
            placeholder="Message Ghost Assistant…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[12.5px] outline-none placeholder:text-white/25"
          />
          {streaming ? (
            <button
              onClick={stop}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20"
              aria-label="Stop"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => void send(input)} disabled={!input.trim()}
              className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ice)] text-black transition hover:brightness-110 disabled:opacity-25"
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
