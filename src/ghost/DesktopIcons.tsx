import { motion } from "framer-motion";
import { useGhost } from "./store";
import { APPS } from "./apps";

export function DesktopIcons() {
  const { openApp } = useGhost();
  return (
    <div className="absolute top-12 left-4 grid grid-cols-1 gap-3 z-10">
      {APPS.slice(0, 4).map((app, i) => (
        <motion.button
          key={app.id}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
          onDoubleClick={() => openApp(app.id, app.name)}
          onClick={() => openApp(app.id, app.name)}
          whileHover={{ scale: 1.05 }}
          className="group flex flex-col items-center gap-1 w-20 p-2 rounded-xl hover:bg-white/5 transition"
        >
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-2xl text-white shadow-lg shadow-black/40 ring-1 ring-white/15`}>
            {app.icon}
          </div>
          <span className="text-[10px] text-white/80 font-mono tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,.9)]">{app.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
