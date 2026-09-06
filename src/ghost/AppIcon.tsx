import type { AppId } from "./apps";
import {
  Gamepad2, Cloud, Sparkles, Bot, Globe, Compass, Clapperboard, Music4,
  MessageSquareText, Store, Folder, StickyNote, CalendarDays, TerminalSquare,
  Settings2, Video, Image as ImageIcon, Pickaxe, type LucideProps,
} from "lucide-react";

function XGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.9 21H2.87l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.81L16.47 19.2Z" />
    </svg>
  );
}



/** Real app artwork (macOS-style icon set) — takes priority over the glyph tiles. */
const ART: Partial<Record<AppId, string>> = {
  browser: "/icons/browser.png",
  ghostai: "/icons/ghostai.png",
  ghostcloud: "/icons/ghostcloud.png",
  ghostanime: "/icons/ghostanime.png",
  chat: "/icons/chat.png",
  files: "/icons/files.png",
  games: "/icons/games.png",
  movies: "/icons/movies.png",
  music: "/icons/music.png",
  settings: "/icons/settings.png",
  store: "/icons/store.png",
  terminal: "/icons/terminal.png",
  x: "/icons/x.png",
  notes: "/icons/notes.png",
  calendar: "/icons/calendar.png",
  tiktok: "/icons/tiktok.png",
  pinterest: "/icons/pinterest.png",
};

type IconCmp = React.ComponentType<LucideProps> | typeof XGlyph;

const ICONS: Record<AppId, IconCmp> = {
  games: Gamepad2,
  ghostcloud: Cloud,
  ghostanime: Sparkles,
  ghostai: Bot,
  browser: Globe,
  discover: Compass,
  movies: Clapperboard,
  music: Music4,
  x: XGlyph,
  tiktok: Video,
  pinterest: ImageIcon,
  chat: MessageSquareText,
  store: Store,
  files: Folder,
  notes: StickyNote,
  calendar: CalendarDays,
  terminal: TerminalSquare,
  settings: Settings2,
  minecraft: Pickaxe,
};

/** Single tinted light per app on a graphite Obsidian tile. */
const TINTS: Record<AppId, [number, number, number]> = {
  games: [102, 217, 255],
  ghostcloud: [140, 190, 255],
  ghostanime: [190, 160, 255],
  ghostai: [102, 217, 255],
  browser: [110, 205, 255],
  discover: [160, 180, 255],
  movies: [255, 120, 110],
  music: [120, 230, 190],
  x: [235, 235, 240],
  tiktok: [255, 140, 190],
  pinterest: [255, 120, 120],
  chat: [120, 220, 150],
  store: [255, 196, 110],
  files: [255, 210, 120],
  notes: [255, 225, 140],
  calendar: [255, 150, 150],
  terminal: [200, 210, 225],
  settings: [190, 200, 215],
  minecraft: [126, 217, 140],
};

export function AppIcon({
  id,
  size = 48,
  radius,
  className = "",
}: {
  id: AppId;
  size?: number;
  radius?: number;
  className?: string;
}) {
  const art = ART[id];
  if (art) {
    return (
      <img
        src={art}
        alt=""
        draggable={false}
        className={`select-none object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const Icon = ICONS[id] as React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>;
  const [r0, g0, b0] = TINTS[id] ?? [102, 217, 255];
  const tint = `rgb(${r0} ${g0} ${b0})`;
  const r = radius ?? Math.round(size * 0.28);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(160deg, #26262b 0%, #17171a 55%, #101013 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.6), 0 10px 24px -12px rgba(0,0,0,.9)",
      }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 80% at 50% -20%, rgba(${r0},${g0},${b0},.20), transparent 65%)` }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)" }}
      />
      <Icon
        className="relative"
        strokeWidth={1.7}
        style={{ width: size * 0.5, height: size * 0.5, color: tint }}
      />
    </div>
  );
}
