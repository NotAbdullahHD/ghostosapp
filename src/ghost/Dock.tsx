import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppDef, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { LayoutGrid } from "lucide-react";
import { isOverDock } from "./DesktopIcons";

export function Dock() {
  const {
    openApp, windows, toggleLauncher, showLauncher, focusWindow, toggleMinimize,
    pinned, unpinApp, addDesktopIcon, settings,
  } = useGhost();

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

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed bottom-3 z-[600] ${settings.dockPosition === "left" ? "left-3" : "left-1/2 -translate-x-1/2"}`}
      data-dock
      data-no-ctx
    >
      <div
        className="rounded-lg px-2.5 py-2 flex items-center gap-2"
        style={{
          background: "rgba(18,18,20,0.38)",
          backdropFilter: "blur(22px) saturate(135%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 36px -22px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.07)",
        }}
      >
        <DockButton label="All apps" active={showLauncher} onClick={toggleLauncher}>
          <LayoutGrid className={`h-[18px] w-[18px] ${showLauncher ? "text-primary-foreground" : "text-ice"}`} strokeWidth={1.8} />
        </DockButton>

        <Divider />

        {pinnedApps.map((app) => (
          <DockApp
            key={app.id}
            app={app}
            open={windows.some((w) => w.appId === app.id)}
            minimized={windows.some((w) => w.appId === app.id && w.minimized)}
            onClick={() => activate(app.id, app.name)}
            onDropOutside={(x, y) => { unpinApp(app.id); addDesktopIcon(app.id, x - 38, y - 30); }}
          />
        ))}

        {running.length > 0 && <Divider />}
        {running.map((app) => (
          <DockApp
            key={app.id}
            app={app}
            open
            minimized={windows.some((w) => w.appId === app.id && w.minimized)}
            onClick={() => activate(app.id, app.name)}
          />
        ))}
      </div>
    </motion.div>
  );
}

function Divider() {
  return <span className="w-px h-6 mx-0.5 bg-white/10" />;
}

function DockApp({
  app, open, minimized, onClick, onDropOutside,
}: {
  app: AppDef;
  open: boolean;
  minimized?: boolean;
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
        whileHover={{ scale: 1.24, y: -5 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="h-9 w-9 rounded-lg flex items-center justify-center"
        style={{ opacity: dragging ? 0.5 : 1 }}
      >
        <AppIcon id={app.id} size={34} className="!h-[34px] !w-[34px]" />
      </motion.span>
      <Tooltip>{app.name}</Tooltip>
      <span
        className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200"
        style={{
          width: open ? (minimized ? 6 : 14) : 0,
          background: "var(--ice)",
          opacity: open ? (minimized ? 0.55 : 1) : 0,
        }}
      />
    </button>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="group relative flex h-9 w-9 items-center justify-center" title={label}>
      <motion.span
        whileHover={{ scale: 1.15, y: -3 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className={`h-9 w-9 rounded-lg flex items-center justify-center ${active ? "bg-ice" : "bg-white/[0.06]"}`}
      >
        {children}
      </motion.span>
      <Tooltip>{label}</Tooltip>
    </button>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[11px] whitespace-nowrap bg-surface/95 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/10">
      {children}
    </span>
  );
}
