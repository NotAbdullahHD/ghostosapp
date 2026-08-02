import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";

const LS_POS = "ghost.iconPositions.v1";
type Pos = { x: number; y: number };

export function DesktopIcons() {
  const { openApp } = useGhost();
  const desktopApps = APPS.slice(0, 7);
  const [positions, setPositions] = useState<Record<string, Pos>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(LS_POS) || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LS_POS, JSON.stringify(positions));
  }, [positions]);

  const defaultPos = (i: number): Pos => ({ x: 16, y: 56 + i * 88 });

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
            initial={{ opacity: 0, scale: 0.94, x: pos.x, y: pos.y }}
            animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
            transition={{ delay: 0.35 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onDragEnd={(_, info) => {
              const nx = Math.max(0, Math.min(window.innerWidth - 96, pos.x + info.offset.x));
              const ny = Math.max(40, Math.min(window.innerHeight - 120, pos.y + info.offset.y));
              setPositions((p) => ({ ...p, [app.id]: { x: nx, y: ny } }));
            }}
            onDoubleClick={() => openApp(app.id, app.name)}
            onClick={() => openApp(app.id, app.name)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            whileDrag={{ scale: 1.08, zIndex: 60 }}
            className="group absolute flex flex-col items-center gap-1.5 w-20 p-2 rounded-xl hover:bg-white/[0.06] transition-colors pointer-events-auto cursor-grab active:cursor-grabbing"
            style={{ left: 0, top: 0 }}
          >
            <AppIcon id={app.id} size={48} />
            <span className="text-[11px] text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,.9)] truncate w-full text-center">
              {app.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
