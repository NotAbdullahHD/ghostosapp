import { Activity, CheckCircle2 } from "lucide-react";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";
import { useGhost } from "./store";
import { GLASS } from "./glass";

/** Small glass widgets on the desktop — hidden as soon as an app window is open. */
export function DesktopStatus() {
  const { windows, hasFullscreen, locked } = useGhost();
  const openWindows = windows.filter((win) => !win.minimized);
  const activeWindow = [...openWindows].sort((a, b) => b.z - a.z)[0];
  const activeApp = activeWindow ? APPS.find((app) => app.id === activeWindow.appId) : undefined;

  if (hasFullscreen || locked || openWindows.length > 0) return null;

  return (
    <div className="pointer-events-none fixed left-5 top-16 z-[10] w-[220px] space-y-2 select-none">
      <section className="rounded-xl px-3 py-2.5" style={GLASS}>
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-white/60">
          <CheckCircle2 className="h-3.5 w-3.5" /> System
        </div>
        <div className="mt-1 text-sm font-semibold text-white">System ready</div>
        <div className="mt-0.5 text-[10px] text-white/60">Everything is running locally.</div>
      </section>

      <section className="rounded-xl px-3 py-2.5" style={GLASS}>
        <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider text-white/60">
          <Activity className="h-3.5 w-3.5" /> Active app
        </div>
        <div className="mt-2 flex min-h-9 items-center gap-2.5">
          {activeApp ? (
            <>
              <AppIcon id={activeApp.id} size={34} />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">{activeApp.name}</div>
                <div className="truncate text-[10px] text-white/60">{activeApp.description}</div>
              </div>
            </>
          ) : (
            <div className="text-xs text-white/70">Desktop</div>
          )}
        </div>
      </section>
    </div>
  );
}
