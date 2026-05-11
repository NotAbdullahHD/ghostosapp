import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { useGhost } from "./store";
import { APPS, type AppDef } from "./apps";

export function Dock() {
  const { openApp, windows } = useGhost();
  const mouseX = useMotionValue<number | null>(null);

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[600]"
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(null)}
        className="glass-strong rounded-2xl px-3 pt-2 pb-1.5 flex items-end gap-1.5 neon-border shadow-2xl shadow-black/60"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(20,10,40,.55))" }}
      >
        {APPS.map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <DockIcon key={app.id} app={app} mouseX={mouseX} isOpen={isOpen}
              onClick={() => openApp(app.id, app.name)} />
          );
        })}
      </motion.div>
      {/* reflection */}
      <div className="mx-auto mt-0.5 h-2 w-[80%] opacity-40 blur-md bg-gradient-to-b from-fuchsia-500/30 to-transparent rounded-full" />
    </motion.div>
  );
}

function DockIcon({ app, mouseX, isOpen, onClick }: { app: AppDef; mouseX: MotionValue<number | null>; isOpen: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(mouseX, (mx) => {
    if (mx === null || !ref.current) return 9999;
    const rect = ref.current.getBoundingClientRect();
    return mx - (rect.left + rect.width / 2);
  });
  const size = useTransform(distance, [-120, 0, 120], [44, 64, 44]);
  const lift = useTransform(distance, [-120, 0, 120], [0, -10, 0]);

  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title={app.name}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.4 }}
        whileTap={{ scale: 0.88 }}
        className={`relative rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-black/60 ring-1 ring-white/20`}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/15" />
        <span className="relative drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]">{app.icon}</span>
        {/* tooltip */}
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap bg-black/90 text-white/95 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-xl">
          {app.name}
        </span>
      </motion.div>
      <span className={`mt-0.5 h-1 w-1 rounded-full transition-all ${isOpen ? "bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,1)]" : "bg-transparent"}`} />
    </button>
  );
}
