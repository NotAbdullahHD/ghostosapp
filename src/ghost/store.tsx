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

export type NotifApp = "system" | "chat" | "ghostdrop" | "movies" | "games" | "downloads" | "settings";

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: number;
  app?: NotifApp;
  read?: boolean;
}

export interface Wallpaper {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  css: string;
  video?: string;
  poster?: string;
  animated?: "city" | "rain" | "grid" | "aurora" | "glitch";
  /** redeem code required to unlock (shown only as "REQUIRES CODE", never revealed in UI). */
  code?: string;
  /** exclusive wallpapers cannot be redeemed via codes; unlocked only by hidden actions. */
  exclusive?: boolean;
  exclusiveHint?: string;
}

export const WALLPAPERS: Wallpaper[] = [
  // FREE defaults — animated video
  { id: "celestial-veil", name: "CELESTIAL VEIL", rarity: "common",
    css: "linear-gradient(180deg,#02030a 0%,#0a0820 100%)", video: "/wallpapers/celestial-veil.mp4" },
  { id: "silver-silence", name: "SILVER SILENCE", rarity: "common",
    css: "linear-gradient(180deg,#000 0%,#0a0a14 100%)", video: "/wallpapers/silver-silence.mp4" },
  { id: "carbon",  name: "CARBON",  rarity: "common", css: "linear-gradient(180deg,#0a0a0f 0%,#16161f 100%)" },
  { id: "matrix",  name: "MATRIX",  rarity: "common", css: "linear-gradient(180deg,#000 0%,#031a08 100%)", animated: "grid" },

  // FREE animated/video — promoted to no-code (codes leaked)
  { id: "northern-light", name: "NORTHERN LIGHT", rarity: "rare",
    css: "linear-gradient(180deg,#02050a 0%,#0a1a30 100%)", video: "/wallpapers/northern-light.mp4" },
  { id: "crimson", name: "CRIMSON BLIND FAITH", rarity: "legendary",
    css: "linear-gradient(180deg,#0a0000 0%,#1a0008 100%)", video: "/wallpapers/crimson.mp4" },
  { id: "midnight-core", name: "MIDNIGHT CORE", rarity: "mythic",
    css: "linear-gradient(180deg,#000 0%,#0a0420 100%)", video: "/wallpapers/midnight-core.mp4" },

  // NEW redeem-only — codes shared on Discord
  { id: "rapi-red-hood", name: "RAPI · RED HOOD", rarity: "epic",
    css: "linear-gradient(180deg,#0c0007 0%,#1a000a 100%)",
    video: "/wallpapers/rapi-red-hood.mp4", code: "#r3dh00d" },
  { id: "sukuna", name: "SUKUNA · KING OF CURSES", rarity: "legendary",
    css: "linear-gradient(180deg,#100000 0%,#2a0500 100%)",
    video: "/wallpapers/sukuna.mp4", code: "#k1ngofcurses" },
  { id: "gojo", name: "GOJO · INFINITY", rarity: "legendary",
    css: "linear-gradient(180deg,#000510 0%,#001a30 100%)",
    video: "/wallpapers/gojo.mp4", code: "#s1xeyes" },

  // Static image wallpapers
  { id: "neon-drift", name: "NEON DRIFT", rarity: "common",
    css: "linear-gradient(180deg,#05060a 0%,#0d1018 100%)", image: "/wallpapers/fx-neon.png" },
  { id: "vinyl", name: "VINYL", rarity: "common",
    css: "linear-gradient(180deg,#08070a 0%,#141018 100%)", image: "/wallpapers/fx-vinyl.jpg" },


  // EXCLUSIVE — no code, hidden unlock only
  { id: "yuta", name: "YUTA · CURSED KING", rarity: "mythic",
    css: "linear-gradient(180deg,#000 0%,#10001a 100%)",
    video: "/wallpapers/yuta.mp4", exclusive: true,
    exclusiveHint: "Whisper to the Ghost. Click the GhostOS logo six times." },
];

