import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ESCAPE_HOLD_MS } from "./personalization";
import { AppIcon } from "./AppIcon";
import { useGhost, type WindowState } from "./store";
import { X, Minus, Square, Maximize, Minimize2, Copy } from "lucide-react";

export function Window({ win, children }: { win: WindowState; children: ReactNode }) {
  const { focusWindow, closeWindow, toggleMinimize, toggleMaximize, toggleFullscreen, updateWindow } = useGhost();
  const dragStart = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
  const resizeStart = useRef<{ mx: number; my: number; w: number; h: number } | null>(null);
  const [snapHint, setSnapHint] = useState<null | "left" | "right" | "top">(null);
  const [dragging, setDragging] = useState(false);

  const [holdingEscape, setHoldingEscape] = useState(false);
  const nativeOwned = useRef(false);
  const leaveFullscreen = () => {
    toggleFullscreen(win.id);
    if (document.fullscreenElement && nativeOwned.current) void document.exitFullscreen().catch(() => {});
    nativeOwned.current = false;
    const keyboard = (navigator as Navigator & { keyboard?: { unlock?: () => void } }).keyboard;
    keyboard?.unlock?.();
  };
  const enterFullscreen = async () => {
    toggleFullscreen(win.id);
    try {
      if (!document.fullscreenElement) { await document.documentElement.requestFullscreen(); nativeOwned.current = true; }
      const keyboard = (navigator as Navigator & { keyboard?: { lock?: (keys: string[]) => Promise<void> } }).keyboard;
      await keyboard?.lock?.(["Escape"]);
    } catch { /* The in-app fullscreen remains usable when browser fullscreen is unavailable. */ }
  };
  useEffect(() => {
    if (!win.fullscreen) return;
    let hold: ReturnType<typeof setTimeout> | null = null;
    const cancel = () => { if (hold) clearTimeout(hold); hold = null; setHoldingEscape(false); };
    const down = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.repeat || hold) return;
      event.preventDefault(); setHoldingEscape(true);
      hold = setTimeout(() => { cancel(); toggleFullscreen(win.id); if (nativeOwned.current && document.fullscreenElement) void document.exitFullscreen().catch(() => {}); nativeOwned.current = false; }, ESCAPE_HOLD_MS);
    };
    const up = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    const fullscreenChange = () => { if (!document.fullscreenElement && nativeOwned.current) { nativeOwned.current = false; cancel(); toggleFullscreen(win.id); } };
    window.addEventListener("keydown", down, true); window.addEventListener("keyup", up, true); window.addEventListener("blur", cancel); document.addEventListener("fullscreenchange", fullscreenChange);
    return () => { cancel(); window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); window.removeEventListener("blur", cancel); document.removeEventListener("fullscreenchange", fullscreenChange); const keyboard = (navigator as Navigator & { keyboard?: { unlock?: () => void } }).keyboard; keyboard?.unlock?.(); };
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
          const H = window.innerHeight - 8 - 56;
          updateWindow(win.id, {
            x: snapHint === "left" ? 0 : W / 2,
            y: 8, width: W / 2, height: H,
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
    ? { top: 42, left: 8, width: "calc(100vw - 16px)", height: "calc(100dvh - 106px)" }
    : { top: Math.min(win.y, 70), left: `min(${win.x}px, max(8px, calc(100vw - ${win.width}px - 8px)))`, width: `min(${win.width}px, calc(100vw - 16px))`, height: `min(${win.height}px, calc(100dvh - 140px))` };

  return (
    <>
      {snapHint && !fullscreen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed pointer-events-none z-[550] rounded-2xl border-2 border-primary/50 bg-primary/10 backdrop-blur-md"
          style={
            snapHint === "top"
              ? { top: 42, left: 8, width: "calc(100vw - 16px)", height: "calc(100dvh - 106px)" }
              : snapHint === "left"
              ? { top: 8, left: 0, width: "50vw", height: "calc(100vh - 8px - 56px)" }
              : { top: 8, left: "50vw", width: "50vw", height: "calc(100vh - 8px - 56px)" }
          } />
      )}

      <motion.div
        key={win.id}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{
          opacity: win.minimized ? 0 : 1,
          scale: win.minimized ? 0.4 : (dragging ? 1.004 : 1),
          y: win.minimized ? 480 : 0,
          filter: dragging ? "blur(0px)" : "blur(0px)",
          transition: dragging
            ? { duration: 0 }
            : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        }}
        exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
        data-no-ctx
        role="region" aria-label={win.title}
        className={`absolute ${fullscreen ? "bg-background" : "desktop-window"} overflow-hidden flex flex-col will-change-transform`}
        style={{ ...style, zIndex: fullscreen ? 9999 : win.z, pointerEvents: win.minimized ? "none" : "auto" }}
        onMouseDown={() => focusWindow(win.id)}
      >
        {!fullscreen && (
          <div className="pointer-events-none absolute inset-0 rounded-lg" />
        )}

        {/* Title bar — hidden in fullscreen */}
        {!fullscreen && (
          <div
            className="desktop-window-title flex shrink-0 items-center justify-between px-3 h-10 select-none cursor-grab active:cursor-grabbing border-b border-chrome-border relative"
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              dragStart.current = { mx: e.clientX, my: e.clientY, x: win.x, y: win.y };
              setDragging(true);
            }}
            onDoubleClick={() => toggleMaximize(win.id)}
          >
            <div className="flex min-w-0 items-center gap-2.5"><AppIcon id={win.appId} size={20}/><span className="truncate text-xs font-medium text-chrome-foreground">{win.title}</span></div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="desktop" size="icon" aria-label="Minimize window" title="Minimize" onClick={() => toggleMinimize(win.id)} className="window-control"><Minus/></Button>
              <Button variant="desktop" size="icon" aria-label={maximized ? "Restore window" : "Maximize window"} title={maximized ? "Restore" : "Maximize"} onClick={() => toggleMaximize(win.id)} className="window-control">{maximized ? <Copy/> : <Square/>}</Button>
              <Button variant="desktop" size="icon" aria-label="Fullscreen" title="Fullscreen" onClick={() => { void enterFullscreen(); }} className="window-control"><Maximize/></Button>
              <span className="mx-1 h-4 w-px bg-chrome-border"/>
              <Button variant="desktop" size="icon" aria-label="Close window" title="Close" onClick={() => closeWindow(win.id)} className="window-control window-control-close"><X/></Button>
            </div>
          </div>
        )}

        {fullscreen && (
          <div className="fullscreen-exit fixed top-3 right-3 z-[10001]">
            <Button variant="desktop" onClick={leaveFullscreen} aria-label="Exit fullscreen" title="Exit fullscreen" className="desktop-panel relative overflow-hidden rounded-lg text-xs"><Minimize2/>{holdingEscape ? "Leaving fullscreen…" : "Exit fullscreen"}{holdingEscape && <span className="escape-progress absolute bottom-0 left-0 h-0.5 bg-primary"/>}</Button>
          </div>
        )}
        <div className="ghost-app-content flex-1 overflow-hidden relative">{children}</div>

        {!maximized && !fullscreen && (
          <div
            onMouseDown={(e) => { e.stopPropagation(); resizeStart.current = { mx: e.clientX, my: e.clientY, w: win.width, h: win.height }; }}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            aria-hidden
          />
        )}
      </motion.div>
    </>
  );
}
