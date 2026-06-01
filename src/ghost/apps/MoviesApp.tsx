import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Info, Search, Maximize2, X, Loader2, ArrowLeft, RotateCw, Shield } from "lucide-react";
import { proxify } from "../proxy";

// Switched to flixvo.live as the GhostFlix source.
const SOURCE = "https://flixvo.live/";

const FEATURED = {
  title: "SPECTRAL",
  tag: "GHOSTFLIX ORIGINAL",
  blurb: "A renegade AI awakens in a forgotten datacenter, drawn to the last living signal on Earth.",
};

const ROWS = [
  { label: "Trending Now", items: ["Spectral", "Midnight Code", "Neon Vows", "Last Signal", "Echo Protocol", "Quiet Star", "Voidwalker", "Crimson Halo"] },
  { label: "Continue Watching", items: ["Halo Drift", "Ghost Protocol", "Black Mirror", "Cyber Bloom", "Nightcrawl", "Phantom Bay"] },
  { label: "Cyberpunk & Neo-Noir", items: ["Neon City", "Wired", "Replicant", "Static", "Datastream", "Signal Lost"] },
  { label: "GhostFlix Originals", items: ["Spectral", "Hollow Net", "Echo Protocol", "Quiet Star", "Voidwalker"] },
];

const COLORS = [
  "from-purple-700 to-indigo-950",
  "from-red-700 to-black",
  "from-pink-600 to-rose-950",
  "from-blue-700 to-slate-950",
  "from-orange-600 to-red-950",
  "from-teal-600 to-emerald-950",
  "from-fuchsia-700 to-purple-950",
  "from-amber-600 to-rose-950",
];

export function MoviesApp() {
  const [launched, setLaunched] = useState(false);
  const [phase, setPhase] = useState<"idle" | "boot" | "live">("idle");

  const launch = () => {
    setLaunched(true);
    setPhase("boot");
    setTimeout(() => setPhase("live"), 1800);
  };

  if (launched) return <GhostFlixPlayer phase={phase} onExit={() => { setLaunched(false); setPhase("idle"); }} />;

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-black text-white relative">
      {/* GhostFlix banner */}
      <div className="relative h-80">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,80,80,.45),transparent_55%)]" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "linear-gradient(rgba(255,80,80,.4) 1px, transparent 1px)", backgroundSize: "100% 4px" }}
          animate={{ backgroundPositionY: ["0px", "200px"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-4 left-6 flex items-center gap-3">
          <div className="text-2xl font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent">GHOSTFLIX</div>
          <span className="text-[9px] tracking-[0.4em] font-mono text-white/40">// NET22 STREAM CORE</span>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-full glass text-xs flex items-center gap-1.5"><Search className="h-3 w-3" /> Search</button>
        </div>

        <div className="absolute bottom-6 left-6 max-w-lg">
          <span className="text-[10px] tracking-[0.3em] text-red-400 font-mono">{FEATURED.tag}</span>
          <h1 className="text-6xl font-black mt-2 leading-none drop-shadow-[0_0_20px_rgba(220,38,38,.4)]">{FEATURED.title}</h1>
          <p className="text-sm text-white/70 mt-3">{FEATURED.blurb}</p>
          <div className="flex items-center gap-2 mt-5">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} onClick={launch}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-white text-black font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,.3)]">
              <Play className="h-4 w-4 fill-black" /> Watch on GhostFlix
            </motion.button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-white text-sm">
              <Plus className="h-4 w-4" /> My List
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-white text-sm">
              <Info className="h-4 w-4" /> Info
            </button>
          </div>
        </div>
      </div>

      {ROWS.map((row, ri) => (
        <div key={ri} className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/85 tracking-wider">{row.label}</h2>
            <span className="text-[10px] font-mono text-white/30 tracking-widest">EXPLORE →</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {row.items.map((title, i) => (
              <motion.button key={title + i} whileHover={{ scale: 1.08, y: -4, zIndex: 10 }} transition={{ duration: 0.2 }}
                onClick={launch}
                className="relative shrink-0 w-44 aspect-[2/3] rounded-lg overflow-hidden cursor-pointer ring-1 ring-white/10 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${COLORS[i % COLORS.length]}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <div className="text-xs font-bold tracking-wide">{title}</div>
                  <div className="text-[10px] text-white/50 font-mono">2025 · 4K HDR</div>
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/50">
                  <Play className="h-8 w-8 fill-white" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      <div className="px-6 py-8 text-center">
        <div className="text-[10px] tracking-[0.4em] text-white/30 font-mono">GHOSTFLIX · ENCRYPTED STREAM · NET22 RELAY</div>
      </div>
    </div>
  );
}

function GhostFlixPlayer({ phase, onExit }: { phase: "idle" | "boot" | "live"; onExit: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-[9999]" : "h-full"} bg-black text-white flex flex-col`}>
      {/* GhostFlix chrome */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-950/60 via-black to-purple-950/60 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button onClick={onExit} className="p-1.5 rounded hover:bg-white/10 text-white/70"><ArrowLeft className="h-3.5 w-3.5" /></button>
          <div className="text-sm font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent">GHOSTFLIX</div>
          <span className="text-[9px] font-mono text-white/40 tracking-widest">LIVE STREAM</span>
          <span className="ml-2 flex items-center gap-1 text-[10px] text-emerald-300 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,.9)]" /> SECURE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setReloadKey((k) => k + 1)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setFullscreen((f) => !f)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><Maximize2 className="h-3.5 w-3.5" /></button>
          <button onClick={onExit} className="p-1.5 rounded hover:bg-red-500/20 text-red-300"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <AnimatePresence>
          {phase === "boot" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(220,38,38,.6)]">
                GHOSTFLIX
              </motion.div>
              <motion.div className="mt-8 h-0.5 w-64 bg-white/10 overflow-hidden rounded-full">
                <motion.div className="h-full bg-gradient-to-r from-red-500 to-rose-300"
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: "easeInOut" }} />
              </motion.div>
              <div className="mt-3 text-[10px] tracking-[0.45em] font-mono text-white/40 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> ROUTING THROUGH NET22 RELAY
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={reloadKey}
          ref={ref}
          src={proxify(SOURCE)}
          title="GhostFlix"
          className="absolute inset-0 w-full h-full bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
        />

        {/* ambient glow overlay */}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-red-500/10" />
      </div>
    </div>
  );
}
