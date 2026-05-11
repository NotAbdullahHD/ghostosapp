import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Lock, Plus, X, Star, Shield } from "lucide-react";

interface Tab { id: string; title: string; url: string; }

export function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Spectre Start", url: "spectre://home" },
    { id: "2", title: "Ghost Net", url: "ghost://search" },
  ]);
  const [active, setActive] = useState("1");
  const [url, setUrl] = useState("spectre://home");

  const addTab = () => {
    const id = Math.random().toString(36).slice(2);
    setTabs((t) => [...t, { id, title: "New Tab", url: "spectre://home" }]);
    setActive(id);
  };
  const closeTab = (id: string) => {
    setTabs((t) => t.filter((x) => x.id !== id));
    if (id === active && tabs.length > 1) setActive(tabs.find((x) => x.id !== id)!.id);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0612] text-white">
      {/* Tabs */}
      <div className="flex items-end gap-1 px-2 pt-2 bg-black/40">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setActive(t.id); setUrl(t.url); }}
            className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs max-w-[200px] transition ${
              active === t.id ? "bg-white/8 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
            <span className="truncate">{t.title}</span>
            <X onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-red-400" />
          </button>
        ))}
        <button onClick={addTab} className="p-2 text-white/50 hover:text-white"><Plus className="h-3.5 w-3.5" /></button>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/5">
        <button className="p-1.5 rounded hover:bg-white/5 text-white/50"><ArrowLeft className="h-3.5 w-3.5" /></button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/50"><ArrowRight className="h-3.5 w-3.5" /></button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/50"><RotateCw className="h-3.5 w-3.5" /></button>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs">
          <Lock className="h-3 w-3 text-emerald-400" />
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-white/80" />
          <Star className="h-3 w-3 text-white/40" />
        </div>
        <button className="p-1.5 rounded hover:bg-white/5 text-fuchsia-300"><Shield className="h-3.5 w-3.5" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col items-center pt-16 px-6 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="text-6xl font-black neon-text tracking-widest">SPECTRE</div>
        <div className="text-[10px] tracking-[0.4em] text-white/40 font-mono mt-1">PRIVATE · QUANTUM · GHOSTOS</div>
        <div className="mt-8 w-full max-w-xl">
          <div className="glass rounded-full flex items-center gap-2 px-4 py-3 neon-border">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <input placeholder="Search the spectral web…" className="flex-1 bg-transparent outline-none text-sm" />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-4 gap-3 w-full max-w-xl">
          {["GhostNet", "DarkPipe", "Vault", "Signals", "Forge", "Echo", "Halo", "Nimbus"].map((s) => (
            <button key={s} className="glass rounded-xl py-4 text-xs font-mono hover:neon-border transition">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
