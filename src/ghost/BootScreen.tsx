import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostLogo } from "./GhostLogo";

const STEPS = [
  "Initializing Core Systems",
  "Loading Desktop Environment",
  "Loading Games Hub",
  "Connecting Ghost Network",
  "Optimizing Performance",
];

// Total sequence ≈ 3.6s
const STEP_MS = 620;
const TAIL_MS = 500;
const TOTAL_MS = STEPS.length * STEP_MS + TAIL_MS;

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / TOTAL_MS);
      setProgress(p);
      const idx = Math.min(STEPS.length - 1, Math.floor((t - start) / STEP_MS));
      setStep(idx);
      setDone((arr) => {
        if (arr[idx]) return arr;
        const next = arr.slice();
        for (let i = 0; i < idx; i++) next[i] = true;
        return next;
      });
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setDone(() => STEPS.map(() => true));
        setTimeout(onDone, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #0a0410 0%, #000 75%)" }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* subtle vignette pulse */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 55% 40% at 50% 50%, rgba(168,85,247,.18), transparent 65%)" }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <GhostLogo size={104} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.55em", y: 6 }}
          animate={{ opacity: 1, letterSpacing: "0.32em", y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 text-4xl font-bold tracking-[0.32em] neon-text"
        >
          GHOSTOS
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.75, duration: 0.6 }}
          className="mt-2 text-[10px] tracking-[0.5em] text-fuchsia-200/60 font-mono"
        >
          SPECTRAL · v3.4
        </motion.div>

        {/* thin progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 240 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-10 h-[2px] rounded-full bg-white/8 overflow-hidden"
        >
          <motion.div
            className="h-full"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, rgba(232,121,249,0), #e879f9 50%, rgba(232,121,249,0))",
              boxShadow: "0 0 12px rgba(232,121,249,.7)",
            }}
          />
        </motion.div>

        {/* single active status line */}
        <div className="mt-6 h-4 font-mono text-[11px] tracking-[0.24em] text-fuchsia-100/80 uppercase">
          <AnimatePresence mode="wait">
            <motion.span
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28 }}
            >
              {STEPS[step]}
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                className="ml-1"
              >
                …
              </motion.span>
            </motion.span>
          </AnimatePresence>
        </div>

        {/* checklist */}
        <div className="mt-5 flex flex-col gap-1.5 font-mono text-[10px] tracking-widest text-white/40 min-w-[240px]">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  done[i] ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" : i === step ? "bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,.9)]" : "bg-white/15"
                }`}
              />
              <span className={done[i] ? "text-white/70" : i === step ? "text-fuchsia-200/90" : ""}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
