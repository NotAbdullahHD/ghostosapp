import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  fullscreen: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: number;
}

export interface Wallpaper {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  css: string;
  /** optional video file (in /public) used as live wallpaper */
  video?: string;
  /** poster shown over video while loading */
  poster?: string;
  /** optional animated overlay layer */
  animated?: "city" | "rain" | "grid" | "aurora" | "glitch";
  /** if set, requires this redeem code to unlock */
  code?: string;
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "nebula",  name: "NEBULA",  rarity: "common", css: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(168,85,247,0.45), transparent 60%), radial-gradient(ellipse 70% 60% at 80% 100%, rgba(59,130,246,0.45), transparent 60%), linear-gradient(180deg,#0a0612,#070510)", animated: "aurora" },
  { id: "void",    name: "VOID",    rarity: "common", css: "radial-gradient(ellipse at center, #1a1030 0%, #050308 70%)" },
  { id: "matrix",  name: "MATRIX",  rarity: "common", css: "linear-gradient(180deg,#000 0%,#031a08 100%)", animated: "grid" },
  { id: "carbon",  name: "CARBON",  rarity: "common", css: "linear-gradient(180deg,#0a0a0f 0%,#16161f 100%)" },

  // unlockable LIVE video wallpapers
  { id: "northern-light", name: "NORTHERN LIGHT", rarity: "rare",
    css: "linear-gradient(180deg,#02050a 0%,#0a1a30 100%)",
    video: "/wallpapers/northern-light.mp4", code: "#aur0r4x" },
  { id: "crimson", name: "CRIMSON BLIND FAITH", rarity: "legendary",
    css: "linear-gradient(180deg,#0a0000 0%,#1a0008 100%)",
    video: "/wallpapers/crimson.mp4", code: "#bl00df41th" },
  { id: "midnight-core", name: "MIDNIGHT CORE", rarity: "mythic",
    css: "linear-gradient(180deg,#000 0%,#0a0420 100%)",
    video: "/wallpapers/midnight-core.mp4", code: "#m1dn1tefuel" },
];

interface GhostCtx {
  booted: boolean;
  setBooted: (b: boolean) => void;
  windows: WindowState[];
  wallpaper: string;
  wallpaperId: string;
  setWallpaperById: (id: string) => boolean;
  unlocked: Record<string, boolean>;
  redeemCode: (code: string) => { ok: boolean; wallpaper?: Wallpaper; reason?: string };
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
  toggleFullscreen: (id: string) => void;
  setWallpaper: (w: string) => void;
  hasFullscreen: boolean;
}

const Ctx = createContext<GhostCtx | null>(null);

const LS_UNLOCKED = "ghost.unlocked";
const LS_WALL = "ghost.wallpaperId";

export function GhostProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_UNLOCKED) || "{}"); } catch { return {}; }
  });
  const [wallpaperId, setWallpaperId] = useState<string>(() => localStorage.getItem(LS_WALL) || WALLPAPERS[0].id);
  const [wallpaper, setWallpaper] = useState(() => {
    const id = localStorage.getItem(LS_WALL) || WALLPAPERS[0].id;
    return (WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0]).css;
  });
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "welcome", title: "GhostOS v3.2.0", body: "System online. All modules operational.", time: Date.now() },
  ]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const zRef = useRef(10);

  useEffect(() => { localStorage.setItem(LS_UNLOCKED, JSON.stringify(unlocked)); }, [unlocked]);
  useEffect(() => { localStorage.setItem(LS_WALL, wallpaperId); }, [wallpaperId]);

  const setWallpaperById = useCallback((id: string) => {
    const wp = WALLPAPERS.find((w) => w.id === id);
    if (!wp) return false;
    if (wp.code && !unlocked[wp.id]) return false;
    setWallpaperId(wp.id);
    setWallpaper(wp.css);
    return true;
  }, [unlocked]);

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
          z: zRef.current, minimized: false, maximized: false, fullscreen: false,
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
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, maximized: !w.maximized, fullscreen: false } : w))), []);
  const toggleFullscreen = useCallback((id: string) =>
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, fullscreen: !w.fullscreen } : w))), []);
  const toggleNotifCenter = useCallback(() => setShowNotifCenter((s) => !s), []);
  const pushNotification = useCallback((n: { title: string; body: string }) =>
    setNotifications((arr) => [{ ...n, id: Math.random().toString(36).slice(2), time: Date.now() }, ...arr].slice(0, 20)), []);
  const dismissNotification = useCallback((id: string) =>
    setNotifications((arr) => arr.filter((n) => n.id !== id)), []);

  const redeemCode = useCallback((raw: string) => {
    const code = raw.trim().toLowerCase();
    if (!code) return { ok: false, reason: "empty code" };
    const wp = WALLPAPERS.find((w) => w.code && w.code.toLowerCase() === code);
    if (!wp) return { ok: false, reason: "invalid or expired code" };
    if (unlocked[wp.id]) return { ok: false, reason: "already unlocked", wallpaper: wp };
    setUnlocked((u) => ({ ...u, [wp.id]: true }));
    pushNotification({ title: `Unlocked: ${wp.name}`, body: `${wp.rarity.toUpperCase()} wallpaper added to your library.` });
    return { ok: true, wallpaper: wp };
  }, [unlocked, pushNotification]);

  const hasFullscreen = windows.some((w) => w.fullscreen && !w.minimized);

  const value = useMemo<GhostCtx>(() => ({
    booted, setBooted, windows, wallpaper, wallpaperId, setWallpaperById,
    unlocked, redeemCode,
    notifications, showNotifCenter,
    toggleNotifCenter, pushNotification, dismissNotification,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, toggleFullscreen, setWallpaper,
    hasFullscreen,
  }), [booted, windows, wallpaper, wallpaperId, setWallpaperById, unlocked, redeemCode,
    notifications, showNotifCenter,
    toggleNotifCenter, pushNotification, dismissNotification,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, toggleFullscreen, hasFullscreen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGhost() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGhost outside provider");
  return v;
}
