import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Suspense, lazy, useEffect, useMemo } from "react";
import { useGhost, WALLPAPERS } from "./store";
import { AnimatedWallpaperLayer } from "./AnimatedWallpaperLayer";
import { Dock } from "./Dock";
import { SystemTray } from "./SystemTray";
import { Window } from "./Window";
import { NotificationCenter } from "./NotificationCenter";
import { AppLauncher } from "./AppLauncher";
import { LockScreen } from "./LockScreen";
import { DesktopContextMenu } from "./DesktopContextMenu";
import { GhostDrop } from "./GhostDrop";
import { ControlCenter } from "./ControlCenter";
import { NowPlayingWidget } from "./NowPlayingWidget";
import { DesktopIcons } from "./DesktopIcons";
import { DesktopClock } from "./DesktopClock";
import { WallpaperPicker } from "./WallpaperPicker";
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
const MinecraftApp = lazy(() => import("./apps/MinecraftApp").then((m) => ({ default: m.MinecraftApp })));
const StoreApp = lazy(() => import("./apps/StoreApp").then((m) => ({ default: m.StoreApp })));
const NotesApp = lazy(() => import("./apps/NotesApp").then((m) => ({ default: m.NotesApp })));
const CalendarApp = lazy(() => import("./apps/CalendarApp").then((m) => ({ default: m.CalendarApp })));
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
  calendar: () => <CalendarApp />,
  terminal: () => <TerminalApp />,
  minecraft: () => <MinecraftApp />,
};

function AppLoading() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/35">
        <span className="h-2 w-2 rounded-full bg-[var(--ice)] animate-ghost-pulse" />
        LOADING
      </div>
    </div>
  );
}

export function Desktop() {
  const { windows, wallpaper, wallpaperId, hasFullscreen, locked, settings, toggleLauncher } = useGhost();

  // Ctrl+K / Cmd+K opens Ghost Search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleLauncher();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleLauncher]);

  const activeWallpaper = useMemo(
    () => WALLPAPERS.find((w) => w.id === wallpaperId),
    [wallpaperId]
  );
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const parallax = settings.motionEffects;

  useEffect(() => {
    if (!parallax) return;
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
  }, [px, py, parallax]);

  // Opening an app can autofocus an input and make the browser scroll the page/root
  // container. Keep the desktop pinned at the top-left.
  useEffect(() => {
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById("root");
      if (root) { root.scrollTop = 0; root.scrollLeft = 0; }
    };
    const raf = requestAnimationFrame(reset);
    const t = setTimeout(reset, 260);
    window.addEventListener("scroll", reset, { passive: true });
    return () => { cancelAnimationFrame(raf); clearTimeout(t); window.removeEventListener("scroll", reset); };
  }, [windows.length]);

  // Suppress heavy ambient effects while locked or fullscreen for smoother perf.
  const showAmbient = !hasFullscreen && !locked && settings.wallpaperEffects;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper }}>
      <AnimatedWallpaperLayer wallpaper={activeWallpaper} />

      <AnimatePresence>
        {showAmbient && (
          <motion.div key="ambient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 pointer-events-none will-change-transform">
            <motion.div className="absolute -inset-20"
              style={{ x: px, y: py, background: "radial-gradient(ellipse 45% 40% at 18% 22%, rgba(102,217,255,.12), transparent 62%), radial-gradient(ellipse 40% 35% at 82% 78%, rgba(140,170,210,.09), transparent 62%)" }} />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(102,217,255,.07), transparent 60%)" }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!hasFullscreen && !locked && (
          <motion.div
            key="chrome"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <DesktopClock />
            <NotificationCenter />
            <Dock />
            <SystemTray />
            <NowPlayingWidget />
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

      <DesktopIcons />
      <WallpaperPicker />
      <AppLauncher />
      <LockScreen />
      <DesktopContextMenu />
      <GhostDrop />
      <ControlCenter />
    </div>
  );
}
