export type AppId =
  | "games" | "movies" | "music" | "ghostai" | "browser" | "discover" | "ghostcloud" | "ghostanime"
  | "x" | "tiktok" | "pinterest"
  | "chat" | "store" | "settings" | "files" | "notes" | "calendar" | "terminal";

export interface AppDef {
  id: AppId;
  name: string;
  icon: string;
  accent: string;
  description: string;
}

export const APPS: AppDef[] = [
  { id: "games",      name: "Games",      icon: "▣", accent: "from-zinc-800 to-zinc-900", description: "Arcade hub" },
  { id: "ghostcloud", name: "GhostCloud", icon: "☁", accent: "from-zinc-800 to-zinc-900", description: "Cloud gaming" },
  { id: "ghostanime", name: "GhostAnime", icon: "❄", accent: "from-zinc-800 to-zinc-900", description: "Anime stream" },
  { id: "ghostai",    name: "GhostAI",    icon: "✦", accent: "from-zinc-800 to-zinc-900", description: "Neural assistant" },
  { id: "browser",    name: "Browser",    icon: "◐", accent: "from-zinc-800 to-zinc-900", description: "Spectre browser" },
  { id: "discover",   name: "Discover",   icon: "◉", accent: "from-zinc-800 to-zinc-900", description: "Hidden internet" },
  { id: "movies",     name: "GhostFlix",  icon: "▶", accent: "from-zinc-800 to-zinc-900", description: "Movies & shows" },
  { id: "music",      name: "Music",      icon: "♪", accent: "from-zinc-800 to-zinc-900", description: "Sound matrix" },
  { id: "x",          name: "X",          icon: "𝕏", accent: "from-zinc-800 to-zinc-900", description: "Signal feed" },
  { id: "tiktok",     name: "TikTok",     icon: "♫", accent: "from-zinc-800 to-zinc-900", description: "Loop reels" },
  { id: "pinterest",  name: "Pinterest",  icon: "◔", accent: "from-zinc-800 to-zinc-900", description: "Visual mood" },
  { id: "chat",       name: "GhostChat",  icon: "✉", accent: "from-zinc-800 to-zinc-900", description: "Messages & calls" },
  { id: "store",      name: "Store",      icon: "◈", accent: "from-zinc-800 to-zinc-900", description: "App store" },
  { id: "files",      name: "Files",      icon: "▤", accent: "from-zinc-800 to-zinc-900", description: "Encrypted vault" },
  { id: "notes",      name: "Notes",      icon: "✎", accent: "from-zinc-800 to-zinc-900", description: "Quick notes" },
  { id: "calendar",   name: "Calendar",   icon: "◪", accent: "from-zinc-800 to-zinc-900", description: "Schedule & events" },
  { id: "terminal",   name: "Terminal",   icon: "❯", accent: "from-zinc-800 to-zinc-900", description: "Spectral shell" },
  { id: "settings",   name: "Settings",   icon: "⚙", accent: "from-zinc-800 to-zinc-900", description: "System config" },
];
