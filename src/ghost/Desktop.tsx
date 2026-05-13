import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useEffect } from "react";
import { useGhost, WALLPAPERS } from "./store";
import { AnimatedWallpaperLayer } from "./AnimatedWallpaperLayer";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";
import { Window } from "./Window";
import { DesktopIcons } from "./DesktopIcons";
import { NotificationCenter } from "./NotificationCenter";
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
import type { AppId } from "./apps";

const APP_RENDER: Record<AppId, () => React.ReactElement> = {
  games: () => <GamesApp />,
  movies: () => <MoviesApp />,
  music: () => <MusicApp />,
  ghostai: () => <GhostAIApp />,
  browser: () => <BrowserApp />,
  discover: () => <DiscoverApp />,
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
  const { windows, wallpaper, wallpaperId } = useGhost();
  const activeWallpaper = WALLPAPERS.find((w) => w.id === wallpaperId);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  // parallax tracking
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
      {/* parallax aurora layers */}
      <motion.div className="pointer-events-none absolute -inset-20"
        style={{ x: px, y: py, background: "radial-gradient(ellipse 40% 35% at 20% 30%, rgba(168,85,247,.45), transparent 60%), radial-gradient(ellipse 35% 30% at 80% 70%, rgba(59,130,246,.35), transparent 60%)" }} />
      <motion.div className="pointer-events-none absolute -inset-10 mix-blend-screen"
        style={{ x: px, y: py, scale: 1.05, background: "radial-gradient(ellipse 30% 25% at 70% 20%, rgba(236,72,153,.25), transparent 60%)" }}
        animate={{ opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
      {/* drifting particles */}
      {[...Array(18)].map((_, i) => (
        <motion.span key={i}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-fuchsia-300/60 shadow-[0_0_8px_rgba(232,121,249,.9)]"
          initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, opacity: 0 }}
          animate={{ y: [null, -40 - Math.random() * 80], opacity: [0, 0.7, 0] }}
          transition={{ duration: 8 + Math.random() * 6, repeat: Infinity, delay: Math.random() * 6, ease: "linear" }} />
      ))}
      {/* grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(168,85,247,.25), transparent 60%)" }} />
      {/* scanline */}
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent animate-scan" />

      <MenuBar />
      <DesktopIcons />

      <AnimatePresence>
        {windows.map((w) => (
          <Window key={w.id} win={w}>{APP_RENDER[w.appId]()}</Window>
        ))}
      </AnimatePresence>

      <NotificationCenter />
      <Dock />
    </div>
  );
}
