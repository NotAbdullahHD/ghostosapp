import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pin, Star, Folder, Clock, Hash, Trash2, Tag,
  Bold, Italic, Underline, List, ListOrdered, Link2, Image as ImageIcon, Code2, Quote, Sparkles,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  body: string;
  folder: string;
  pinned?: boolean;
  updatedAt: number;
  color: string;
  tags: string[];
}

const FOLDERS = ["All Notes", "Personal", "Work", "Ideas", "Study", "Archive"];

const SEED: Note[] = [
  {
    id: "1", folder: "Work", pinned: true, color: "from-fuchsia-500/30 to-violet-700/30",
    title: "GhostOS launch checklist",
    body: "Rich text editor coming soon.\n\n• Cinematic boot sequence — polished\n• Control Center — new\n• Notification Center — refresh\n\nRemember to record a fresh trailer with the new dock magnification.",
    tags: ["ship", "priority"], updatedAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: "2", folder: "Ideas", pinned: true, color: "from-cyan-500/30 to-blue-700/30",
    title: "Spectral audio — album art generator",
    body: "Feed AI the mood tag + BPM range → get a set of consistent cover variants.\n\nSame palette family per artist. Add subtle grain for premium feel.",
    tags: ["ai", "music"], updatedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "3", folder: "Study",  color: "from-emerald-500/30 to-teal-700/30",
    title: "Linear Algebra · Chapter 6",
    body: "Eigenvalues → find det(A − λI) = 0.\nDiagonalization only when we have n linearly independent eigenvectors.",
    tags: ["math"], updatedAt: Date.now() - 1000 * 60 * 60 * 26,
  },
  {
    id: "4", folder: "Personal", color: "from-amber-500/30 to-orange-700/30",
    title: "Weekend playlist",
    body: "Late-night drives. Slower BPM, more shimmer.",
    tags: ["music"], updatedAt: Date.now() - 1000 * 60 * 60 * 72,
  },
  {
    id: "5", folder: "Work", color: "from-rose-500/30 to-red-700/30",
    title: "Design tokens audit",
    body: "Consolidate glass tokens. Every surface should pick from three blur intensities.",
    tags: ["design", "design-system"], updatedAt: Date.now() - 1000 * 60 * 60 * 96,
  },
];

