import { useEffect, useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { X } from "lucide-react";

/** Shared drag helper: returns true when the pointer is released over the dock. */
export function isOverDock(x: number, y: number) {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  return !!el?.closest("[data-dock]");
}

type Folder = { id: string; name: string; apps: AppId[]; x: number; y: number };
const LS_FOLDERS = "ghost.desktopFolders.v1";

function loadFolders(): Folder[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_FOLDERS) || "[]"); } catch { return []; }
}

export function DesktopIcons() {
  const {
    desktopIcons, moveDesktopIcon, removeDesktopIcon, pinApp,
    openApp, hasFullscreen, locked,
  } = useGhost();
  const [dragging, setDragging] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>(loadFolders);
  const [open, setOpen] = useState<string | null>(null);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  useEffect(() => {
    try { localStorage.setItem(LS_FOLDERS, JSON.stringify(folders)); } catch { /* ignore */ }
  }, [folders]);

  if (hasFullscreen || locked) return null;

  const inFolder = new Set(folders.flatMap((f) => f.apps));
  const icons = desktopIcons.filter((i) => !inFolder.has(i.appId));

  const start = (e: React.PointerEvent, key: string, x: number, y: number) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    offset.current = { x: e.clientX - x, y: e.clientY - y };
    moved.current = false;
    setDragging(key);
  };

  const clamp = (e: React.PointerEvent) => ({
    x: Math.max(8, Math.min(window.innerWidth - 90, e.clientX - offset.current.x)),
    y: Math.max(8, Math.min(window.innerHeight - 110, e.clientY - offset.current.y)),
  });

  const moveApp = (e: React.PointerEvent, appId: AppId) => {
    if (dragging !== appId) return;
    moved.current = true;
    const { x, y } = clamp(e);
    moveDesktopIcon(appId, x, y);
  };

  const moveFolder = (e: React.PointerEvent, id: string) => {
    if (dragging !== id) return;
    moved.current = true;
    const { x, y } = clamp(e);
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, x, y } : f)));
  };

  /** Figure-style: dropping one icon on another groups them into a folder. */
  const dropTarget = (x: number, y: number, self: string) => {
    const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest("[data-desk-key]") as HTMLElement | null;
    const key = el?.getAttribute("data-desk-key");
    return key && key !== self ? key : null;
  };

  const endApp = (e: React.PointerEvent, appId: AppId) => {
    if (dragging !== appId) return;
    setDragging(null);
    if (isOverDock(e.clientX, e.clientY)) {
      removeDesktopIcon(appId);
      pinApp(appId);
      return;
    }
    const target = dropTarget(e.clientX, e.clientY, appId);
    if (!target) return;
    const icon = desktopIcons.find((i) => i.appId === appId);
    const targetFolder = folders.find((f) => f.id === target);
    if (targetFolder) {
      setFolders((prev) => prev.map((f) => (f.id === target ? { ...f, apps: [...f.apps, appId] } : f)));
    } else if (desktopIcons.some((i) => i.appId === target)) {
      setFolders((prev) => [
        ...prev,
        {
          id: `folder-${Date.now()}`,
          name: "Folder",
          apps: [target as AppId, appId],
          x: icon?.x ?? 40,
          y: icon?.y ?? 40,
        },
      ]);
    }
  };

  const endFolder = (id: string) => {
    if (dragging !== id) return;
    setDragging(null);
    if (!moved.current) setOpen((v) => (v === id ? null : id));
  };

  const removeFromFolder = (id: string, appId: AppId) => {
    setFolders((prev) =>
      prev
        .map((f) => (f.id === id ? { ...f, apps: f.apps.filter((a) => a !== appId) } : f))
        .filter((f) => f.apps.length > 1)
    );
  };

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none">
      {icons.map((icon) => {
        const app = APPS.find((a) => a.id === icon.appId);
        if (!app) return null;
        return (
          <button
            key={icon.appId}
            data-no-ctx
            data-desk-key={icon.appId}
            onPointerDown={(e) => start(e, icon.appId, icon.x, icon.y)}
            onPointerMove={(e) => moveApp(e, icon.appId)}
            onPointerUp={(e) => endApp(e, icon.appId)}
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

      {folders.map((f) => (
        <div key={f.id} className="pointer-events-auto absolute" style={{ left: f.x, top: f.y }}>
          <button
            data-no-ctx
            data-desk-key={f.id}
            onPointerDown={(e) => start(e, f.id, f.x, f.y)}
            onPointerMove={(e) => moveFolder(e, f.id)}
            onPointerUp={() => endFolder(f.id)}
            style={{ touchAction: "none" }}
            className={`flex w-[76px] flex-col items-center gap-1 rounded-lg p-1.5 text-center select-none hover:bg-white/10 ${
              dragging === f.id ? "opacity-70" : ""
            }`}
          >
            <span className="grid h-[44px] w-[44px] grid-cols-2 gap-[3px] rounded-[10px] bg-white/[0.1] p-[4px] border border-white/10">
              {f.apps.slice(0, 4).map((a) => (
                <AppIcon key={a} id={a} size={16} />
              ))}
            </span>
            <span
              className="w-full truncate text-[11px] text-white/85"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,.85)" }}
            >
              {f.name}
            </span>
          </button>

          {open === f.id && (
            <div className="absolute left-0 top-[76px] z-10 w-[228px] rounded-xl border border-white/10 bg-[#101013]/95 p-3 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between text-[11px] text-white/60">
                {f.name}
                <button onClick={() => setOpen(null)} className="rounded p-0.5 hover:bg-white/10">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {f.apps.map((a) => {
                  const app = APPS.find((x) => x.id === a);
                  if (!app) return null;
                  return (
                    <button
                      key={a}
                      onClick={() => { openApp(app.id, app.name); setOpen(null); }}
                      onContextMenu={(e) => { e.preventDefault(); removeFromFolder(f.id, a); }}
                      title={`${app.name} — right-click to remove`}
                      className="flex flex-col items-center gap-1 rounded-lg p-2 hover:bg-white/10"
                    >
                      <AppIcon id={app.id} size={32} />
                      <span className="w-full truncate text-[10px] text-white/75">{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
