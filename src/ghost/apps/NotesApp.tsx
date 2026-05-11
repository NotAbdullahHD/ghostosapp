import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Tag } from "lucide-react";

interface Note { id: string; title: string; body: string; color: string; tag: string; }
const initial: Note[] = [
  { id: "1", title: "GhostOS launch list", body: "• upload trailer\n• post on TikTok\n• ping the discord", color: "from-fuchsia-500/30 to-violet-700/30", tag: "ship" },
  { id: "2", title: "Math 204 — Lecture", body: "eigenvalues, diagonalization, page 144 problems", color: "from-cyan-500/30 to-blue-700/30", tag: "school" },
  { id: "3", title: "Game ideas", body: "neon racer with reverse-time mechanic. roguelike loop.", color: "from-emerald-500/30 to-teal-700/30", tag: "ideas" },
  { id: "4", title: "Groceries", body: "ramen, monster, more ramen", color: "from-amber-500/30 to-orange-700/30", tag: "life" },
];

export function NotesApp() {
  const [notes, setNotes] = useState(initial);
  const [active, setActive] = useState(initial[0].id);
  const cur = notes.find((n) => n.id === active)!;
  const update = (patch: Partial<Note>) => setNotes((ns) => ns.map((n) => n.id === active ? { ...n, ...patch } : n));
  const add = () => {
    const n: Note = { id: Math.random().toString(36).slice(2), title: "Untitled", body: "", color: "from-yellow-400/30 to-amber-600/30", tag: "new" };
    setNotes((ns) => [n, ...ns]); setActive(n.id);
  };
  return (
    <div className="h-full flex bg-gradient-to-br from-black via-yellow-950/10 to-black text-white">
      <div className="w-64 border-r border-white/5 flex flex-col">
        <div className="p-3 flex gap-2 border-b border-white/5">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
            <Search className="h-3 w-3 text-white/40" />
            <input placeholder="Search…" className="bg-transparent outline-none text-xs flex-1" />
          </div>
          <button onClick={add} className="h-8 w-8 rounded-full gradient-neon flex items-center justify-center hover:scale-105 transition"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 flex flex-col gap-1">
          {notes.map((n) => (
            <button key={n.id} onClick={() => setActive(n.id)}
              className={`text-left p-3 rounded-lg transition ring-1 ${active === n.id ? "ring-fuchsia-400/40 bg-white/5" : "ring-transparent hover:bg-white/5"}`}>
              <div className="text-sm font-bold truncate">{n.title}</div>
              <div className="text-[11px] text-white/40 truncate">{n.body.split("\n")[0]}</div>
              <div className="text-[9px] text-fuchsia-300 font-mono mt-1 flex items-center gap-1"><Tag className="h-2.5 w-2.5" /> {n.tag}</div>
            </button>
          ))}
        </div>
      </div>
      <motion.div key={cur.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
        <div className={`h-1 w-full bg-gradient-to-r ${cur.color}`} />
        <input value={cur.title} onChange={(e) => update({ title: e.target.value })}
          className="bg-transparent outline-none text-2xl font-bold px-6 py-4" />
        <textarea value={cur.body} onChange={(e) => update({ body: e.target.value })}
          className="flex-1 bg-transparent outline-none px-6 pb-6 text-sm text-white/80 leading-relaxed resize-none font-mono" />
      </motion.div>
    </div>
  );
}
