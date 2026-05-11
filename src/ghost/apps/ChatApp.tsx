import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Phone, Video, MoreHorizontal, Lock } from "lucide-react";

const contacts = [
  { n: "Nyx",       last: "see you in the void.",       u: 2, c: "from-fuchsia-500 to-violet-700" },
  { n: "Echo",      last: "decrypting now…",            u: 0, c: "from-cyan-400 to-blue-700" },
  { n: "Orion",     last: "ghosted lol",                u: 5, c: "from-rose-500 to-pink-700" },
  { n: "Specter",   last: "drop the file.",             u: 0, c: "from-emerald-500 to-teal-700" },
  { n: "Vex",       last: "we ride at midnight.",       u: 1, c: "from-amber-500 to-orange-700" },
  { n: "Halo",      last: "did you see her stream?",    u: 0, c: "from-indigo-500 to-purple-700" },
];

export function ChatApp() {
  const [active, setActive] = useState(0);
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState([
    { from: "them", t: "yo, you online?" },
    { from: "me",   t: "ghost mode. always." },
    { from: "them", t: "the new arcade drop is unreal" },
    { from: "them", t: "drop the link?" },
  ]);
  const send = () => {
    if (!msg.trim()) return;
    setThread((th) => [...th, { from: "me", t: msg }]);
    setMsg("");
    setTimeout(() => setThread((th) => [...th, { from: "them", t: "🔥" }]), 700);
  };
  const c = contacts[active];
  return (
    <div className="h-full flex bg-gradient-to-br from-black via-sky-950/20 to-black text-white">
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input placeholder="Search ghosts…" className="bg-transparent outline-none text-xs flex-1" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {contacts.map((ct, i) => (
            <button key={ct.n} onClick={() => setActive(i)}
              className={`w-full flex items-center gap-3 p-3 text-left transition ${i === active ? "bg-white/8" : "hover:bg-white/5"}`}>
              <div className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${ct.c} ring-1 ring-white/15`}>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{ct.n}</div>
                <div className="text-[11px] text-white/40 truncate">{ct.last}</div>
              </div>
              {ct.u > 0 && <span className="text-[10px] bg-fuchsia-500 text-white rounded-full px-1.5 py-0.5">{ct.u}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-white/5">
          <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${c.c} ring-1 ring-white/15`} />
          <div className="flex-1">
            <div className="text-sm font-bold">{c.n}</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> end-to-end encrypted</div>
          </div>
          <Phone className="h-4 w-4 text-white/60" />
          <Video className="h-4 w-4 text-white/60" />
          <MoreHorizontal className="h-4 w-4 text-white/60" />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {thread.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.from === "me"
                  ? "self-end bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white rounded-br-md"
                  : "self-start glass text-white/90 rounded-bl-md"}`}>{m.t}</motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="p-3 border-t border-white/5 flex items-center gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…" className="flex-1 px-4 py-2 rounded-full bg-white/5 outline-none text-sm border border-white/5 focus:border-fuchsia-400/40" />
          <button onClick={send} className="h-9 w-9 rounded-full gradient-neon flex items-center justify-center hover:scale-105 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
