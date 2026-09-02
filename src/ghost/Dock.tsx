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
    pinned, unpinApp, addDesktopIcon,
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
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[600]"
      data-dock
      data-no-ctx
    >
      <div
        className="rounded-2xl px-2 py-1.5 flex items-center gap-1.5"
        style={{
          background: "rgba(20,20,22,0.62)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 44px -22px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.06)",
        }}
      >
        <DockButton label="All apps" active={showLauncher} onClick={toggleLauncher}>
          <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.8} style={{ color: showLauncher ? "#0b0b0d" : "#66d9ff" }} />
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
      className="group relative flex h-8 w-8 items-center justify-center"
      title={app.name}
      style={{ touchAction: "none" }}
    >
      <motion.span
        whileHover={{ scale: 1.18, y: -4 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="h-8 w-8 rounded-xl flex items-center justify-center"
        style={{ opacity: dragging ? 0.5 : 1 }}
      >
        <AppIcon id={app.id} size={30} className="!w-[30px] !h-[30px]" />
      </motion.span>
      <Tooltip>{app.name}</Tooltip>
      <span
        className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200"
        style={{
          width: open ? (minimized ? 6 : 14) : 0,
          background: "#66d9ff",
          opacity: open ? (minimized ? 0.55 : 1) : 0,
        }}
      />
    </button>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="group relative flex h-8 w-8 items-center justify-center" title={label}>
      <motion.span
        whileHover={{ scale: 1.15, y: -3 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="h-8 w-8 rounded-xl flex items-center justify-center"
        style={{ background: active ? "#66d9ff" : "rgba(255,255,255,0.06)" }}
      >
        {children}
      </motion.span>
      <Tooltip>{label}</Tooltip>
    </button>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[11px] whitespace-nowrap bg-[#141416]/95 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/10">
      {children}
    </span>
  );
}
