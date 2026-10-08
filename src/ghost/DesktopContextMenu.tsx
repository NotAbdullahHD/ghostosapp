import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Radio, AlignLeft, AlignCenter, AlignRight, Settings2, Maximize, Minimize2, Lock, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGhost } from "./store";
import { usePersonalization } from "./PersonalizationProvider";

export function DesktopContextMenu() {
  const { openApp, hasFullscreen, locked, openGhostDrop, setShowWallpaperPicker, settings, updateSettings, setLocked } = useGhost();
  const { setShowClockEditor } = usePersonalization();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  useEffect(() => {
    const onCtx = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("[data-no-ctx],button,input,textarea,a,iframe")) return;
      event.preventDefault();
      setMenu({ x: Math.max(8, Math.min(event.clientX, window.innerWidth - 248)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 350)) });
    };
    const close = () => setMenu(null);
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const fullscreen = () => setNativeFullscreen(!!document.fullscreenElement);
    window.addEventListener("contextmenu", onCtx); window.addEventListener("mousedown", close); window.addEventListener("keydown", key); document.addEventListener("fullscreenchange", fullscreen);
    return () => { window.removeEventListener("contextmenu", onCtx); window.removeEventListener("mousedown", close); window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", fullscreen); };
  }, []);
  if (hasFullscreen || locked) return null;
  const run = (action: () => void) => { action(); setMenu(null); };
  return <AnimatePresence>{menu && <motion.div role="menu" aria-label="Desktop menu" data-no-ctx initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onMouseDown={event => event.stopPropagation()} style={{ left: menu.x, top: menu.y }} className="desktop-panel fixed z-[9000] w-60 rounded-lg p-1.5">
    <div className="px-3 py-2 text-[10px] text-chrome-muted">DESKTOP</div>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => setShowWallpaperPicker(true))}><Image/>Backgrounds</Button>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => setShowClockEditor(true))}><Type/>Customize clock</Button>
    <div className="my-1 border-t border-chrome-border"/>
    <div className="flex items-center justify-between px-3 py-2"><span className="text-xs text-chrome-muted">Dock position</span><div className="flex gap-1">{([['left', AlignLeft], ['bottom', AlignCenter], ['right', AlignRight]] as const).map(([position, Icon]) => <Button key={position} variant="desktop" size="icon" className={`h-7 w-7 ${settings.dockPosition === position ? "bg-chrome-hover text-primary" : ""}`} aria-label={`Dock ${position}`} aria-pressed={settings.dockPosition === position} title={`Dock ${position}`} onClick={() => updateSettings({ dockPosition: position })}><Icon/></Button>)}</div></div>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => openGhostDrop())}><Radio/>GhostDrop</Button>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => openApp("settings", "Settings"))}><Settings2/>Settings</Button>
    <div className="my-1 border-t border-chrome-border"/>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void document.documentElement.requestFullscreen?.().catch(() => {}); })}>{nativeFullscreen ? <Minimize2/> : <Maximize/>}{nativeFullscreen ? "Leave fullscreen" : "Enter fullscreen"}</Button>
    <Button variant="desktop" role="menuitem" className="desktop-menu-item" onClick={() => run(() => setLocked(true))}><Lock/>Lock screen</Button>
  </motion.div>}</AnimatePresence>;
}
