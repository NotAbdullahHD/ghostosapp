import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGhost, type WindowState } from "./store";
import { X, Minus, Square } from "lucide-react";

export function Window({ win, children }: { win: WindowState; children: ReactNode }) {
  const { focusWindow, closeWindow, toggleMinimize, toggleMaximize, updateWindow } = useGhost();
  const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);

  // global mouse listeners
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragStart.current && !win.maximized) {
        const dx = e.clientX - dragStart.current.mx;
        const dy = e.clientY - dragStart.current.my;
        updateWindow(win.id, {
          x: Math.max(0, dragStart.current.x + dx),
          y: Math.max(0, dragStart.current.y + dy),
        });
      }
      if (resizeStart.current) {
        const dx = e.clientX - resizeStart.current.mx;
        const dy = e.clientY - resizeStart.current.my;
        updateWindow(win.id, {
          width: Math.max(420, resizeStart.current.w + dx),
          height: Math.max(320, resizeStart.current.h + dy),
        });
      }
    };
    const onUp = () => { dragStart.current = null; resizeStart.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [win.id, win.maximized, updateWindow]);

  const maximized = win.maximized;
  const style = maximized
    ? { top: 36, left: 0, width: "100vw", height: "calc(100vh - 36px - 88px)" }
    : { top: win.y, left: win.x, width: win.width, height: win.height };

  return (
    <motion.div
      key={win.id}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: win.minimized ? 0 : 1, scale: win.minimized ? 0.4 : 1, y: win.minimized ? 400 : 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 40, transition: { duration: 0.22 } }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="absolute glass-strong window-shadow rounded-2xl overflow-hidden flex flex-col"
      style={{ ...style, zIndex: win.z, pointerEvents: win.minimized ? "none" : "auto" }}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 h-10 select-none cursor-grab active:cursor-grabbing border-b border-white/5"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.01))" }}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          dragStart.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y };
        }}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-2">
          <button onClick={() => closeWindow(win.id)} className="group h-3 w-3 rounded-full bg-red-500/90 hover:bg-red-400 transition flex items-center justify-center">
            <X className="h-2 w-2 text-red-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button onClick={() => toggleMinimize(win.id)} className="group h-3 w-3 rounded-full bg-yellow-500/90 hover:bg-yellow-400 transition flex items-center justify-center">
            <Minus className="h-2 w-2 text-yellow-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button onClick={() => toggleMaximize(win.id)} className="group h-3 w-3 rounded-full bg-emerald-500/90 hover:bg-emerald-400 transition flex items-center justify-center">
            <Square className="h-2 w-2 text-emerald-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
          </button>
        </div>
        <div className="text-xs font-mono tracking-widest text-white/60 uppercase">{win.title}</div>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">{children}</div>

      {/* Resize handle */}
      {!maximized && (
        <div
          onMouseDown={(e) => { resizeStart.current = { mx: e.clientX, my: e.clientY, w: win.width, h: win.height }; }}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
          style={{ background: "linear-gradient(135deg, transparent 50%, rgba(255,255,255,.25) 50%)" }}
        />
      )}
    </motion.div>
  );
}
