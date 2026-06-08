import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, Shield, Maximize, RotateCw } from "lucide-react";
import { useGhost } from "../store";

const BROWSER_URL = "/spectre/index.html";

export function BrowserApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const me = windows.find((w) => w.appId === "browser");
  const requestFullscreen = () => { if (me) toggleFullscreen(me.id); };
  const reload = () => { setLoaded(false); setReloadKey((k) => k + 1); };

  return (
    <div className="h-full flex flex-col bg-[#070410] text-white relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-cyan-950/60 via-black to-fuchsia-950/40 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-[0_0_18px_rgba(59,130,246,.5)]">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-black tracking-widest bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">SPECTRE BROWSER</div>
            <div className="text-[9px] tracking-[0.4em] text-white/40 font-mono">ULTRAVIOLET RELAY · GHOSTOS NATIVE</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
            SECURE TUNNEL
          </span>
          <button onClick={reload} title="Reload" className="p-1.5 rounded-full hover:bg-white/10 text-white/70"><RotateCw className="h-3.5 w-3.5" /></button>
          <button title="Shield active" className="p-1.5 rounded-full hover:bg-white/10 text-fuchsia-300"><Shield className="h-3.5 w-3.5" /></button>
          <button onClick={requestFullscreen} title="Immersive fullscreen"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-cyan-200 ring-1 ring-cyan-400/30 hover:bg-cyan-500/15 transition">
            <Maximize className="h-3 w-3" /> IMMERSE
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <AnimatePresence>
          {!loaded && (
            <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#070410]">
              <div className="relative h-20 w-20">
                <motion.div className="absolute inset-0 rounded-full border-2 border-cyan-400/30" />
                <motion.div className="absolute inset-0 rounded-full border-t-2 border-cyan-400"
                  animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
                <motion.div className="absolute inset-2 rounded-full border-b-2 border-fuchsia-400"
                  animate={{ rotate: -360 }} transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }} />
              </div>
              <div className="mt-6 text-[10px] tracking-[0.45em] font-mono text-cyan-300">BOOTING SPECTRE RELAY</div>
              <div className="mt-1 text-[9px] tracking-[0.35em] font-mono text-white/30 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> ULTRAVIOLET HANDSHAKE
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <iframe
          key={reloadKey}
          src={BROWSER_URL}
          title="Spectre Browser"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full bg-white"
          allow="autoplay; fullscreen; clipboard-write; encrypted-media; geolocation; camera; microphone; gamepad"
          referrerPolicy="no-referrer"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cyan-500/10" />
      </div>
    </div>
  );
}
