import { motion } from "framer-motion";
import { useGhost } from "./store";
import { APPS } from "./apps";

export function Dock() {
  const { openApp, windows } = useGhost();
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[600]"
    >
      <div className="glass-strong rounded-2xl px-3 py-2 flex items-end gap-2 neon-border">
        {APPS.map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <motion.button
              key={app.id}
              onClick={() => openApp(app.id, app.name)}
              whileHover={{ y: -10, scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="group relative"
              title={app.name}
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-black/50 ring-1 ring-white/20`}>
                {app.icon}
              </div>
              {isOpen && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-fuchsia-300 shadow-[0_0_6px_rgba(232,121,249,1)]" />}
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap bg-black/80 text-white/90 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10">
                {app.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