export type SearchEngineId = "google" | "duckduckgo" | "brave" | "bing";
export type ProxyProviderId = "scramjet" | "ultraviolet";
export type NewTabBehavior = "homepage" | "blank" | "ghost";

export const SEARCH_ENGINES: { id: SearchEngineId; name: string; query: string }[] = [
  { id: "google", name: "Google", query: "https://www.google.com/search?q=" },
  { id: "duckduckgo", name: "DuckDuckGo", query: "https://duckduckgo.com/?q=" },
  { id: "brave", name: "Brave Search", query: "https://search.brave.com/search?q=" },
  { id: "bing", name: "Bing", query: "https://www.bing.com/search?q=" },
];

/** Modular proxy backends — new providers only need an entry here. */
export const PROXY_PROVIDERS: { id: ProxyProviderId; name: string; note: string; available: boolean }[] = [
  { id: "scramjet", name: "Scramjet", note: "Default · Mercury Workshop rewriter", available: true },
  { id: "ultraviolet", name: "Ultraviolet", note: "Legacy fallback relay", available: true },
];

export type PowerMode = "performance" | "balanced" | "battery";
export type AnimationQuality = "high" | "reduced" | "off";

export interface SystemSettings {
  idleLockMinutes: number;       // 0 = off
  redirectConfirm: boolean;
  tabCloak: string;              // preset id, "off" = no cloak
  panicKey: string;              // single key to trigger panic
  /* Performance */
  powerMode: PowerMode;
  animationQuality: AnimationQuality;
  blurEffects: boolean;
  wallpaperEffects: boolean;
  motionEffects: boolean;
  developerMode: boolean;
  /* Browser */
  searchEngine: SearchEngineId;
  proxyProvider: ProxyProviderId;
  homepage: string;
  newTab: NewTabBehavior;
}

const DEFAULT_SETTINGS: SystemSettings = {
  idleLockMinutes: 0,
  redirectConfirm: false,
  tabCloak: "off",
  panicKey: "`",
  powerMode: "balanced",
  animationQuality: "high",
  blurEffects: true,
  wallpaperEffects: true,
  motionEffects: true,
  developerMode: false,
  searchEngine: "google",
  proxyProvider: "scramjet",
  homepage: "https://www.google.com",
  newTab: "ghost",
};

export interface DesktopIcon { appId: AppId; x: number; y: number }

export type WidgetId = "quick" | "status" | "nowplaying" | "updates";

export const DEFAULT_PINNED: AppId[] = [
  "browser", "ghostcloud", "games", "movies", "music", "chat", "files", "settings",
];

const DEFAULT_WIDGETS: Record<WidgetId, boolean> = {
  quick: true, status: true, nowplaying: true, updates: true,
};


