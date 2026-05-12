import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCw, Lock, Plus, X, Star, Shield, Loader2, GraduationCap, Globe } from "lucide-react";

interface Tab { id: string; title: string; url: string; loading?: boolean; }

const ENGINES = {
  duckduckgo: { name: "DuckDuckGo", color: "from-orange-500 to-red-600", url: (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  google:     { name: "Google",     color: "from-blue-500 to-cyan-500",  url: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  brave:      { name: "Brave",      color: "from-orange-600 to-amber-700", url: (q: string) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
} as const;
type EngineId = keyof typeof ENGINES;

const SCHOOL_PRESETS = [
  { id: "classroom", name: "Google Classroom", title: "Classroom", url: "https://classroom.google.com", color: "from-emerald-500 to-green-700" },
  { id: "docs",      name: "Google Docs",      title: "Docs",      url: "https://docs.google.com",      color: "from-blue-500 to-indigo-700" },
  { id: "drive",     name: "Google Drive",     title: "Drive",     url: "https://drive.google.com",     color: "from-yellow-500 to-amber-700" },
  { id: "canvas",    name: "Canvas",           title: "Canvas",    url: "https://canvas.instructure.com", color: "from-rose-500 to-red-700" },
  { id: "classlink", name: "ClassLink",        title: "ClassLink", url: "https://launchpad.classlink.com", color: "from-sky-500 to-blue-700" },
];

const SHORTCUTS = [
  { name: "GhostNet",  url: "spectre://home" },
  { name: "DarkPipe",  url: "spectre://darkpipe" },
  { name: "Vault",     url: "spectre://vault" },
  { name: "GitHub",    url: "https://github.com" },
  { name: "Wikipedia", url: "https://wikipedia.org" },
  { name: "YouTube",   url: "https://youtube.com" },
  { name: "Reddit",    url: "https://reddit.com" },
  { name: "ChatGPT",   url: "https://chatgpt.com" },
];

export function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Spectre Start", url: "spectre://home" },
  ]);
  const [active, setActive] = useState("1");
  const [url, setUrl] = useState("spectre://home");
  const [engine, setEngine] = useState<EngineId>("duckduckgo");
  const [enginePickerOpen, setEnginePickerOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === active);

  const setActiveTab = (id: string) => {
    setActive(id);
    const t = tabs.find((x) => x.id === id);
    if (t) setUrl(t.url);
  };

  const addTab = (preset?: { url: string; title: string }) => {
    const id = Math.random().toString(36).slice(2);
    const t: Tab = preset
      ? { id, title: preset.title, url: preset.url, loading: true }
      : { id, title: "New Tab", url: "spectre://home" };
    setTabs((arr) => [...arr, t]);
    setActive(id);
    setUrl(t.url);
  };

  const closeTab = (id: string) => {
    setTabs((arr) => {
      const next = arr.filter((x) => x.id !== id);
      if (id === active && next.length) {
        setActive(next[next.length - 1].id);
        setUrl(next[next.length - 1].url);
      }
      return next.length ? next : [{ id: "1", title: "Spectre Start", url: "spectre://home" }];
    });
  };

  const navigate = (raw: string) => {
    let target = raw.trim();
    if (!target) return;
    if (target.startsWith("spectre://")) {
      setTabs((arr) => arr.map((t) => t.id === active ? { ...t, url: target, title: "Spectre Start", loading: false } : t));
      setUrl(target);
      return;
    }
    const looksLikeUrl = /^(https?:\/\/|www\.)/i.test(target) || /\.[a-z]{2,}(\/|$)/i.test(target);
    if (looksLikeUrl) {
      if (!/^https?:\/\//i.test(target)) target = "https://" + target;
    } else {
      target = ENGINES[engine].url(target);
    }
    setTabs((arr) => arr.map((t) => t.id === active ? { ...t, url: target, title: hostnameOf(target), loading: true } : t));
    setUrl(target);
  };

  const applyPreset = (p: typeof SCHOOL_PRESETS[number]) => {
    setPresetsOpen(false);
    if (activeTab) {
      setTabs((arr) => arr.map((t) => t.id === active ? { ...t, url: p.url, title: p.title, loading: true } : t));
      setUrl(p.url);
    } else {
      addTab({ url: p.url, title: p.title });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#070410] text-white relative overflow-hidden">
      {/* Tabs bar */}
      <div className="flex items-end gap-1 px-2 pt-2 bg-black/60 border-b border-white/5 relative">
        <AnimatePresence initial={false}>
          {tabs.map((t) => (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.9 }}
              transition={{ duration: 0.18 }}
              onClick={() => setActiveTab(t.id)}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs max-w-[200px] transition ${
                active === t.id ? "bg-white/[0.08] text-white" : "text-white/50 hover:text-white/85 hover:bg-white/5"
              }`}>
              {t.loading
                ? <Loader2 className="h-3 w-3 animate-spin text-fuchsia-300 shrink-0" />
                : <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,.9)] shrink-0" />}
              <span className="truncate">{t.title}</span>
              <X onClick={(e) => { e.stopPropagation(); closeTab(t.id); }} className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-red-400 shrink-0" />
              {active === t.id && (
                <motion.span layoutId="activeTabUnderline" className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent" />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
        <button onClick={() => addTab()} className="p-2 text-white/50 hover:text-fuchsia-300 transition"><Plus className="h-3.5 w-3.5" /></button>
      </div>

      {/* Address bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border-b border-white/5">
        <button className="p-1.5 rounded hover:bg-white/5 text-white/50"><ArrowLeft className="h-3.5 w-3.5" /></button>
        <button className="p-1.5 rounded hover:bg-white/5 text-white/50"><ArrowRight className="h-3.5 w-3.5" /></button>
        <button onClick={() => activeTab && navigate(activeTab.url)} className="p-1.5 rounded hover:bg-white/5 text-white/50"><RotateCw className="h-3.5 w-3.5" /></button>

        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 border border-white/10 text-xs focus-within:border-fuchsia-400/60 focus-within:shadow-[0_0_18px_rgba(232,121,249,.25)] transition">
          <Lock className="h-3 w-3 text-emerald-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate(url); }}
            placeholder={`Search ${ENGINES[engine].name} or enter URL`}
            className="flex-1 bg-transparent outline-none font-mono text-white/85 placeholder:text-white/30"
          />
          <Star className="h-3 w-3 text-white/30 hover:text-amber-300 cursor-pointer" />
        </div>

        {/* Engine switcher */}
        <div className="relative">
          <button onClick={() => setEnginePickerOpen((s) => !s)}
            className={`px-2 py-1.5 rounded-full text-[10px] font-mono tracking-wider bg-gradient-to-r ${ENGINES[engine].color} text-white shadow-md flex items-center gap-1`}>
            <Globe className="h-3 w-3" /> {ENGINES[engine].name.toUpperCase()}
          </button>
          <AnimatePresence>
            {enginePickerOpen && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-44 glass-strong rounded-xl p-1.5 z-50 ring-1 ring-fuchsia-500/20">
                {(Object.keys(ENGINES) as EngineId[]).map((k) => (
                  <button key={k} onClick={() => { setEngine(k); setEnginePickerOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 hover:bg-white/10 transition ${engine === k ? "text-white" : "text-white/70"}`}>
                    <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${ENGINES[k].color}`} />
                    {ENGINES[k].name}
                    {engine === k && <span className="ml-auto text-fuchsia-300 text-[9px]">ACTIVE</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* School Mode */}
        <div className="relative">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setPresetsOpen((s) => !s)}
            className="px-2 py-1.5 rounded-full text-[10px] font-mono tracking-wider bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-600/30 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> STUDENT
          </motion.button>
          <AnimatePresence>
            {presetsOpen && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 glass-strong rounded-xl p-2 z-50 ring-1 ring-emerald-400/20">
                <div className="text-[9px] tracking-[0.3em] text-emerald-300/70 font-mono px-2 py-1">QUICK SWITCH</div>
                {SCHOOL_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/8 text-left transition">
                    <span className={`h-6 w-6 rounded-md bg-gradient-to-br ${p.color} ring-1 ring-white/10`} />
                    <span className="text-xs">{p.name}</span>
                  </button>
                ))}
                <div className="text-[9px] text-white/40 px-2 pt-1 font-mono">Instant disguise · ⌘+S</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="p-1.5 rounded hover:bg-white/5 text-fuchsia-300"><Shield className="h-3.5 w-3.5" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        {activeTab && activeTab.url.startsWith("spectre://") ? (
          <SpectreHome
            engine={ENGINES[engine]}
            onSearch={(q) => navigate(q)}
            onShortcut={(s) => navigate(s.url)}
          />
        ) : activeTab ? (
          <TabFrame tab={activeTab} onLoaded={() => setTabs((arr) => arr.map((t) => t.id === activeTab.id ? { ...t, loading: false } : t))} />
        ) : null}
      </div>
    </div>
  );
}

function hostnameOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

function TabFrame({ tab, onLoaded }: { tab: Tab; onLoaded: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    setBlocked(false);
    const t = setTimeout(() => { if (tab.loading) setBlocked(true); }, 6000);
    return () => clearTimeout(t);
  }, [tab.url, tab.loading]);

  return (
    <div className="absolute inset-0">
      <AnimatePresence>
        {tab.loading && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070410]/95 backdrop-blur">
            <div className="relative h-20 w-20">
              <motion.div className="absolute inset-0 rounded-full border-2 border-fuchsia-400/30" />
              <motion.div className="absolute inset-0 rounded-full border-t-2 border-fuchsia-400"
                animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
              <motion.div className="absolute inset-2 rounded-full border-b-2 border-cyan-400"
                animate={{ rotate: -360 }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} />
            </div>
            <div className="mt-6 text-[10px] tracking-[0.45em] font-mono text-fuchsia-300">ROUTING THROUGH GHOSTNET</div>
            <div className="mt-1 text-[10px] font-mono text-white/40 truncate max-w-md">{tab.url}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <iframe
        ref={ref}
        src={tab.url}
        title={tab.title}
        onLoad={onLoaded}
        className="w-full h-full bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      {blocked && tab.loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070410]/95 text-center px-6">
          <div className="text-xl font-bold neon-text">SIGNAL REFUSED</div>
          <div className="mt-2 text-xs text-white/60 max-w-sm">This site refuses to load inside the spectral frame. Open it in a real tab from your home browser.</div>
          <a href={tab.url} target="_blank" rel="noreferrer" className="mt-4 px-4 py-1.5 rounded-full gradient-neon text-xs font-mono">Open externally</a>
        </div>
      )}
    </div>
  );
}

function SpectreHome({ engine, onSearch, onShortcut }: { engine: typeof ENGINES[EngineId]; onSearch: (q: string) => void; onShortcut: (s: { url: string }) => void }) {
  const [q, setQ] = useState("");
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide flex flex-col items-center pt-14 px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
        <div className="text-6xl font-black neon-text tracking-widest">SPECTRE</div>
        <div className="text-[10px] tracking-[0.4em] text-white/40 font-mono mt-1">PRIVATE · QUANTUM · GHOSTOS</div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
        className="mt-8 w-full max-w-xl">
        <div className="glass rounded-full flex items-center gap-2 px-4 py-3 neon-border focus-within:shadow-[0_0_24px_rgba(232,121,249,.4)] transition">
          <Lock className="h-3.5 w-3.5 text-emerald-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch(q)}
            placeholder={`Search the spectral web with ${engine.name}…`}
            className="flex-1 bg-transparent outline-none text-sm" />
          <button onClick={() => onSearch(q)} className={`px-3 py-1 rounded-full text-[10px] font-mono bg-gradient-to-r ${engine.color}`}>GO</button>
        </div>
      </motion.div>
      <div className="mt-10 grid grid-cols-4 gap-3 w-full max-w-xl">
        {SHORTCUTS.map((s, i) => (
          <motion.button key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
            onClick={() => onShortcut(s)}
            whileHover={{ y: -3 }}
            className="glass rounded-xl py-4 text-xs font-mono hover:neon-border transition">
            {s.name}
          </motion.button>
        ))}
      </div>
      <div className="mt-10 text-[10px] tracking-[0.4em] text-white/30 font-mono">try ":ghost" in the address bar</div>
    </div>
  );
}
