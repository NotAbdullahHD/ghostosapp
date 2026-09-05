import { Activity, CheckCircle2 } from "lucide-react";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";
import { useGhost } from "./store";

export function DesktopStatus() {
  const { windows, hasFullscreen, locked } = useGhost();
  const activeWindow = [...windows]
    .filter((win) => !win.minimized)
    .sort((a, b) => b.z - a.z)[0];
  const activeApp = activeWindow ? APPS.find((app) => app.id === activeWindow.appId) : undefined;

  if (hasFullscreen || locked) return null;

  return (
    <div className="pointer-events-none fixed left-5 top-5 z-[90] w-[230px] space-y-2 select-none">
      <section className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase text-white/45">
          <CheckCircle2 className="h-3.5 w-3.5 text-ice" /> System
        </div>
        <div className="mt-1 text-sm font-semibold text-white/90">System ready</div>
        <div className="mt-0.5 text-[10px] text-white/50">Everything is running locally.</div>
      </section>

      <section className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase text-white/45">
          <Activity className="h-3.5 w-3.5 text-ice" /> Active app
        </div>
        <div className="mt-2 flex min-h-9 items-center gap-2.5">
          {activeApp ? (
            <>
              <AppIcon id={activeApp.id} size={34} />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white/90">{activeApp.name}</div>
                <div className="truncate text-[10px] text-white/45">{activeApp.description}</div>
              </div>
            </>
          ) : (
            <div className="text-xs text-white/55">Desktop</div>
          )}
        </div>
      </section>
    </div>
  );
}