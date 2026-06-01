import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Maximize, RotateCw, ArrowLeft } from "lucide-react";
import { useGhost } from "../store";

const ANIME_URL = "https://reanime.to/";

export function GhostAnimeApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [phase, setPhase] = useState<"intro" | "loading" | "live">("intro");
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const me = windows.find((w) => w.appId === "ghostanime");
  const requestFullscreen = () => { if (me) toggleFullscreen(me.id); };

  const launch = () => {
    setPhase("loading");
    setTimeout(() => setPhase("live"), 1800);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-fuchsia-950/30 to-indigo-950/40 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "linear-gradient(rgba(244,114,182,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(244,114,182,.7) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center">
              <div className="text-7xl font-black tracking-[0.15em] bg-gradient-to-r from-pink-300 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(244,114,182,.5)]">
                GHOSTANIME
              </div>
              <div className="mt-2 text-[10px] tracking-[0.5em] font-mono text-pink-300/70">CINEMATIC · 4K · UNCENSORED MIRRORS</div>
            </motion.div>
            <motion.button onClick={launch} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="mt-10 flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-indigo-500 text-white font-bold text-sm shadow-[0_0_40px_rgba(244,114,182,.5)]">
              <Sparkles className="h-4 w-4" /> Enter the Anime Realm
            </motion.button>
            <div className="mt-8 flex items-center gap-3 text-[10px] tracking-[0.3em] font-mono text-white/40">
              <span className="h-1 w-1 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,.9)]" /> POWERED BY REANIME
            </div>
          </motion.div>
        )}
        {phase === "loading" && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black">
            <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="relative">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-600 to-indigo-700 flex items-center justify-center shadow-[0_0_60px_rgba(244,114,182,.6)]">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <motion.div animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl ring-2 ring-pink-400" />
            </motion.div>
            <div className="mt-7 text-xl font-black tracking-[0.3em] bg-gradient-to-r from-pink-300 to-fuchsia-400 bg-clip-text text-transparent">SUMMONING…</div>
            <div className="mt-1 text-[10px] tracking-[0.5em] font-mono text-pink-300/60">CHANNELING SPECTRAL STREAM</div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "live" && (
        <>
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-pink-950/60 via-black to-indigo-950/60 border-b border-pink-500/15">
            <button onClick={() => { setPhase("intro"); setLoaded(false); }} className="flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white transition">
              <ArrowLeft className="h-3.5 w-3.5" /> EXIT
            </button>
            <div className="text-[10px] tracking-[0.4em] font-mono bg-gradient-to-r from-pink-300 to-fuchsia-300 bg-clip-text text-transparent">GHOSTANIME · LIVE</div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setLoaded(false); setReloadKey((k) => k + 1); }} className="p-1.5 rounded hover:bg-white/10 text-white/70"><RotateCw className="h-3.5 w-3.5" /></button>
              <button onClick={requestFullscreen} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-pink-200 ring-1 ring-pink-400/30 hover:bg-pink-500/15 transition">
                <Maximize className="h-3 w-3" /> IMMERSE
              </button>
            </div>
          </div>
          <div className="flex-1 relative bg-black">
            {!loaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
                <Loader2 className="h-7 w-7 animate-spin text-pink-300" />
                <div className="text-[10px] tracking-[0.5em] font-mono text-pink-200/80">CONNECTING…</div>
              </div>
            )}
            <iframe
              key={reloadKey}
              src={ANIME_URL}
              title="GhostAnime"
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 w-full h-full bg-black"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-pink-500/10" />
          </div>
        </>
      )}
    </div>
  );
}
