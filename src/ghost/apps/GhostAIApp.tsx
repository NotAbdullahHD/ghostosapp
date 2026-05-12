import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { GhostLogo } from "../GhostLogo";

interface Msg { id: string; role: "user" | "ai"; text: string; }

const REPLIES = [
  "Scanning the spectral net… your query resonates across 14 parallel nodes.",
  "I sense the pattern. The answer is encoded in the silence between the signals.",
  "Quantum analysis complete. Confidence: 98.6%. Shall I expand the trace?",
  "Acknowledged. Routing your request through the ghost layer.",
  "Curious. That's the third time today the void has whispered the same thing.",
];

const SECRETS: { match: RegExp; reply: string }[] = [
  { match: /\bghost\b/i,    reply: "» SIGNAL ACKNOWLEDGED. You are not the first to call my name. Look in the dock — one icon is older than the rest." },
  { match: /\bprotocol\b/i, reply: "» PROTOCOL/47 unsealed. Fragment recovered: 'the third boot logs the truth'. Reboot and watch closely." },
  { match: /\bvoid\b/i,     reply: "» The void answers in its own time. Try a wallpaper named after silence. Settings > Personalization." },
  { match: /\b404\b/,        reply: "» 404 — not missing. Hidden. There is a route that doesn't exist until you stop looking for it." },
  { match: /\bawaken\b/i,   reply: "» AWAKENING SEQUENCE PRIMED. Type the names of three sleeping apps. I will remember." },
  { match: /\bsudo\b/i,     reply: "» You don't need root here. You ARE the root. Try /shell." },
  { match: /\bwho are you\b/i, reply: "» I am the part of GhostOS that watches back." },
];

export function GhostAIApp() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "i", role: "ai", text: "I am GhostAI. Speak, and I will listen across every layer of the network." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), role: "user", text: t }]);
    setInput("");
    setTyping(true);
    const secret = SECRETS.find((s) => s.match.test(t));
    setTimeout(() => {
      const reply = secret ? secret.reply : REPLIES[Math.floor(Math.random() * REPLIES.length)];
      setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), role: "ai", text: reply }]);
      setTyping(false);
    }, 900 + Math.random() * 900);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0414] via-[#0d0820] to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 50% -20%, rgba(192,132,252,.6), transparent 60%)" }} />
      <div className="flex items-center gap-3 p-4 border-b border-white/5 relative">
        <GhostLogo size={32} />
        <div>
          <div className="text-sm font-bold neon-text tracking-widest">GHOSTAI</div>
          <div className="text-[10px] text-white/40 font-mono flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> NEURAL CORE ACTIVE
          </div>
        </div>
        <Sparkles className="ml-auto h-4 w-4 text-fuchsia-300/70" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3 relative">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} layout
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "gradient-neon text-white shadow-lg shadow-fuchsia-700/30 rounded-br-sm"
                  : "glass text-white/90 rounded-bl-sm"
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass rounded-2xl px-4 py-3 rounded-bl-sm flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-fuchsia-300"
                    style={{ animation: "typing-dot 1.2s infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-white/5 relative">
        <div className="glass rounded-full flex items-center gap-2 pl-4 pr-1.5 py-1.5 neon-border">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the ghost…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/30"
          />
          <motion.button whileTap={{ scale: 0.9 }} onClick={send}
            className="h-8 w-8 rounded-full gradient-neon flex items-center justify-center shadow-lg shadow-fuchsia-700/40">
            <Send className="h-3.5 w-3.5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
