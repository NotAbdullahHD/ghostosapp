import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppId } from "./apps";

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: number;
}

export const WALLPAPERS = [
  { id: "nebula", name: "Nebula", css: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(168,85,247,0.45), transparent 60%), radial-gradient(ellipse 70% 60% at 80% 100%, rgba(59,130,246,0.45), transparent 60%), linear-gradient(180deg,#0a0612,#070510)" },
  { id: "void", name: "Void", css: "radial-gradient(ellipse at center, #1a1030 0%, #050308 70%)" },
  { id: "matrix", name: "Matrix", css: "linear-gradient(180deg,#000 0%,#031a08 100%)" },
  { id: "sunset", name: "Sunset", css: "linear-gradient(180deg,#1a0530 0%,#3d0a3d 50%,#7a1a3d 100%)" },
  { id: "carbon", name: "Carbon", css: "linear-gradient(180deg,#0a0a0f 0%,#16161f 100%)" },
];

interface GhostCtx {
  booted: boolean;
  setBooted: (b: boolean) => void;
  windows: WindowState[];
  wallpaper: string;
  notifications: Notification[];
  showNotifCenter: boolean;
  toggleNotifCenter: () => void;
  pushNotification: (n: { title: string; body: string }) => void;
  dismissNotification: (id: string) => void;
  openApp: (appId: AppId, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setWallpaper: (w: string) => void;
}

const Ctx = createContext<GhostCtx | null>(null);

export function GhostProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [wallpaper, setWallpaper] = useState(WALLPAPERS[0].css);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "welcome", title: "GhostOS v3.1.4", body: "System online. All modules operational.", time: Date.now() },
  ]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const zRef = useRef(10);

  const focusWindow = useCallback((id: string) => {
    zRef.current += 1;
    const z = zRef.current;
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)));
  }, []);

  const openApp = useCallback((appId: AppId, title: string) => {
    setWindows((ws) => {
      const existing = ws.find((w) => w.appId === appId);
      if (existing) {
        zRef.current += 1;
        const z = zRef.current;
        return ws.map((w) => (w.id === existing.id ? { ...w, z, minimized: false } : w));
      }
      zRef.current += 1;
      const offset = ws.length * 28;
      return [
        ...ws,
        {
          id: `${appId}-${Date.now()}`,
          appId, title,
          x: 140 + offset, y: 70 + offset,
          width: 920, height: 600,
          z: zRef.current, minimized: false, maximized: false,
        },
      ];
    });
  }, []);

  const closeWindow = useCallback((id: string) => setWindows((ws) => ws.filter((w) => w.id !== id)), []);
  const updateWindow = useCallback((id: string, patch: Partial<WindowState>) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))), []);
  const toggleMinimize = useCallback((id: string) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w))), []);
  const toggleMaximize = useCallback((id: string) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w))), []);
  const toggleNotifCenter = useCallback(() => setShowNotifCenter((s) => !s), []);
  const pushNotification = useCallback((n: { title: string; body: string }) =>
    setNotifications((arr) => [{ ...n, id: Math.random().toString(36).slice(2), time: Date.now() }, ...arr].slice(0, 20)), []);
  const dismissNotification = useCallback((id: string) =>
    setNotifications((arr) => arr.filter((n) => n.id !== id)), []);

  const value = useMemo<GhostCtx>(() => ({
    booted, setBooted, windows, wallpaper, notifications, showNotifCenter,
    toggleNotifCenter, pushNotification, dismissNotification,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, setWallpaper,
  }), [booted, windows, wallpaper, notifications, showNotifCenter,
    toggleNotifCenter, pushNotification, dismissNotification,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGhost() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGhost outside provider");
  return v;
}