interface GhostCtx {
  booted: boolean;
  setBooted: (b: boolean) => void;
  windows: WindowState[];
  wallpaper: string;
  wallpaperId: string;
  setWallpaperById: (id: string) => boolean;
  unlocked: Record<string, boolean>;
  redeemCode: (code: string) => { ok: boolean; wallpaper?: Wallpaper; reason?: string };
  unlockExclusive: (id: string) => boolean;
  notifications: Notification[];
  showNotifCenter: boolean;
  toggleNotifCenter: () => void;
  pushNotification: (n: { title: string; body: string; app?: NotifApp }) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAllNotificationsRead: () => void;
  showControlCenter: boolean;
  toggleControlCenter: () => void;
  openApp: (appId: AppId, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  setWallpaper: (w: string) => void;
  hasFullscreen: boolean;
  showLauncher: boolean;
  toggleLauncher: () => void;
  settings: SystemSettings;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  triggerPanic: () => void;
  locked: boolean;
  setLocked: (b: boolean) => void;
  showGhostDrop: boolean;
  toggleGhostDrop: () => void;
  openGhostDrop: (files?: File[]) => void;
  closeGhostDrop: () => void;
  pendingDropFiles: File[];
  clearPendingDropFiles: () => void;
  installedApps: Record<string, boolean>;
  installApp: (appId: AppId) => void;
  uninstallApp: (appId: AppId) => void;
  /* Dock pins */
  pinned: AppId[];
  pinApp: (appId: AppId) => void;
  unpinApp: (appId: AppId) => void;
  /* Desktop icons */
  desktopIcons: DesktopIcon[];
  addDesktopIcon: (appId: AppId, x: number, y: number) => void;
  moveDesktopIcon: (appId: AppId, x: number, y: number) => void;
  removeDesktopIcon: (appId: AppId) => void;
  /* Widgets */
  widgets: Record<WidgetId, boolean>;
  toggleWidget: (id: WidgetId) => void;
  /* Wallpaper picker */
  showWallpaperPicker: boolean;
  setShowWallpaperPicker: (b: boolean) => void;
}

const Ctx = createContext<GhostCtx | null>(null);

const LS_UNLOCKED = "ghost.unlocked";
const LS_WALL = "ghost.wallpaperId";
const LS_WINDOWS = "ghost.windows";
const LS_SETTINGS = "ghost.settings";
const LS_INSTALLED = "ghost.installedApps";
const LS_PINNED = "ghost.dockPins";
const LS_ICONS = "ghost.desktopIcons";
const LS_WIDGETS = "ghost.widgets";

const isBrowser = typeof window !== "undefined";
const ls = {
  get: (k: string) => (isBrowser ? window.localStorage.getItem(k) : null),
  set: (k: string, v: string) => { if (isBrowser) window.localStorage.setItem(k, v); },
};

export function GhostProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [windows, setWindows] = useState<WindowState[]>(() => {
    try {
      const raw = ls.get(LS_WINDOWS);
      if (!raw) return [];
      const arr = JSON.parse(raw) as WindowState[];
      // restore but never start fullscreen on load
      return arr.map((w) => ({ ...w, fullscreen: false }));
    } catch { return []; }
  });
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(ls.get(LS_UNLOCKED) || "{}"); } catch { return {}; }
  });
  const [wallpaperId, setWallpaperId] = useState<string>(() => ls.get(LS_WALL) || WALLPAPERS[0].id);
  const [wallpaper, setWallpaper] = useState(() => {
    const id = ls.get(LS_WALL) || WALLPAPERS[0].id;
    return (WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0]).css;
  });
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "welcome", title: "GhostOS v3.4.0", body: "Persistent sessions enabled. Multitask freely.", time: Date.now() },
  ]);
  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showLauncher, setShowLauncher] = useState(false);
  const [locked, setLocked] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(ls.get(LS_SETTINGS) || "{}") }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [installedApps, setInstalledApps] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(ls.get(LS_INSTALLED) || "{}"); } catch { return {}; }
  });
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false);
  const [pinned, setPinned] = useState<AppId[]>(() => {
    try {
      const raw = ls.get(LS_PINNED);
      if (!raw) return DEFAULT_PINNED;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as AppId[]) : DEFAULT_PINNED;
    } catch { return DEFAULT_PINNED; }
  });
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>(() => {
    try {
      const raw = ls.get(LS_ICONS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as DesktopIcon[]) : [];
    } catch { return []; }
  });
  const [widgets, setWidgets] = useState<Record<WidgetId, boolean>>(() => {
    try { return { ...DEFAULT_WIDGETS, ...JSON.parse(ls.get(LS_WIDGETS) || "{}") }; }
    catch { return DEFAULT_WIDGETS; }
  });

  useEffect(() => { ls.set(LS_PINNED, JSON.stringify(pinned)); }, [pinned]);
  useEffect(() => { ls.set(LS_ICONS, JSON.stringify(desktopIcons)); }, [desktopIcons]);
  useEffect(() => { ls.set(LS_WIDGETS, JSON.stringify(widgets)); }, [widgets]);

  const pinApp = useCallback((appId: AppId) =>
    setPinned((p) => (p.includes(appId) ? p : [...p, appId])), []);
  const unpinApp = useCallback((appId: AppId) =>
    setPinned((p) => p.filter((id) => id !== appId)), []);
  const addDesktopIcon = useCallback((appId: AppId, x: number, y: number) =>
    setDesktopIcons((icons) => (icons.some((i) => i.appId === appId)
      ? icons.map((i) => (i.appId === appId ? { ...i, x, y } : i))
      : [...icons, { appId, x, y }])), []);
  const moveDesktopIcon = useCallback((appId: AppId, x: number, y: number) =>
    setDesktopIcons((icons) => icons.map((i) => (i.appId === appId ? { ...i, x, y } : i))), []);
  const removeDesktopIcon = useCallback((appId: AppId) =>
    setDesktopIcons((icons) => icons.filter((i) => i.appId !== appId)), []);
  const toggleWidget = useCallback((id: WidgetId) =>
    setWidgets((w) => ({ ...w, [id]: !w[id] })), []);

  const zRef = useRef(10);

  useEffect(() => { ls.set(LS_UNLOCKED, JSON.stringify(unlocked)); }, [unlocked]);
  useEffect(() => { ls.set(LS_WALL, wallpaperId); }, [wallpaperId]);
  useEffect(() => { ls.set(LS_INSTALLED, JSON.stringify(installedApps)); }, [installedApps]);
  useEffect(() => { ls.set(LS_SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => {
    const id = setTimeout(() => ls.set(LS_WINDOWS, JSON.stringify(windows)), 200);
    return () => clearTimeout(id);
  }, [windows]);


  const setWallpaperById = useCallback((id: string) => {
    const wp = WALLPAPERS.find((w) => w.id === id);
    if (!wp) return false;
    if ((wp.code || wp.exclusive) && !unlocked[wp.id]) return false;
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
    setShowLauncher(false);
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
  const toggleNotifCenter = useCallback(() => setShowNotifCenter((s) => { if (!s) setShowControlCenter(false); return !s; }), []);
  const toggleControlCenter = useCallback(() => setShowControlCenter((s) => { if (!s) setShowNotifCenter(false); return !s; }), []);
  const toggleLauncher = useCallback(() => setShowLauncher((s) => !s), []);
  const pushNotification = useCallback((n: { title: string; body: string; app?: NotifApp }) =>
    setNotifications((arr) => [{ app: "system" as NotifApp, read: false, ...n, id: Math.random().toString(36).slice(2), time: Date.now() }, ...arr].slice(0, 40)), []);
  const dismissNotification = useCallback((id: string) =>
    setNotifications((arr) => arr.filter((n) => n.id !== id)), []);
  const clearAllNotifications = useCallback(() => setNotifications([]), []);
  const markAllNotificationsRead = useCallback(() => setNotifications((arr) => arr.map((n) => ({ ...n, read: true }))), []);

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

  const unlockExclusive = useCallback((id: string) => {
    const wp = WALLPAPERS.find((w) => w.id === id && w.exclusive);
    if (!wp) return false;
    if (unlocked[id]) return false;
    setUnlocked((u) => ({ ...u, [id]: true }));
    pushNotification({ title: `EXCLUSIVE UNLOCKED: ${wp.name}`, body: `Hidden cinematic wallpaper revealed.` });
    return true;
  }, [unlocked, pushNotification]);

  const installApp = useCallback((appId: AppId) => setInstalledApps((m) => ({ ...m, [appId]: true })), []);
  const uninstallApp = useCallback((appId: AppId) => setInstalledApps((m) => {
    const next = { ...m }; delete next[appId]; return next;
  }), []);

  const updateSettings = useCallback((patch: Partial<SystemSettings>) =>
    setSettings((s) => ({ ...s, ...patch })), []);

  const triggerPanic = useCallback(() => {
    setWindows((ws) => ws.map((w) => ({ ...w, minimized: true, fullscreen: false })));
    pushNotification({ title: "PANIC MODE", body: "All windows minimized. Tab cloaked." });
  }, [pushNotification]);

  // Apply tab cloak
  useEffect(() => {
    const cloaks: Record<string, { title: string; favicon: string }> = {
      off:           { title: "GhostOS — Spectral Desktop Environment", favicon: "/favicon.ico" },
      google:        { title: "Google", favicon: "https://www.google.com/favicon.ico" },
      classroom:     { title: "Home", favicon: "https://ssl.gstatic.com/classroom/favicon.png" },
      docs:          { title: "Google Docs", favicon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
      drive:         { title: "My Drive - Google Drive", favicon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" },
      canvas:        { title: "Dashboard", favicon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
      classlink:     { title: "ClassLink", favicon: "https://launchpad.classlink.com/launchpad/static/favicon.ico" },
    };
    const c = cloaks[settings.tabCloak] || cloaks.off;
    document.title = c.title;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = c.favicon;
  }, [settings.tabCloak]);

  // Panic key listener
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = settings.panicKey;
      if (!k) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === k) {
        e.preventDefault();
        triggerPanic();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settings.panicKey, triggerPanic]);

  // Idle lock
  useEffect(() => {
    if (!settings.idleLockMinutes) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), settings.idleLockMinutes * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, reset)); };
  }, [settings.idleLockMinutes]);

  // Redirect confirmation
  useEffect(() => {
    if (!settings.redirectConfirm) return;
    const onBefore = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [settings.redirectConfirm]);

  // Performance preferences applied globally (animation speed + blur).
  useEffect(() => {
    if (!isBrowser) return;
    const root = document.documentElement;
    root.classList.toggle("ghost-anim-reduced", settings.animationQuality === "reduced");
    root.classList.toggle("ghost-anim-off", settings.animationQuality === "off");
    root.classList.toggle("ghost-no-blur", !settings.blurEffects);
  }, [settings.animationQuality, settings.blurEffects]);


  const hasFullscreen = windows.some((w) => w.fullscreen && !w.minimized);

  const [showGhostDrop, setShowGhostDrop] = useState(false);
  const [pendingDropFiles, setPendingDropFiles] = useState<File[]>([]);
  const toggleGhostDrop = useCallback(() => setShowGhostDrop((s) => !s), []);
  const closeGhostDrop = useCallback(() => setShowGhostDrop(false), []);
  const openGhostDrop = useCallback((files?: File[]) => {
    if (files && files.length) setPendingDropFiles(files);
    setShowGhostDrop(true);
  }, []);
  const clearPendingDropFiles = useCallback(() => setPendingDropFiles([]), []);

  const value = useMemo<GhostCtx>(() => ({
    booted, setBooted, windows, wallpaper, wallpaperId, setWallpaperById,
    unlocked, redeemCode, unlockExclusive,
    notifications, showNotifCenter, showControlCenter, toggleControlCenter,
    toggleNotifCenter, pushNotification, dismissNotification, clearAllNotifications, markAllNotificationsRead,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, toggleFullscreen, setWallpaper,
    hasFullscreen, showLauncher, toggleLauncher,
    settings, updateSettings, triggerPanic, locked, setLocked,
    showGhostDrop, toggleGhostDrop, openGhostDrop, closeGhostDrop, pendingDropFiles, clearPendingDropFiles,
    installedApps, installApp, uninstallApp,
    pinned, pinApp, unpinApp,
    desktopIcons, addDesktopIcon, moveDesktopIcon, removeDesktopIcon,
    widgets, toggleWidget,
    showWallpaperPicker, setShowWallpaperPicker,
  }), [installedApps, installApp, uninstallApp, booted, windows, wallpaper, wallpaperId, setWallpaperById, unlocked, redeemCode, unlockExclusive,
    notifications, showNotifCenter, showControlCenter, toggleControlCenter,
    toggleNotifCenter, pushNotification, dismissNotification, clearAllNotifications, markAllNotificationsRead,
    openApp, closeWindow, focusWindow, updateWindow, toggleMinimize, toggleMaximize, toggleFullscreen,
    hasFullscreen, showLauncher, toggleLauncher, settings, updateSettings, triggerPanic, locked,
    showGhostDrop, toggleGhostDrop, openGhostDrop, closeGhostDrop, pendingDropFiles, clearPendingDropFiles,
    pinned, pinApp, unpinApp, desktopIcons, addDesktopIcon, moveDesktopIcon, removeDesktopIcon,
    widgets, toggleWidget, showWallpaperPicker]);


  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGhost() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGhost outside provider");
  return v;
}
