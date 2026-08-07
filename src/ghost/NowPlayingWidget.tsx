import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useMusic, fmtTime } from "./music";
import { useGhost } from "./store";

/**
 * Desktop Now Playing widget — Obsidian glass mini-player pinned to the right
 * edge. Visible whenever Ghost Music has an active track, even when the app
 * window is closed or minimized.
 */
export function NowPlayingWidget() {
  const { track, playing, position, duration, buffering, toggle, next, prev, stop } = useMusic();
  const { openApp, hasFullscreen } = useGhost();

  const visible = !!track && !hasFullscreen;
  const total = duration || track?.duration || 0;
  const progress = total ? Math.min(100, (position / total) * 100) : 0;


  return (
    <AnimatePresence>
      {visible && track && (
        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 28, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed right-4 bottom-24 z-40 w-[268px] select-none"
        >
          <div className="group glass-panel rounded-2xl border border-white/10 p-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]">
            <div className="flex items-start gap-3">
              <button
                onClick={() => openApp("music", "Ghost Music")}
                className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 transition group-hover:ring-[var(--ice)]/40"
                aria-label="Open Ghost Music"
              >
                {track.cover ? (
                  <img src={track.cover} alt={`${track.title} cover art`} className="h-full w-full object-cover" />
                ) : (
                  <span className={`block h-full w-full bg-gradient-to-br ${track.art}`} />
                )}
              </button>

              <button
                onClick={() => openApp("music", "Ghost Music")}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-[13px] font-semibold leading-tight text-white/95">{track.title}</div>
                <div className="truncate text-[11px] text-white/45">{track.artist}</div>
              </button>
              <button
                onClick={stop}
                className="rounded-md p-1 text-white/25 opacity-0 transition hover:text-white/70 group-hover:opacity-100"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] tabular-nums text-white/35">
              <span>{fmtTime(position)}</span>
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--ice)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{fmtTime(total)}</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-5 text-white/60">
              <button onClick={prev} className="transition hover:text-white" aria-label="Previous track">
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-black transition hover:scale-105"
                aria-label={playing ? "Pause" : "Play"}
              >
                {buffering
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : playing ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black" />}
              </button>

              <button onClick={next} className="transition hover:text-white" aria-label="Next track">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
