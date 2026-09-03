import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGhost, WALLPAPERS } from "./store";


export function LockScreen() {
  const { locked, setLocked, wallpaperId, wallpaper } = useGhost();
  const [now, setNow] = useState(new Date());
  const [unlocking, setUnlocking] = useState(false);

  const wp = useMemo(() => WALLPAPERS.find((w) => w.id === wallpaperId), [wallpaperId]);

  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(new Date()), 20_000);
    setNow(new Date());
    return () => clearInterval(id);
  }, [locked]);

  const unlock = () => {
    if (unlocking) return;
    setUnlocking(true);
    setTimeout(() => { setLocked(false); setUnlocking(false); }, 620);
  };

  useEffect(() => {
    if (!locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowUp") unlock();
    };
    const onWheel = (e: WheelEvent) => { if (e.deltaY < -12) unlock(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("wheel", onWheel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[9000] overflow-hidden cursor-pointer select-none"
          onClick={unlock}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => { if (info.offset.y < -80) unlock(); }}
        >
          {/* Wallpaper */}
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

          {/* Blur + darken */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ backdropFilter: unlocking ? "blur(0px)" : "blur(40px)", opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: "linear-gradient(180deg, rgba(11,11,13,.5), rgba(11,11,13,.72))" }}
          />

          {/* Content */}
          <motion.div
            className="relative h-full w-full flex flex-col items-center justify-center px-6"
            animate={{
              opacity: unlocking ? 0 : 1,
              scale: unlocking ? 1.05 : 1,
              y: unlocking ? -28 : 0,
              filter: unlocking ? "blur(10px)" : "blur(0px)",
            }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <GhostLogo size={64} />
            <motion.div
              initial={{ opacity: 0, y: 26, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-[clamp(90px,16vw,190px)] leading-[0.92] font-extralight text-white tabular-nums tracking-[-0.05em]"
            >
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 text-[19px] font-light text-white/65"
            >
              {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </motion.div>

          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
