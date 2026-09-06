import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppDef, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { LayoutGrid } from "lucide-react";
import { isOverDock } from "./DesktopIcons";
import { GLASS } from "./glass";

export function Dock() {
  const {
    openApp, windows, toggleLauncher, showLauncher, focusWindow, toggleMinimize,
    pinned, unpinApp, addDesktopIcon, settings,
  } = useGhost();

  const pos = settings.dockPosition;
  const vertical = pos === "left" || pos === "right";

  const pinnedApps = pinned.map((id) => APPS.find((a) => a.id === id)).filter(Boolean) as AppDef[];
  // Running apps that are not pinned appear after a divider.
  const running = windows
    .map((w) => APPS.find((a) => a.id === w.appId))
    .filter((a): a is AppDef => !!a && !pinned.includes(a.id))
    .filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i);

  const activate = (appId: AppId, name: string) => {
    const win = windows.find((w) => w.appId === appId);
    if (!win) return openApp(appId, name);
    if (win.minimized) { toggleMinimize(win.id); focusWindow(win.id); return; }
    focusWindow(win.id);
  };

  const anchor =
    pos === "left"
      ? "left-3 top-1/2 -translate-y-1/2"
      : pos === "right"
        ? "right-3 top-1/2 -translate-y-1/2"
        : "bottom-3 left-1/2 -translate-x-1/2";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed z-[600] ${anchor}`}
      data-dock
      data-no-ctx
    >
      <div
        className={`rounded-2xl flex items-center ${vertical ? "flex-col px-2 py-2.5 gap-2.5" : "px-2.5 py-2 gap-2.5"}`}
        style={GLASS}
      >
        <DockButton label="All apps" active={showLauncher} onClick={toggleLauncher}>
          <LayoutGrid className={`h-[18px] w-[18px] ${showLauncher ? "text-black" : "text-white/85"}`} strokeWidth={1.8} />
        </DockButton>

        <Divider vertical={vertical} />

        {pinnedApps.map((app) => (
          <DockApp
            key={app.id}
            app={app}
            side={pos}
            open={windows.some((w) => w.appId === app.id)}
            minimized={windows.some((w) => w.appId === app.id && w.minimized)}
            onClick={() => activate(app.id, app.name)}
            onDropOutside={(x, y) => { unpinApp(app.id); addDesktopIcon(app.id, x - 38, y - 30); }}
          />
        ))}

        {running.length > 0 && <Divider vertical={vertical} />}
        {running.map((app) => (
          <DockApp
            key={app.id}
            app={app}
            side={pos}
            open
            minimized={windows.some((w) => w.appId === app.id && w.minimized)}
            onClick={() => activate(app.id, app.name)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Divider({ vertical }: { vertical: boolean }) {
  return <span className={vertical ? "h-px w-6 my-0.5 bg-white/20" : "w-px h-6 mx-0.5 bg-white/20"} />;
}

function DockApp({
  app, open, minimized, onClick, onDropOutside, side,
}: {
  app: AppDef;
  open: boolean;
  minimized?: boolean;
  side: "left" | "bottom" | "right";
  onClick: () => void;
  onDropOutside?: (x: number, y: number) => void;
}) {
  const down = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !onDropOutside) return;
    down.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!down.current) return;
    if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 8) setDragging(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const started = down.current;
    down.current = null;
    if (dragging && started && onDropOutside && !isOverDock(e.clientX, e.clientY)) {
      setDragging(false);
      onDropOutside(e.clientX, e.clientY);
      return;
    }
    setDragging(false);
    onClick();
  };

  const lift =
    side === "left" ? { scale: 1.22, x: 5 } : side === "right" ? { scale: 1.22, x: -5 } : { scale: 1.24, y: -5 };

  const indicator =
    side === "left"
      ? { left: -6, top: "50%", translate: "0 -50%", width: 3, height: open ? (minimized ? 6 : 14) : 0 }
      : side === "right"
        ? { right: -6, top: "50%", translate: "0 -50%", width: 3, height: open ? (minimized ? 6 : 14) : 0 }
        : { bottom: -3, left: "50%", translate: "-50% 0", height: 3, width: open ? (minimized ? 6 : 14) : 0 };

  return (
    <button
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="group relative flex h-9 w-9 items-center justify-center"
      title={app.name}
      style={{ touchAction: "none" }}
    >
      <motion.span
        whileHover={lift}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="h-9 w-9 rounded-lg flex items-center justify-center"
        style={{ opacity: dragging ? 0.5 : 1 }}
      >
        <AppIcon id={app.id} size={34} className="!h-[34px] !w-[34px]" />
      </motion.span>
      <Tooltip side={side}>{app.name}</Tooltip>
      <span
        className="absolute rounded-full transition-all duration-200"
        style={{ ...indicator, background: "rgba(255,255,255,.9)", opacity: open ? (minimized ? 0.5 : 1) : 0 }}
      />
    </button>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="group relative flex h-9 w-9 items-center justify-center" title={label}>
      <motion.span
        whileHover={{ scale: 1.15 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className={`h-9 w-9 rounded-lg flex items-center justify-center ${active ? "bg-white/80" : "bg-white/[0.12]"}`}
      >
        {children}
      </motion.span>
    </button>
  );
}

function Tooltip({ children, side }: { children: React.ReactNode; side: "left" | "bottom" | "right" }) {
  const place =
    side === "left"
      ? "left-12 top-1/2 -translate-y-1/2"
      : side === "right"
        ? "right-12 top-1/2 -translate-y-1/2"
        : "-top-9 left-1/2 -translate-x-1/2";
  return (
    <span className={`absolute ${place} px-2 py-1 rounded-md text-[11px] whitespace-nowrap bg-black/60 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/15 backdrop-blur-xl`}>
      {children}
    </span>
  );
}
