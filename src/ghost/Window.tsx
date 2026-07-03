import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useGhost, type WindowState } from "./store";
import { X, Minus, Square, Maximize, Minimize2 } from "lucide-react";

export function Window({ win, children }: { win: WindowState; children: ReactNode }) {
  const { focusWindow, closeWindow, toggleMinimize, toggleMaximize, toggleFullscreen, updateWindow } = useGhost();
  const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);
  const [snapHint, setSnapHint] = useState<null | "left" | "right" | "top">(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && win.fullscreen) toggleFullscreen(win.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [win.fullscreen, win.id, toggleFullscreen]);

  useEffect(() => {
    let raf = 0;
    let pending: Partial<WindowState> | null = null;
    const flush = () => {
      raf = 0;
      if (pending) { updateWindow(win.id, pending); pending = null; }
    };
    const schedule = (patch: Partial<WindowState>) => {
      pending = pending ? { ...pending, ...patch } : patch;
      if (!raf) raf = requestAnimationFrame(flush);
    };

    const onMove = (e: MouseEvent) => {
      if (dragStart.current && !win.maximized && !win.fullscreen) {
        const dx = e.clientX - dragStart.current.mx;
        const dy = e.clientY - dragStart.current.my;
        schedule({
          x: Math.max(0, dragStart.current.x + dx),
          y: Math.max(0, dragStart.current.y + dy),
        });
        const nextHint =
          e.clientY <= 4 ? "top"
          : e.clientX <= 6 ? "left"
          : e.clientX >= window.innerWidth - 6 ? "right"
          : null;
        setSnapHint((h) => (h === nextHint ? h : nextHint));
      }
      if (resizeStart.current) {
        const dx = e.clientX - resizeStart.current.mx;
        const dy = e.clientY - resizeStart.current.my;
        schedule({
          width: Math.max(420, resizeStart.current.w + dx),
          height: Math.max(320, resizeStart.current.h + dy),
        });
      }
    };
    const onUp = () => {
      if (raf) { cancelAnimationFrame(raf); raf = 0; flush(); }
      if (dragStart.current && snapHint) {
        if (snapHint === "top") toggleMaximize(win.id);
        else {
          const W = window.innerWidth;
          const H = window.innerHeight - 36 - 88;
          updateWindow(win.id, {
            x: snapHint === "left" ? 0 : W / 2,
            y: 36, width: W / 2, height: H,
          });
        }
      }
      dragStart.current = null; resizeStart.current = null;
      setSnapHint(null); setDragging(false);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [win.id, win.maximized, win.fullscreen, updateWindow, snapHint, toggleMaximize]);

  const fullscreen = win.fullscreen;
  const maximized = win.maximized;
  const style = fullscreen
    ? { top: 0, left: 0, width: "100vw", height: "100vh" }
    : maximized
    ? { top: 36, left: 0, width: "100vw", height: "calc(100vh - 36px - 88px)" }
    : { top: win.y, left: win.x, width: win.width, height: win.height };

  return (
    <>
      {snapHint && !fullscreen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed pointer-events-none z-[550] rounded-2xl border-2 border-fuchsia-400/60 bg-fuchsia-500/10 backdrop-blur-md"
          style={
            snapHint === "top"
              ? { top: 36, left: 0, width: "100vw", height: "calc(100vh - 36px - 88px)" }
              : snapHint === "left"
              ? { top: 36, left: 0, width: "50vw", height: "calc(100vh - 36px - 88px)" }
              : { top: 36, left: "50vw", width: "50vw", height: "calc(100vh - 36px - 88px)" }
          } />
      )}

      <motion.div
        key={win.id}
        initial={{ opacity: 0, scale: 0.88, y: 30, filter: "blur(8px)" }}
        animate={{
          opacity: win.minimized ? 0 : 1,
          scale: win.minimized ? 0.35 : (dragging ? 1.005 : 1),
          y: win.minimized ? 500 : 0,
          filter: "blur(0px)",
        }}
        exit={{ opacity: 0, scale: 0.85, y: 50, filter: "blur(6px)", transition: { duration: 0.25 } }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`absolute ${fullscreen ? "" : "glass-strong window-shadow rounded-2xl"} overflow-hidden flex flex-col`}
        style={{ ...style, zIndex: fullscreen ? 9999 : win.z, pointerEvents: win.minimized ? "none" : "auto" }}
        onMouseDown={() => focusWindow(win.id)}
      >
        {!fullscreen && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
        )}

        {/* Title bar — hidden in fullscreen */}
        {!fullscreen && (
          <div
            className="flex items-center justify-between px-4 h-10 select-none cursor-grab active:cursor-grabbing border-b border-white/5 relative"
            style={{ background: "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.01))" }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              dragStart.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y };
              setDragging(true);
            }}
            onDoubleClick={() => toggleMaximize(win.id)}
          >
            <div className="flex items-center gap-2">
              <button onClick={() => closeWindow(win.id)} className="group h-3 w-3 rounded-full bg-red-500/90 hover:bg-red-400 transition flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,.6)]">
                <X className="h-2 w-2 text-red-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
              </button>
              <button onClick={() => toggleMinimize(win.id)} className="group h-3 w-3 rounded-full bg-yellow-500/90 hover:bg-yellow-400 transition flex items-center justify-center shadow-[0_0_8px_rgba(234,179,8,.5)]">
                <Minus className="h-2 w-2 text-yellow-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
              </button>
              <button onClick={() => toggleMaximize(win.id)} className="group h-3 w-3 rounded-full bg-emerald-500/90 hover:bg-emerald-400 transition flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,.5)]">
                <Square className="h-2 w-2 text-emerald-950 opacity-0 group-hover:opacity-100" strokeWidth={3} />
              </button>
            </div>
            <div className="text-xs font-mono tracking-widest text-white/70 uppercase absolute left-1/2 -translate-x-1/2">{win.title}</div>
            <button
              onClick={() => toggleFullscreen(win.id)}
              title="Enter immersive fullscreen"
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono tracking-widest text-fuchsia-200/80 hover:text-white hover:bg-fuchsia-500/15 ring-1 ring-fuchsia-400/20 transition"
            >
              <Maximize className="h-3 w-3" /> IMMERSE
            </button>
          </div>
        )}

        {/* Floating fullscreen exit button */}
        {fullscreen && (
          <motion.button
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={() => toggleFullscreen(win.id)}
            title="Exit fullscreen (Esc)"
            className="group fixed top-3 right-3 z-[10001] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl ring-1 ring-fuchsia-400/30 hover:ring-fuchsia-400/70 hover:bg-black/80 transition shadow-[0_0_24px_rgba(232,121,249,.3)]"
          >
            <Minimize2 className="h-3 w-3 text-fuchsia-200" />
            <span className="text-[10px] font-mono tracking-widest text-fuchsia-200">EXIT · ESC</span>
          </motion.button>
        )}

        <div className="flex-1 overflow-hidden relative">{children}</div>

        {!maximized && !fullscreen && (
          <div
            onMouseDown={(e) => { e.stopPropagation(); resizeStart.current = { mx: e.clientX, my: e.clientY, w: win.width, h: win.height }; }}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            style={{ background: "linear-gradient(135deg, transparent 50%, rgba(255,255,255,.25) 50%)" }}
          />
        )}
      </motion.div>
    </>
  );
}
