import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Suspense, lazy, useEffect, useMemo } from "react";
import { useGhost, WALLPAPERS } from "./store";
import { AnimatedWallpaperLayer } from "./AnimatedWallpaperLayer";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";
import { Window } from "./Window";
import { DesktopIcons } from "./DesktopIcons";
import { NotificationCenter } from "./NotificationCenter";
import { FpsMonitor } from "./FpsMonitor";
import { OnlineStatus } from "./OnlineStatus";
import { AppLauncher } from "./AppLauncher";
import { LockScreen } from "./LockScreen";
import { DesktopContextMenu } from "./DesktopContextMenu";
import { GhostDrop } from "./GhostDrop";
import type { AppId } from "./apps";

// Lazy-load all app content — only fetches when opened.
const GamesApp = lazy(() => import("./apps/GamesApp").then((m) => ({ default: m.GamesApp })));
const MoviesApp = lazy(() => import("./apps/MoviesApp").then((m) => ({ default: m.MoviesApp })));
const GhostAIApp = lazy(() => import("./apps/GhostAIApp").then((m) => ({ default: m.GhostAIApp })));
const BrowserApp = lazy(() => import("./apps/BrowserApp").then((m) => ({ default: m.BrowserApp })));
const SettingsApp = lazy(() => import("./apps/SettingsApp").then((m) => ({ default: m.SettingsApp })));
const FilesApp = lazy(() => import("./apps/FilesApp").then((m) => ({ default: m.FilesApp })));
const MusicApp = lazy(() => import("./apps/MusicApp").then((m) => ({ default: m.MusicApp })));
const GhostChatApp = lazy(() => import("./apps/GhostChatApp").then((m) => ({ default: m.GhostChatApp })));
const StoreApp = lazy(() => import("./apps/StoreApp").then((m) => ({ default: m.StoreApp })));
const NotesApp = lazy(() => import("./apps/NotesApp").then((m) => ({ default: m.NotesApp })));
const TerminalApp = lazy(() => import("./apps/TerminalApp").then((m) => ({ default: m.TerminalApp })));
const DiscoverApp = lazy(() => import("./apps/DiscoverApp").then((m) => ({ default: m.DiscoverApp })));
const SocialApp = lazy(() => import("./apps/SocialApp").then((m) => ({ default: m.SocialApp })));
const GhostCloudApp = lazy(() => import("./apps/GhostCloudApp").then((m) => ({ default: m.GhostCloudApp })));
const GhostAnimeApp = lazy(() => import("./apps/GhostAnimeApp").then((m) => ({ default: m.GhostAnimeApp })));

const APP_RENDER: Record<AppId, () => React.ReactElement> = {
  games: () => <GamesApp />,
  movies: () => <MoviesApp />,
  music: () => <MusicApp />,
  ghostai: () => <GhostAIApp />,
  browser: () => <BrowserApp />,
  discover: () => <DiscoverApp />,
  ghostcloud: () => <GhostCloudApp />,
  ghostanime: () => <GhostAnimeApp />,
  x: () => <SocialApp kind="x" />,
  tiktok: () => <SocialApp kind="tiktok" />,
  pinterest: () => <SocialApp kind="pinterest" />,
  chat: () => <GhostChatApp />,
  store: () => <StoreApp />,
  settings: () => <SettingsApp />,
  files: () => <FilesApp />,
  notes: () => <NotesApp />,
  terminal: () => <TerminalApp />,
};

function AppLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.35em] text-fuchsia-200/70">
        <span className="h-2 w-2 rounded-full bg-fuchsia-400 animate-ghost-pulse" />
        LOADING
      </div>
    </div>
  );
}

export function Desktop() {
  const { windows, wallpaper, wallpaperId, hasFullscreen, locked } = useGhost();
  const activeWallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === wallpaperId),
    [wallpaperId]
  );
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  useEffect(() => {
    // Throttle parallax updates to one per animation frame.
    let raf = 0;
    let nx = 0, ny = 0;
    const flush = () => { px.set(nx); py.set(ny); raf = 0; };
    const onMove = (e: MouseEvent) => {
      nx = (e.clientX / window.innerWidth - 0.5) * 2;
      ny = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [px, py]);

  // Suppress heavy ambient effects while locked or fullscreen for smoother perf.
  const showAmbient = !hasFullscreen && !locked;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper }}>
      <AnimatedWallpaperLayer wallpaper={activeWallpaper} />

      <AnimatePresence>
        {showAmbient && (
          <motion.div key="ambient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 pointer-events-none will-change-transform">
            <motion.div className="absolute -inset-20"
              style={{ x: px, y: py, background: "radial-gradient(ellipse 40% 35% at 20% 30%, rgba(168,85,247,.45), transparent 60%), radial-gradient(ellipse 35% 30% at 80% 70%, rgba(59,130,246,.35), transparent 60%)" }} />
            <motion.div className="absolute -inset-10 mix-blend-screen"
              style={{ x: px, y: py, scale: 1.05, background: "radial-gradient(ellipse 30% 25% at 70% 20%, rgba(236,72,153,.25), transparent 60%)" }}
              animate={{ opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(168,85,247,.25), transparent 60%)" }} />
            <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent animate-scan" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasFullscreen && !locked && (
          <motion.div
            key="chrome"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
          >
            <MenuBar />
            <DesktopIcons />
            <OnlineStatus />
            <FpsMonitor />
            <NotificationCenter />
            <Dock />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {windows.map((w) => (
          <Window key={w.id} win={w}>
            <Suspense fallback={<AppLoading />}>{APP_RENDER[w.appId]()}</Suspense>
          </Window>
        ))}
      </AnimatePresence>

      <AppLauncher />
      <LockScreen />
      <DesktopContextMenu />
      <GhostDrop />
    </div>
  );
}
