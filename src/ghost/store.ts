import { create } from "zustand";
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

interface GhostStore {
  booted: boolean;
  setBooted: (b: boolean) => void;
  windows: WindowState[];
  zCounter: number;
  wallpaper: string;
  accent: string;
  notifications: Notification[];
  showNotifCenter: boolean;
  toggleNotifCenter: () => void;
  pushNotification: (n: Omit<Notification, "id" | "time">) => void;
  dismissNotification: (id: string) => void;
  openApp: (appId: AppId, title: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowState>) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setWallpaper: (w: string) => void;
  setAccent: (a: string) => void;
}

export const WALLPAPERS = [
  { id: "nebula", name: "Nebula", css: "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(168,85,247,0.45), transparent 60%), radial-gradient(ellipse 70% 60% at 80% 100%, rgba(59,130,246,0.45), transparent 60%), linear-gradient(180deg,#0a0612,#070510)" },
  { id: "void", name: "Void", css: "radial-gradient(ellipse at center, #1a1030 0%, #050308 70%)" },
  { id: "matrix", name: "Matrix", css: "linear-gradient(180deg,#000 0%,#031a08 100%)" },
  { id: "sunset", name: "Sunset", css: "linear-gradient(180deg,#1a0530 0%,#3d0a3d 50%,#7a1a3d 100%)" },
  { id: "carbon", name: "Carbon", css: "linear-gradient(180deg,#0a0a0f 0%,#16161f 100%)" },
];

export const useGhost = create<GhostStore>((set, get) => ({
  booted: false,
  setBooted: (b) => set({ booted: b }),
  windows: [],
  zCounter: 10,
  wallpaper: WALLPAPERS[0].css,
  accent: "305",
  notifications: [
    { id: "welcome", title: "GhostOS v3.1.4", body: "System online. All modules operational.", time: Date.now() },
  ],
  showNotifCenter: false,
  toggleNotifCenter: () => set((s) => ({ showNotifCenter: !s.showNotifCenter })),
  pushNotification: (n) =>
    set((s) => ({ notifications: [{ ...n, id: Math.random().toString(36).slice(2), time: Date.now() }, ...s.notifications].slice(0, 20) })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  openApp: (appId, title) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      if (existing.minimized) get().toggleMinimize(existing.id);
      return;
    }
    const z = get().zCounter + 1;
    const id = `${appId}-${Date.now()}`;
    const baseW = 880, baseH = 580;
    const offset = get().windows.length * 30;
    set((s) => ({
      zCounter: z,
      windows: [
        ...s.windows,
        {
          id, appId, title,
          x: 120 + offset, y: 80 + offset,
          width: baseW, height: baseH,
          z, minimized: false, maximized: false,
        },
      ],
    }));
  },
  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),
  focusWindow: (id) =>
    set((s) => {
      const z = s.zCounter + 1;
      return { zCounter: z, windows: s.windows.map((w) => (w.id === id ? { ...w, z } : w)) };
    }),
  updateWindow: (id, patch) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
  toggleMinimize: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)) })),
  toggleMaximize: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),
  setWallpaper: (w) => set({ wallpaper: w }),
  setAccent: (a) => set({ accent: a }),
}));
