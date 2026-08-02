import type { AppId } from "./apps";
import {
  Gamepad2, Cloud, Sparkles, Bot, Globe, Compass, Clapperboard, Music4,
  MessageSquareText, Store, Folder, StickyNote, CalendarDays, TerminalSquare,
  Settings2, Video, Image as ImageIcon,
} from "lucide-react";

const ICONS: Record<AppId, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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
};

function XGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.9 21H2.87l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.81L16.47 19.2Z" />
    </svg>
  );
}

/** Tile background per app — muted Obsidian surfaces with a single tinted light. */
const TINTS: Record<AppId, string> = {
  games: "rgba(102,217,255,.9)",
  ghostcloud: "rgba(140,190,255,.9)",
  ghostanime: "rgba(190,160,255,.9)",
  ghostai: "rgba(102,217,255,.9)",
  browser: "rgba(110,205,255,.9)",
  discover: "rgba(160,180,255,.9)",
  movies: "rgba(255,120,110,.9)",
  music: "rgba(120,230,190,.9)",
  x: "rgba(235,235,240,.9)",
  tiktok: "rgba(255,140,190,.9)",
  pinterest: "rgba(255,120,120,.9)",
  chat: "rgba(120,220,150,.9)",
  store: "rgba(255,196,110,.9)",
  files: "rgba(255,210,120,.9)",
  notes: "rgba(255,225,140,.9)",
  calendar: "rgba(255,150,150,.9)",
  terminal: "rgba(200,210,225,.9)",
  settings: "rgba(190,200,215,.9)",
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
  const Icon = ICONS[id];
  const tint = TINTS[id] ?? "rgba(102,217,255,.9)";
  const r = radius ?? Math.round(size * 0.28);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background:
          "linear-gradient(160deg, #26262b 0%, #17171a 55%, #101013 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,.14), inset 0 -1px 0 rgba(0,0,0,.6), 0 10px 24px -12px rgba(0,0,0,.9)",
      }}
    >
      {/* tinted top light */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% -20%, ${tint.replace(",.9)", ",.20)")}, transparent 65%)`,
        }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: r, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.07)" }}
      />
      <Icon
        className="relative"
        strokeWidth={1.7}
        {...{ style: { width: size * 0.5, height: size * 0.5, color: tint } as never }}
      />
    </div>
  );
}
