import { useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";

/** Shared drag helper: returns true when the pointer is released over the dock. */
export function isOverDock(x: number, y: number) {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  return !!el?.closest("[data-dock]");
}

export function DesktopIcons() {
  const {
    desktopIcons, moveDesktopIcon, removeDesktopIcon, pinApp,
    openApp, hasFullscreen, locked,
  } = useGhost();
  const [dragging, setDragging] = useState<AppId | null>(null);
  const offset = useRef({ x: 0, y: 0 });

  if (hasFullscreen || locked) return null;

  const start = (e: React.PointerEvent, icon: { appId: AppId; x: number; y: number }) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    offset.current = { x: e.clientX - icon.x, y: e.clientY - icon.y };
    setDragging(icon.appId);
  };

  const move = (e: React.PointerEvent, appId: AppId) => {
    if (dragging !== appId) return;
    const x = Math.max(8, Math.min(window.innerWidth - 90, e.clientX - offset.current.x));
    const y = Math.max(8, Math.min(window.innerHeight - 110, e.clientY - offset.current.y));
    moveDesktopIcon(appId, x, y);
  };

  const end = (e: React.PointerEvent, appId: AppId) => {
    if (dragging !== appId) return;
    setDragging(null);
    // Dropped on the dock → move the app into the dock.
    if (isOverDock(e.clientX, e.clientY)) {
      removeDesktopIcon(appId);
      pinApp(appId);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {desktopIcons.map((icon) => {
        const app = APPS.find((a) => a.id === icon.appId);
        if (!app) return null;
        return (
          <button
            key={icon.appId}
            data-no-ctx
            onPointerDown={(e) => start(e, icon)}
            onPointerMove={(e) => move(e, icon.appId)}
            onPointerUp={(e) => end(e, icon.appId)}
            onDoubleClick={() => openApp(app.id, app.name)}
            title={`${app.name} — double-click to open`}
            style={{ left: icon.x, top: icon.y, touchAction: "none" }}
            className={`pointer-events-auto absolute flex w-[76px] flex-col items-center gap-1 rounded-lg p-1.5 text-center select-none hover:bg-white/10 ${
              dragging === icon.appId ? "opacity-70" : ""
            }`}
          >
            <AppIcon id={app.id} size={44} />
            <span
              className="w-full truncate text-[11px] text-white/85"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,.85)" }}
            >
              {app.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
