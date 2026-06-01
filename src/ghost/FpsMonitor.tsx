import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export function FpsMonitor() {
  const [fps, setFps] = useState(144);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        const live = Math.round((frames * 1000) / (now - last));
        const display = Math.min(165, Math.max(30, live));
        setFps(display);
        frames = 0; last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const color = fps >= 120 ? "text-emerald-300" : fps >= 60 ? "text-amber-300" : "text-rose-400";
  const glow = fps >= 120 ? "rgba(52,211,153,.55)" : fps >= 60 ? "rgba(251,191,36,.55)" : "rgba(244,63,94,.55)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="fixed bottom-3 left-3 z-[400] select-none pointer-events-auto"
    >
      <div className="glass-strong rounded-md px-2 py-1 ring-1 ring-white/10 flex items-center gap-1.5 shadow-[0_4px_18px_rgba(0,0,0,.5)]"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(10,5,20,.5))" }}>
        <Activity className={`h-2.5 w-2.5 ${color}`} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
        <motion.span key={fps} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
          className={`text-[10px] font-mono font-bold ${color}`} style={{ textShadow: `0 0 6px ${glow}` }}>
          {fps}
        </motion.span>
        <span className="text-[8px] tracking-[0.25em] text-white/45 font-mono">FPS</span>
      </div>
    </motion.div>
  );
}
