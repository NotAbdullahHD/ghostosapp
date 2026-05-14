import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Gamepad2, Cloud, MessageCircle, Activity, X } from "lucide-react";

export function OnlineStatus() {
  const [count, setCount] = useState(2431);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => Math.max(1500, Math.min(4200, c + Math.round((Math.random() - 0.45) * 12))));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="fixed top-12 right-3 z-[450]">
      <motion.button
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        whileHover={{ y: -2 }}
        onClick={() => setOpen((s) => !s)}
        className="glass-strong rounded-full pl-2.5 pr-3 py-1.5 ring-1 ring-emerald-400/25 flex items-center gap-2 shadow-[0_0_24px_rgba(16,185,129,.18)] hover:ring-emerald-400/60 transition"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(10,20,15,.55))" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,.9)]" />
        </span>
        <span className="font-mono text-xs text-white tracking-wider">{count.toLocaleString()}</span>
        <span className="text-[9px] font-mono tracking-[0.3em] text-emerald-300/80">ONLINE</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-72 glass-strong rounded-2xl ring-1 ring-emerald-400/20 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)]"
            style={{ background: "linear-gradient(180deg, rgba(20,25,30,.85), rgba(8,10,15,.85))" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.4em] font-mono text-emerald-300/80">SPECTRAL NETWORK</div>
                <div className="text-2xl font-black text-white">{count.toLocaleString()}<span className="text-[10px] font-mono text-white/40 tracking-widest ml-1">SOULS</span></div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>

            <div className="mt-4 space-y-2">
              <Stat icon={<Gamepad2 className="h-3 w-3 text-fuchsia-300" />} label="In arcade" value={847} accent="text-fuchsia-200" />
              <Stat icon={<Cloud className="h-3 w-3 text-violet-300" />} label="GhostCloud streams" value={312} accent="text-violet-200" />
              <Stat icon={<MessageCircle className="h-3 w-3 text-sky-300" />} label="Discord active" value={1284} accent="text-sky-200" />
              <Stat icon={<Users className="h-3 w-3 text-amber-300" />} label="Browsing" value={1102} accent="text-amber-200" />
              <div className="h-px bg-white/5 my-2" />
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-300 font-mono">
                  <Activity className="h-3 w-3" /> ALL SYSTEMS NOMINAL
                </div>
                <span className="text-white/40 font-mono">18 ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-white/65">{icon}{label}</div>
      <span className={`font-mono ${accent}`}>{value.toLocaleString()}</span>
    </div>
  );
}
