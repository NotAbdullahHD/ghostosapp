import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Maximize, RotateCw, Lock, EyeOff } from "lucide-react";
import { useGhost } from "../store";

/** Ghost Browser — Brave-style private shell around the Spectre relay. */
export function BrowserApp() {
  const { windows, toggleFullscreen, settings } = useGhost();
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [shields, setShields] = useState(true);

  const browserUrl = `/spectre/index.html?engine=${settings.searchEngine}&proxy=${settings.proxyProvider}&newtab=${settings.newTab}&home=${encodeURIComponent(settings.homepage)}`;
  const me = windows.find((w) => w.appId === "browser");
  const reload = () => { setLoaded(false); setReloadKey((k) => k + 1); };

  return (
    <div className="h-full flex flex-col text-white relative overflow-hidden" style={{ background: "var(--brave-surface)" }}>
      <div className="flex h-9 shrink-0 items-center gap-2 px-3 border-b border-white/5" style={{ background: "var(--brave-bar)" }}>
        <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: "var(--brave)" }}>
          <Shield className="h-3 w-3" fill="currentColor" />
        </div>
        <span className="text-xs font-semibold">Ghost Browser</span>
        <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300"><EyeOff className="h-3 w-3" />Private</span>
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-white/45"><Lock className="h-3 w-3" />Encrypted · {settings.proxyProvider === "scramjet" ? "Scramjet" : "Ultraviolet"}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={reload} title="Reload" aria-label="Reload" className="rounded-md p-1.5 text-white/60 hover:bg-white/10"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setShields((s) => !s)} title={shields ? "Shields up" : "Shields down"} aria-label="Toggle shields"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] hover:bg-white/10" style={{ color: shields ? "var(--brave)" : "rgba(255,255,255,.4)" }}>
            <Shield className="h-3.5 w-3.5" fill={shields ? "currentColor" : "none"} />{shields ? "Shields up" : "Shields down"}
          </button>
          <button onClick={() => me && toggleFullscreen(me.id)} title="Fullscreen" aria-label="Fullscreen" className="rounded-md p-1.5 text-white/60 hover:bg-white/10"><Maximize className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence>
          {!loaded && (
            <motion.div key="boot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ background: "var(--brave-surface)" }}>
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--brave)" }}>
                <Shield className="h-7 w-7" fill="currentColor" />
              </motion.div>
              <div className="text-xs text-white/50">Starting private session…</div>
            </motion.div>
          )}
        </AnimatePresence>
        <iframe
          key={reloadKey}
          src={browserUrl}
          title="Ghost Browser"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full"
          style={{ background: "var(--brave-surface)" }}
          allow="autoplay; fullscreen; clipboard-write; encrypted-media; gamepad"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
