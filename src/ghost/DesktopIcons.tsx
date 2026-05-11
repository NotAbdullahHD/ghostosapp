import { motion } from "framer-motion";
import { useGhost } from "./store";
import { APPS } from "./apps";

export function DesktopIcons() {
  const { openApp } = useGhost();
  // Show 6 main apps on desktop in a tidy grid
  const desktopApps = APPS.slice(0, 6);
  return (
    <div className="absolute top-12 left-3 grid grid-cols-1 gap-1 z-10">
      {desktopApps.map((app, i) => (
        <motion.button
          key={app.id}
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onDoubleClick={() => openApp(app.id, app.name)}
          onClick={() => openApp(app.id, app.name)}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="group flex flex-col items-center gap-1 w-20 p-2 rounded-xl hover:bg-white/5 hover:backdrop-blur-md transition-all"
        >
          <div className={`relative h-12 w-12 rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-2xl text-white shadow-lg shadow-black/50 ring-1 ring-white/20`}>
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/10" />
            <span className="relative drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">{app.icon}</span>
            <span className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 ring-2 ring-fuchsia-400/40 transition" />
          </div>
          <span className="text-[10px] text-white/85 font-mono tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,.95)]">{app.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
