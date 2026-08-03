import { motion } from "framer-motion";
import { useGhost } from "./store";
import { APPS, type AppDef, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { LayoutGrid } from "lucide-react";

// Pinned apps — the essentials.
const PINNED: AppId[] = ["browser", "ghostcloud", "games", "movies", "music", "chat", "files", "settings"];

export function Dock() {
  const { openApp, windows, toggleLauncher, showLauncher, focusWindow, toggleMinimize } = useGhost();

  const pinned = PINNED.map((id) => APPS.find((a) => a.id === id)).filter(Boolean) as AppDef[];
  // Running apps that are not pinned appear after a divider.
  const running = windows
    .map((w) => APPS.find((a) => a.id === w.appId))
    .filter((a): a is AppDef => !!a && !PINNED.includes(a.id))
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
    >
      <div
        className="rounded-2xl px-2 py-1.5 flex items-end gap-1"
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

        {pinned.map((app) => (
          <DockApp key={app.id} app={app} open={windows.some((w) => w.appId === app.id)} onClick={() => activate(app.id, app.name)} />
        ))}

        {running.length > 0 && <Divider />}
        {running.map((app) => (
          <DockApp key={app.id} app={app} open onClick={() => activate(app.id, app.name)} />
        ))}
      </div>
    </motion.div>
  );
}

function Divider() {
  return <span className="self-stretch w-px mx-1 my-1.5 bg-white/10" />;
}

function DockApp({ app, open, onClick }: { app: AppDef; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title={app.name}>
      <span className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors duration-150 group-hover:bg-white/[0.08]">
        <AppIcon id={app.id} size={34} className="!w-[34px] !h-[34px]" />
      </span>
      <Tooltip>{app.name}</Tooltip>
      <span
        className="mt-[3px] h-[3px] rounded-full transition-all duration-200"
        style={{
          width: open ? 14 : 0,
          background: "#66d9ff",
          opacity: open ? 1 : 0,
        }}
      />
    </button>
  );
}

function DockButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title={label}>
      <span
        className="h-9 w-9 rounded-xl flex items-center justify-center transition-colors duration-150"
        style={{ background: active ? "#66d9ff" : "rgba(255,255,255,0.06)" }}
      >
        {children}
      </span>
      <Tooltip>{label}</Tooltip>
      <span className="mt-[3px] h-[3px] w-0 rounded-full" />
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
