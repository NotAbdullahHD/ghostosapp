import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useEffect } from "react";
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
import { GamesApp } from "./apps/GamesApp";
import { MoviesApp } from "./apps/MoviesApp";
import { GhostAIApp } from "./apps/GhostAIApp";
import { BrowserApp } from "./apps/BrowserApp";
import { SettingsApp } from "./apps/SettingsApp";
import { FilesApp } from "./apps/FilesApp";
import { MusicApp } from "./apps/MusicApp";
import { ChatApp } from "./apps/ChatApp";
import { StoreApp } from "./apps/StoreApp";
import { NotesApp } from "./apps/NotesApp";
import { TerminalApp } from "./apps/TerminalApp";
import { DiscoverApp } from "./apps/DiscoverApp";
import { SocialApp } from "./apps/SocialApp";
import { GhostCloudApp } from "./apps/GhostCloudApp";
import { GhostAnimeApp } from "./apps/GhostAnimeApp";
import { DesktopContextMenu } from "./DesktopContextMenu";
import type { AppId } from "./apps";

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
  chat: () => <ChatApp />,
  store: () => <StoreApp />,
  settings: () => <SettingsApp />,
  files: () => <FilesApp />,
  notes: () => <NotesApp />,
  terminal: () => <TerminalApp />,
};

export function Desktop() {
  const { windows, wallpaper, wallpaperId, hasFullscreen } = useGhost();
  const activeWallpaper = WALLPAPERS.find((w) => w.id === wallpaperId);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      px.set(x); py.set(y);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [px, py]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper }}>
      <AnimatedWallpaperLayer wallpaper={activeWallpaper} />

      <AnimatePresence>
        {!hasFullscreen && (
          <motion.div key="ambient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 pointer-events-none">
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
        {!hasFullscreen && (
          <motion.div key="chrome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.25 } }} transition={{ duration: 0.4 }}>
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
          <Window key={w.id} win={w}>{APP_RENDER[w.appId]()}</Window>
        ))}
      </AnimatePresence>

      <AppLauncher />
      <LockScreen />
      <DesktopContextMenu />
    </div>
  );
}
