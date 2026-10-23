import { useEffect, useState } from "react";

/** Built-in "Ghost Mods" — Windhawk-style tweaks applied live across the desktop. */
export type OpenAnimation = "zoom" | "slide" | "genie" | "fade" | "none";
export interface GhostMods {
  openAnimation: OpenAnimation;
  windowRadius: number;      // px
  windowOpacity: number;     // 0.6 - 1
  accent: string;            // hex
  hideDesktopIcons: boolean;
  hideIconLabels: boolean;
  compactTitlebars: boolean;
  dockScale: number;         // 0.8 - 1.3
  reduceBlur: boolean;
}
export const DEFAULT_MODS: GhostMods = {
  openAnimation: "zoom", windowRadius: 14, windowOpacity: 1, accent: "#66d9ff",
  hideDesktopIcons: false, hideIconLabels: false, compactTitlebars: false, dockScale: 1, reduceBlur: false,
};
const KEY = "ghost.mods.v1";
const EVT = "ghost-mods";

export function readMods(): GhostMods {
  try { return { ...DEFAULT_MODS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULT_MODS; }
}
export function writeMods(patch: Partial<GhostMods>) {
  const next = { ...readMods(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* blocked */ }
  window.dispatchEvent(new CustomEvent(EVT));
  applyMods(next);
}
export function applyMods(m: GhostMods) {
  const r = document.documentElement;
  r.style.setProperty("--mod-radius", `${m.windowRadius}px`);
  r.style.setProperty("--mod-window-opacity", String(m.windowOpacity));
  r.style.setProperty("--ice", m.accent);
  r.style.setProperty("--mod-dock-scale", String(m.dockScale));
  r.classList.toggle("mod-hide-icons", m.hideDesktopIcons);
  r.classList.toggle("mod-hide-labels", m.hideIconLabels);
  r.classList.toggle("mod-compact-titlebar", m.compactTitlebars);
  r.classList.toggle("mod-reduce-blur", m.reduceBlur);
}
export function useMods(): GhostMods {
  const [mods, setMods] = useState<GhostMods>(DEFAULT_MODS);
  useEffect(() => {
    const sync = () => setMods(readMods());
    sync();
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  return mods;
}

export const OPEN_ANIMATIONS: Record<OpenAnimation, { initial: Record<string, number>; label: string }> = {
  zoom:  { label: "Zoom",  initial: { opacity: 0, scale: 0.9, y: 0 } },
  slide: { label: "Slide up", initial: { opacity: 0, scale: 1, y: 60 } },
  genie: { label: "Genie", initial: { opacity: 0, scale: 0.3, y: 400 } },
  fade:  { label: "Fade",  initial: { opacity: 0, scale: 1, y: 0 } },
  none:  { label: "None",  initial: { opacity: 1, scale: 1, y: 0 } },
};

/* Lock password — stored only as a SHA-256 hash on this device. */
const PW_KEY = "ghost.lockPassword.v1";
export async function hashPassword(pw: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ghostos:${pw}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
export function hasLockPassword() { try { return !!localStorage.getItem(PW_KEY); } catch { return false; } }
export async function setLockPassword(pw: string | null) {
  if (!pw) localStorage.removeItem(PW_KEY); else localStorage.setItem(PW_KEY, await hashPassword(pw));
  window.dispatchEvent(new CustomEvent(EVT));
}
export async function checkLockPassword(pw: string) {
  const saved = localStorage.getItem(PW_KEY);
  return !saved || saved === await hashPassword(pw);
}
