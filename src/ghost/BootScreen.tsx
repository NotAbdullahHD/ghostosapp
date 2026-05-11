import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostLogo } from "./GhostLogo";

const STEPS = [
  "Initializing kernel…",
  "Loading neural drivers…",
  "Mounting encrypted vault…",
  "Calibrating spectral interface…",
  "Establishing quantum link…",
  "Waking GhostAI…",
  "System ready.",
];

const TERMINAL = [
  "[ ok ]  spectral-core    online",
  "[ ok ]  quantum-bridge   handshake complete",
  "[ ok ]  neural-mesh      4096 nodes synced",
  "[ ok ]  vault.fs         decrypted",
  "[ ok ]  ghostai.daemon   awakening",
  "[ ok ]  arcade.engine    primed",
  "[ ok ]  desktop.shell    ready",
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [termLines, setTermLines] = useState<string[]>([]);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 4000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 500);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i >= TERMINAL.length) { clearInterval(id); return; }
      setTermLines((l) => [...l, TERMINAL[i]]);
      i++;
    }, 380);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #14081f 0%, #050308 70%)" }}
      exit={{ opacity: 0, scale: 1.06, filter: "blur(24px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* scan + grid */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent animate-scan" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.6) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      {/* radial pulse */}
      <motion.div className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(168,85,247,.25), transparent 60%)" }}
        animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative flex flex-col items-center">
        <motion.div initial={{ scale: 0.5, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}>
          <GhostLogo size={120} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.6em" }} animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-8 text-5xl font-bold tracking-[0.3em] neon-text animate-flicker"
        >
          GHOSTOS
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.9 }}
          className="mt-2 text-xs tracking-[0.5em] text-fuchsia-200/60 font-mono">
          v3.1.4 · SPECTRAL CORE
        </motion.p>

        <div className="mt-12 w-96">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-fuchsia-500/20">
            <motion.div className="h-full gradient-neon shadow-[0_0_12px_rgba(232,121,249,.8)]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-3 flex justify-between font-mono text-[10px] tracking-widest text-fuchsia-200/60">
            <AnimatePresence mode="wait">
              <motion.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                {STEPS[step]}
              </motion.span>
            </AnimatePresence>
            <span>{Math.floor(progress * 100).toString().padStart(2, "0")}%</span>
          </div>

          {/* terminal log */}
          <div className="mt-6 h-32 rounded-md bg-black/40 ring-1 ring-fuchsia-500/15 p-3 font-mono text-[10px] text-emerald-300/80 overflow-hidden">
            {termLines.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                <span className="text-fuchsia-300/70">›</span> {l}
              </motion.div>
            ))}
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="text-fuchsia-300">▌</motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
