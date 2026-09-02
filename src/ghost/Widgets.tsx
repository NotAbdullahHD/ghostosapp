import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";

const QUICK = ["browser", "files", "notes", "terminal", "settings"] as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      data-no-ctx
      className="pointer-events-auto w-44 rounded-lg border border-white/10 bg-[#141416]/75 p-2.5"
      style={{ backdropFilter: "blur(16px)" }}
    >
      <div className="mb-1.5 text-[9px] uppercase tracking-wider text-white/35">{title}</div>
      {children}
    </div>
  );
}

export function Widgets() {
  const { widgets, hasFullscreen, locked, openApp, windows, notifications } = useGhost();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (hasFullscreen || locked) return null;
  if (!widgets.quick && !widgets.status) return null;

  return (
    <div className="pointer-events-none fixed right-2 top-2 z-[500] flex flex-col gap-2">
      {widgets.quick && (
        <Card title="Quick Access">
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((id) => {
              const app = APPS.find((a) => a.id === id);
              if (!app) return null;
              return (
                <button key={id} title={app.name} onClick={() => openApp(app.id, app.name)} className="rounded-md p-0.5 hover:bg-white/10">
                  <AppIcon id={app.id} size={26} />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {widgets.status && (
        <Card title="System Status">
          <div className="space-y-0.5 text-[10px] text-white/70">
            <Row label="Time" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
            <Row label="Open" value={String(windows.filter((w) => !w.minimized).length)} />
            <Row label="Alerts" value={String(notifications.filter((n) => !n.read).length)} />
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
