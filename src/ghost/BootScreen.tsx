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

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 3800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 450);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #14081f 0%, #050308 70%)" }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Scan line */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent animate-scan" />
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.6) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
        <GhostLogo size={120} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
        className="mt-8 text-5xl font-bold tracking-[0.3em] neon-text animate-flicker"
      >
        GHOSTOS
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.8 }}
        className="mt-2 text-xs tracking-[0.5em] text-fuchsia-200/60 font-mono">
        v3.1.4 · SPECTRAL CORE
      </motion.p>

      <div className="mt-16 w-80">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/5">
          <motion.div className="h-full gradient-neon" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] tracking-widest text-fuchsia-200/50">
          <AnimatePresence mode="wait">
            <motion.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
              {STEPS[step]}
            </motion.span>
          </AnimatePresence>
          <span>{Math.floor(progress * 100).toString().padStart(2, "0")}%</span>
        </div>
      </div>
    </motion.div>
  );
}
