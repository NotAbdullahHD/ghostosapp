import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { Lock, Fingerprint } from "lucide-react";

export function LockScreen() {
  const { locked, setLocked } = useGhost();
  const [now, setNow] = useState(new Date());
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const unlock = () => {
    setUnlocking(true);
    setTimeout(() => { setLocked(false); setUnlocking(false); }, 700);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (locked && (e.key === "Enter" || e.key === " ")) unlock(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9000] flex flex-col items-center justify-center"
          style={{ background: "radial-gradient(ellipse at center, #0a0612 0%, #000 80%)", backdropFilter: "blur(40px)" }}
        >
          <motion.div animate={{ opacity: unlocking ? 0 : 1, scale: unlocking ? 1.05 : 1 }} transition={{ duration: 0.6 }} className="flex flex-col items-center">
            <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300/70 mb-3">SPECTRAL · LOCKED</div>
            <div className="text-7xl font-black text-white font-mono tracking-tight tabular-nums drop-shadow-[0_0_30px_rgba(232,121,249,.4)]">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-sm font-mono text-white/50 mt-2">{now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>

            <motion.button
              onClick={unlock}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="mt-12 group flex flex-col items-center gap-3"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center shadow-[0_0_60px_rgba(232,121,249,.5)] ring-2 ring-fuchsia-300/30">
                <Fingerprint className="h-10 w-10 text-white" />
              </div>
              <div className="text-[10px] tracking-[0.4em] font-mono text-fuchsia-200/80 group-hover:text-white transition flex items-center gap-1.5">
                <Lock className="h-3 w-3" /> TAP · ENTER · SPACE
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
