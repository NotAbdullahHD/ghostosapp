import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function FpsMonitor() {
  const [fps, setFps] = useState(144);
  const [history, setHistory] = useState<number[]>(Array(20).fill(140));

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        const live = Math.round((frames * 1000) / (now - last));
        // Cap at "gamer" range for cinematic effect, snap to common targets
        const display = Math.min(165, Math.max(60, live + Math.round((Math.random() - 0.5) * 4)));
        setFps(display);
        setHistory((h) => [...h.slice(1), display]);
        frames = 0; last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = fps >= 120 ? "text-emerald-300" : fps >= 60 ? "text-amber-300" : "text-rose-400";
  const glow = fps >= 120 ? "rgba(52,211,153,.6)" : fps >= 60 ? "rgba(251,191,36,.6)" : "rgba(244,63,94,.6)";
  const max = Math.max(...history, 165);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="fixed bottom-3 left-3 z-[400] select-none pointer-events-auto"
    >
      <div className="glass-strong rounded-xl px-3 py-2 ring-1 ring-white/10 flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,.6)]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(10,5,20,.55))" }}>
        <Activity className={`h-3.5 w-3.5 ${color}`} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
        <div className="flex flex-col items-start leading-none">
          <div className="flex items-baseline gap-1 font-mono">
            <motion.span key={fps} initial={{ opacity: 0.6, y: -2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}
              className={`text-base font-bold ${color}`} style={{ textShadow: `0 0 10px ${glow}` }}>
              {fps}
            </motion.span>
            <span className="text-[9px] tracking-[0.3em] text-white/55">FPS</span>
          </div>
          <span className="text-[8px] tracking-[0.35em] text-white/40 font-mono mt-0.5">SPECTRAL · GPU</span>
        </div>
        <svg width="48" height="20" viewBox="0 0 48 20" className="opacity-80">
          <polyline
            points={history.map((v, i) => `${(i / (history.length - 1)) * 48},${20 - (v / max) * 18}`).join(" ")}
            fill="none" stroke="currentColor" strokeWidth="1" className={color}
            style={{ filter: `drop-shadow(0 0 3px ${glow})` }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
