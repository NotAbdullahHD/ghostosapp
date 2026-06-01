export type AppId =
  | "games" | "movies" | "music" | "ghostai" | "browser" | "discover" | "ghostcloud" | "ghostanime"
  | "x" | "tiktok" | "pinterest"
  | "chat" | "store" | "settings" | "files" | "notes" | "terminal";

export interface AppDef {
  id: AppId;
  name: string;
  icon: string;
  accent: string;
  description: string;
}

export const APPS: AppDef[] = [
  { id: "games",      name: "Games",      icon: "▣", accent: "from-fuchsia-500 via-pink-500 to-rose-600", description: "Arcade hub" },
  { id: "ghostcloud", name: "GhostCloud", icon: "☁", accent: "from-violet-500 via-fuchsia-600 to-pink-600", description: "Cloud gaming" },
  { id: "ghostanime", name: "GhostAnime", icon: "❄", accent: "from-pink-400 via-fuchsia-500 to-indigo-700", description: "Anime stream" },
  { id: "ghostai",    name: "GhostAI",    icon: "✦", accent: "from-violet-500 to-indigo-700",            description: "Neural assistant" },
  { id: "browser",    name: "Browser",    icon: "◐", accent: "from-cyan-400 to-blue-700",                description: "Spectre browser" },
  { id: "discover",   name: "Discover",   icon: "◉", accent: "from-purple-500 to-fuchsia-800",           description: "Hidden internet" },
  { id: "movies",     name: "Netflix",    icon: "▶", accent: "from-red-500 to-orange-700",               description: "GhostFlix" },
  { id: "music",      name: "Music",      icon: "♪", accent: "from-emerald-400 to-teal-700",             description: "Sound matrix" },
  { id: "x",          name: "X",          icon: "𝕏", accent: "from-zinc-700 to-black",                   description: "Signal feed" },
  { id: "tiktok",     name: "TikTok",     icon: "♫", accent: "from-pink-500 to-cyan-500",                description: "Loop reels" },
  { id: "pinterest",  name: "Pinterest",  icon: "◔", accent: "from-rose-500 to-red-700",                 description: "Visual mood" },
  { id: "chat",       name: "Chat",       icon: "✉", accent: "from-sky-400 to-indigo-700",               description: "Global chat" },
  { id: "store",      name: "Store",      icon: "◈", accent: "from-amber-400 to-orange-700",             description: "App store" },
  { id: "files",      name: "Files",      icon: "▤", accent: "from-lime-400 to-emerald-700",             description: "Encrypted vault" },
  { id: "notes",      name: "Notes",      icon: "✎", accent: "from-yellow-300 to-amber-600",             description: "Quick notes" },
  { id: "terminal",   name: "Terminal",   icon: "❯", accent: "from-slate-300 to-slate-600",              description: "Spectral shell" },
  { id: "settings",   name: "Settings",   icon: "⚙", accent: "from-zinc-400 to-zinc-700",                description: "System config" },
];
