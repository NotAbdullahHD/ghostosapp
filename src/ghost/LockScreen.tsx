import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGhost, WALLPAPERS } from "./store";
import { ChevronUp } from "lucide-react";

export function LockScreen() {
  const { locked, setLocked, wallpaperId, wallpaper } = useGhost();
  const [now, setNow] = useState(new Date());
  const [unlocking, setUnlocking] = useState(false);

  const wp = useMemo(() => WALLPAPERS.find((w) => w.id === wallpaperId), [wallpaperId]);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    setNow(new Date());
    return () => clearInterval(id);
  }, [locked]);

  const unlock = () => {
    if (unlocking) return;
    setUnlocking(true);
    setTimeout(() => { setLocked(false); setUnlocking(false); }, 650);
  };

  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") unlock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9000] overflow-hidden cursor-pointer select-none"
          onClick={unlock}
        >
          {/* Wallpaper background */}
          <div className="absolute inset-0" style={{ background: wallpaper }} />
          {wp?.video && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={wp.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          )}
          {/* Blur + darken layer */}
          <motion.div
            className="absolute inset-0"
            initial={{ backdropFilter: "blur(0px)", opacity: 0 }}
            animate={{
              backdropFilter: unlocking ? "blur(0px)" : "blur(36px)",
              opacity: 1,
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              WebkitBackdropFilter: unlocking ? "blur(0px)" : "blur(36px)",
              background: "linear-gradient(180deg, rgba(0,0,0,.35), rgba(0,0,0,.55))",
            }}
          />

          {/* Ambient gradient sheen */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(168,85,247,.22), transparent 65%)" }}
            animate={{ opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent animate-scan" />

          {/* Content */}
          <motion.div
            className="relative h-full w-full flex flex-col items-center justify-center px-6"
            animate={{
              opacity: unlocking ? 0 : 1,
              scale: unlocking ? 1.04 : 1,
              y: unlocking ? -24 : 0,
              filter: unlocking ? "blur(8px)" : "blur(0px)",
            }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] tracking-[0.5em] font-mono text-fuchsia-200/70 mb-3"
            >
              GHOSTOS · READY
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="text-[110px] leading-none font-black text-white font-mono tabular-nums tracking-[-0.04em] drop-shadow-[0_0_40px_rgba(232,121,249,.35)]"
            >
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-lg font-mono text-white/75"
            >
              {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </motion.div>

            {/* Swipe / click hint */}
            <motion.div
              className="absolute bottom-16 flex flex-col items-center gap-2"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronUp className="h-6 w-6 text-white/70" strokeWidth={2.5} />
              <div className="text-[10px] tracking-[0.45em] font-mono text-white/60 uppercase">
                Swipe up · click anywhere
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
