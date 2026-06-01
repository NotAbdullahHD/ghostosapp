import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { APPS } from "./apps";

const LS_POS = "ghost.iconPositions.v1";
type Pos = { x: number; y: number };

export function DesktopIcons() {
  const { openApp } = useGhost();
  const desktopApps = APPS.slice(0, 7);
  const [positions, setPositions] = useState<Record<string, Pos>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_POS) || "{}"); } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem(LS_POS, JSON.stringify(positions)); }, [positions]);

  const defaultPos = (i: number): Pos => ({ x: 12, y: 48 + i * 84 });

  return (
    <div className="absolute inset-0 pointer-events-none z-10" data-no-ctx>
      {desktopApps.map((app, i) => {
        const pos = positions[app.id] || defaultPos(i);
        return (
          <motion.button
            key={app.id}
            drag
            dragMomentum={false}
            dragElastic={0.05}
            initial={{ opacity: 0, scale: 0.9, x: pos.x, y: pos.y }}
            animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
            transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onDragEnd={(_, info) => {
              const nx = Math.max(0, Math.min(window.innerWidth - 96, pos.x + info.offset.x));
              const ny = Math.max(32, Math.min(window.innerHeight - 110, pos.y + info.offset.y));
              setPositions((p) => ({ ...p, [app.id]: { x: nx, y: ny } }));
            }}
            onDoubleClick={() => openApp(app.id, app.name)}
            onClick={() => openApp(app.id, app.name)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            whileDrag={{ scale: 1.1, zIndex: 60 }}
            className="group absolute flex flex-col items-center gap-1 w-20 p-2 rounded-xl hover:bg-white/5 hover:backdrop-blur-md transition-all pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{ left: 0, top: 0 }}
          >
            <div className={`relative h-12 w-12 rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-2xl text-white shadow-lg shadow-black/50 ring-1 ring-white/20`}>
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/10" />
              <span className="relative drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">{app.icon}</span>
              <span className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 ring-2 ring-fuchsia-400/40 transition" />
            </div>
            <span className="text-[10px] text-white/85 font-mono tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,.95)]">{app.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
