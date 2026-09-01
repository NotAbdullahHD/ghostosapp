import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { useMusic, fmtTime } from "./music";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

const QUICK = ["browser", "files", "notes", "terminal", "settings"] as const;

const UPDATES = [
  { v: "3.5.0", note: "Desktop icons can be dragged and rearranged." },
  { v: "3.5.0", note: "Dock pins update when apps move to or from the desktop." },
  { v: "3.5.0", note: "Wallpapers can be changed from the desktop menu." },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      data-no-ctx
      className="pointer-events-auto w-56 rounded-xl border border-white/10 bg-[#141416]/80 p-3"
      style={{ backdropFilter: "blur(18px)" }}
    >
      <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">{title}</div>
      {children}
    </div>
  );
}

export function Widgets() {
  const { widgets, hasFullscreen, locked, openApp, windows, notifications } = useGhost();
  const { track, playing, position, duration, toggle, next, prev } = useMusic();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (hasFullscreen || locked) return null;
  const any = widgets.quick || widgets.status || widgets.nowplaying || widgets.updates;
  if (!any) return null;

  const total = duration || track?.duration || 0;
  const progress = total ? Math.min(100, (position / total) * 100) : 0;

  return (
    <div className="pointer-events-none fixed right-2 top-2 z-[500] flex flex-col gap-2">
      {widgets.quick && (
        <Card title="Quick Access">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((id) => {
              const app = APPS.find((a) => a.id === id);
              if (!app) return null;
              return (
                <button key={id} title={app.name} onClick={() => openApp(app.id, app.name)} className="rounded-lg p-1 hover:bg-white/10">
                  <AppIcon id={app.id} size={30} />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {widgets.status && (
        <Card title="System Status">
          <div className="space-y-1 text-[11px] text-white/70">
            <Row label="Time" value={now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
            <Row label="Open apps" value={String(windows.filter((w) => !w.minimized).length)} />
            <Row label="Minimized" value={String(windows.filter((w) => w.minimized).length)} />
            <Row label="Notifications" value={String(notifications.filter((n) => !n.read).length)} />
          </div>
        </Card>
      )}

      {widgets.nowplaying && (
        <Card title="Now Playing">
          {track ? (
            <div className="space-y-2">
              <div className="truncate text-xs text-white/85">{track.title}</div>
              <div className="truncate text-[10px] text-white/45">{track.artist}</div>
              <div className="h-1 w-full overflow-hidden rounded bg-white/10">
                <div className="h-full bg-[#66d9ff]" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/40">
                <span>{fmtTime(position)}</span>
                <span>{fmtTime(total)}</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <button onClick={prev} className="rounded p-1 hover:bg-white/10"><SkipBack className="h-3.5 w-3.5" /></button>
                <button onClick={toggle} className="rounded p-1 hover:bg-white/10">
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={next} className="rounded p-1 hover:bg-white/10"><SkipForward className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => openApp("music", "Ghost Music")} className="text-[11px] text-white/50 hover:text-white">
              Nothing playing — open Ghost Music
            </button>
          )}
        </Card>
      )}

      {widgets.updates && (
        <Card title="Updates">
          <ul className="space-y-1.5 text-[11px] text-white/65">
            {UPDATES.map((u, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-white/35">{u.v}</span>
                <span className="min-w-0">{u.note}</span>
              </li>
            ))}
          </ul>
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
