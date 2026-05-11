import { AnimatePresence } from "framer-motion";
import { useGhost } from "./store";
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
import type { AppId } from "./apps";

const APP_RENDER: Record<AppId, () => React.ReactElement> = {
  games: () => <GamesApp />,
  movies: () => <MoviesApp />,
  ghostai: () => <GhostAIApp />,
  browser: () => <BrowserApp />,
  settings: () => <SettingsApp />,
  files: () => <FilesApp />,
};

export function Desktop() {
  const { windows, wallpaper } = useGhost();
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: wallpaper }}>
      {/* ambient overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(168,85,247,.25), transparent 60%)" }} />

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
