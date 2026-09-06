import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Monitor, RefreshCw, Maximize, Settings, Terminal, Image, Radio, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { useGhost } from "./store";

export function DesktopContextMenu() {
  const { openApp, hasFullscreen, openGhostDrop, setShowWallpaperPicker, settings, updateSettings } = useGhost();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      // only on the bare desktop area (not inside windows, dock, menubar)
      if (tgt.closest("[data-no-ctx]") || tgt.closest("button, input, textarea, a, iframe")) return;
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 240);
      const y = Math.min(e.clientY, window.innerHeight - 460);
      setMenu({ x, y });
    };
    const onClick = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    window.addEventListener("contextmenu", onCtx);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contextmenu", onCtx);
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (hasFullscreen) return null;

  const items = [
    { icon: <Radio className="h-3.5 w-3.5" />, label: "Share with GhostDrop", action: () => openGhostDrop() },
    { icon: <Palette className="h-3.5 w-3.5" />, label: "Personalize", action: () => openApp("settings", "Settings") },
    { icon: <Image className="h-3.5 w-3.5" />, label: "Wallpapers", action: () => setShowWallpaperPicker(true) },
    { icon: <Monitor className="h-3.5 w-3.5" />, label: "Display Settings", action: () => openApp("settings", "Settings") },
    { icon: <AlignLeft className="h-3.5 w-3.5" />, label: `Dock Left${settings.dockPosition === "left" ? " ·" : ""}`, action: () => updateSettings({ dockPosition: "left" }) },
    { icon: <AlignCenter className="h-3.5 w-3.5" />, label: `Dock Bottom${settings.dockPosition === "bottom" ? " ·" : ""}`, action: () => updateSettings({ dockPosition: "bottom" }) },
    { icon: <AlignRight className="h-3.5 w-3.5" />, label: `Dock Right${settings.dockPosition === "right" ? " ·" : ""}`, action: () => updateSettings({ dockPosition: "right" }) },

    { icon: <RefreshCw className="h-3.5 w-3.5" />, label: "Refresh", action: () => window.location.reload() },
    { icon: <Terminal className="h-3.5 w-3.5" />, label: "Open Terminal", action: () => openApp("terminal", "Terminal") },
    { icon: <Maximize className="h-3.5 w-3.5" />, label: "Fullscreen", action: () => document.documentElement.requestFullscreen?.() },
    { icon: <Settings className="h-3.5 w-3.5" />, label: "App Settings", action: () => openApp("settings", "Settings") },
  ];

  return (
    <AnimatePresence>
      {menu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -2 }}
          transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{ left: menu.x, top: menu.y }}
          className="fixed z-[9000] w-56 glass-strong rounded-xl p-1.5 ring-1 ring-fuchsia-500/25 shadow-[0_20px_60px_-10px_rgba(0,0,0,.85)]"
        >
          <div className="px-3 py-1.5 text-[9px] tracking-[0.4em] font-mono text-fuchsia-300/70 border-b border-white/5 mb-1">GHOSTOS · DESKTOP</div>
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => { it.action(); setMenu(null); }}
              className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-fuchsia-500/20 hover:to-violet-500/10 transition"
            >
              <span className="text-fuchsia-300 group-hover:text-fuchsia-200">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