function relTime(t: number) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotesApp() {
  const [notes, setNotes] = useState<Note[]>(SEED);
  const [folder, setFolder] = useState("All Notes");
  const [q, setQ] = useState("");
  const [activeId, setActiveId] = useState(SEED[0].id);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return notes
      .filter((n) => folder === "All Notes" || n.folder === folder)
      .filter((n) => !s || n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s) || n.tags.some((t) => t.includes(s)))
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  }, [notes, folder, q]);

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);

  const active = notes.find((n) => n.id === activeId) || filtered[0];

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((ns) => ns.map((n) => n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n));
  };

  const add = () => {
    const n: Note = {
      id: Math.random().toString(36).slice(2), title: "Untitled", body: "",
      folder: folder === "All Notes" ? "Personal" : folder,
      color: "from-fuchsia-500/30 to-violet-700/30", tags: [], updatedAt: Date.now(),
    };
    setNotes((ns) => [n, ...ns]);
    setActiveId(n.id);
  };

  const remove = (id: string) => {
    setNotes((ns) => ns.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(filtered[0]?.id ?? "");
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-black via-yellow-950/5 to-black text-white">
      {/* Folders */}
      <div className="w-52 border-r border-white/5 flex flex-col">
        <div className="p-4">
          <div className="text-[10px] tracking-[0.4em] text-amber-300/70 font-mono">GHOSTOS</div>
          <div className="text-xl font-bold mt-1">Notes</div>
        </div>
        <div className="px-3 space-y-0.5">
          {FOLDERS.map((f) => (
            <button key={f} onClick={() => setFolder(f)}
              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs transition ${
                folder === f ? "bg-fuchsia-500/15 text-white ring-1 ring-fuchsia-400/30" : "text-white/70 hover:bg-white/5"
              }`}>
              <Folder className="h-3.5 w-3.5 opacity-70" />
              <span className="flex-1 truncate">{f}</span>
              <span className="text-[10px] font-mono text-white/40">
                {f === "All Notes" ? notes.length : notes.filter((n) => n.folder === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="px-3 mt-4">
          <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1 px-3">SMART</div>
          <button className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5">
            <Pin className="h-3.5 w-3.5" /> Pinned
            <span className="ml-auto text-[10px] font-mono text-white/40">{notes.filter((n) => n.pinned).length}</span>
          </button>
          <button className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5">
            <Clock className="h-3.5 w-3.5" /> Recent
          </button>
          <button className="w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/5">
            <Star className="h-3.5 w-3.5" /> Starred
          </button>
        </div>

        <div className="flex-1" />
        <div className="p-3">
          <button onClick={add}
            className="w-full flex items-center justify-center gap-2 rounded-xl gradient-neon py-2 text-xs font-bold shadow-lg shadow-fuchsia-500/30 hover:scale-[1.02] transition">
            <Plus className="h-4 w-4" /> NEW NOTE
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="w-72 border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10">
            <Search className="h-3 w-3 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes"
              className="bg-transparent outline-none text-xs flex-1 placeholder:text-white/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2">
          {pinned.length > 0 && (
            <>
              <div className="text-[10px] font-mono tracking-widest text-fuchsia-300/70 px-3 py-1.5">PINNED</div>
              {pinned.map((n) => <NoteRow key={n.id} n={n} active={active?.id === n.id} onClick={() => setActiveId(n.id)} onDelete={() => remove(n.id)} />)}
            </>
          )}
          {others.length > 0 && (
            <>
              <div className="text-[10px] font-mono tracking-widest text-white/40 px-3 py-1.5 mt-2">RECENT</div>
              {others.map((n) => <NoteRow key={n.id} n={n} active={active?.id === n.id} onClick={() => setActiveId(n.id)} onDelete={() => remove(n.id)} />)}
            </>
          )}
          {filtered.length === 0 && (
            <div className="text-xs text-white/40 text-center py-10">No notes here.</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0 flex flex-col">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.div key={active.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
              <div className={`h-1 w-full bg-gradient-to-r ${active.color}`} />
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5">
                <ToolbarBtn icon={<Bold className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<Italic className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<Underline className="h-3.5 w-3.5" />} />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarBtn icon={<List className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<ListOrdered className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<Quote className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<Code2 className="h-3.5 w-3.5" />} />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarBtn icon={<Link2 className="h-3.5 w-3.5" />} />
                <ToolbarBtn icon={<ImageIcon className="h-3.5 w-3.5" />} />
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={() => update({ pinned: !active.pinned })}
                    className={`h-7 px-2 rounded-md text-[10px] font-mono tracking-widest flex items-center gap-1 transition ${
                      active.pinned ? "bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-400/30" : "text-white/60 hover:bg-white/10"
                    }`}>
                    <Pin className="h-3 w-3" /> {active.pinned ? "PINNED" : "PIN"}
                  </button>
                  <button className="h-7 px-2 rounded-md text-[10px] font-mono tracking-widest text-fuchsia-200/90 hover:bg-white/10 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI
                  </button>
                  <button onClick={() => remove(active.id)} className="h-7 w-7 rounded-md text-white/50 hover:text-rose-400 hover:bg-white/10 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="px-8 pt-6 pb-2">
                <input value={active.title} onChange={(e) => update({ title: e.target.value })}
                  className="bg-transparent outline-none text-3xl font-bold w-full placeholder:text-white/20" placeholder="Untitled" />
                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/40 tracking-widest">
                  <span>{active.folder.toUpperCase()}</span>
                  <span>·</span>
                  <span>EDITED {relTime(active.updatedAt).toUpperCase()}</span>
                  {active.tags.length > 0 && <>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{active.tags.join(" #")}</span>
                  </>}
                </div>
              </div>

              <textarea value={active.body} onChange={(e) => update({ body: e.target.value })}
                placeholder="Start writing…"
                className="flex-1 bg-transparent outline-none px-8 pb-6 text-sm text-white/85 leading-relaxed resize-none font-mono placeholder:text-white/25" />
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-4">
                <Tag className="h-7 w-7 text-white/40" />
              </div>
              <div className="text-sm text-white/60">Pick a note or create a new one.</div>
              <button onClick={add} className="mt-4 px-4 py-2 rounded-full text-xs font-mono tracking-widest gradient-neon">+ NEW NOTE</button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolbarBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="h-7 w-7 rounded-md text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition">
      {icon}
    </button>
  );
}

function NoteRow({ n, active, onClick, onDelete }: { n: Note; active: boolean; onClick: () => void; onDelete: () => void }) {
  return (
    <div className="relative group">
      <button onClick={onClick}
        className={`w-full text-left p-3 rounded-lg transition ring-1 ${
          active ? "ring-fuchsia-400/40 bg-white/5" : "ring-transparent hover:bg-white/5"
        }`}>
        <div className="flex items-center gap-2">
          {n.pinned && <Pin className="h-3 w-3 text-fuchsia-300" />}
          <div className="text-sm font-bold truncate flex-1">{n.title}</div>
        </div>
        <div className="text-[11px] text-white/50 truncate mt-0.5">{n.body.split("\n")[0] || "No additional text"}</div>
        <div className="text-[10px] text-white/30 font-mono mt-1 flex items-center gap-2">
          <span>{relTime(n.updatedAt)}</span>
          {n.tags[0] && <span className="text-fuchsia-300/70">#{n.tags[0]}</span>}
        </div>
      </button>
      <button onClick={onDelete}
        className="absolute top-2 right-2 h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 text-white/50 hover:text-rose-400 hover:bg-white/10 flex items-center justify-center transition">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
