export type AppId =
  | "games" | "movies" | "music" | "ghostai" | "browser"
  | "chat" | "store" | "settings" | "files" | "notes" | "terminal";

export interface AppDef {
  id: AppId;
  name: string;
  icon: string;
  accent: string;
  description: string;
}

export const APPS: AppDef[] = [
  { id: "games",    name: "Arcade",    icon: "▣", accent: "from-fuchsia-500 via-pink-500 to-rose-600", description: "Game launcher" },
  { id: "ghostai",  name: "GhostAI",   icon: "✦", accent: "from-violet-500 to-indigo-700",            description: "Neural assistant" },
  { id: "browser",  name: "Spectre",   icon: "◐", accent: "from-cyan-400 to-blue-700",                description: "Quantum browser" },
  { id: "movies",   name: "Cinema",    icon: "▶", accent: "from-red-500 to-orange-700",               description: "Stream hub" },
  { id: "music",    name: "Pulse",     icon: "♪", accent: "from-emerald-400 to-teal-700",             description: "Sound matrix" },
  { id: "chat",     name: "Whisper",   icon: "✉", accent: "from-sky-400 to-indigo-700",               description: "Encrypted chat" },
  { id: "store",    name: "Bazaar",    icon: "◈", accent: "from-amber-400 to-orange-700",             description: "App store" },
  { id: "files",    name: "Vault",     icon: "▤", accent: "from-lime-400 to-emerald-700",             description: "Encrypted files" },
  { id: "notes",    name: "Scribe",    icon: "✎", accent: "from-yellow-300 to-amber-600",             description: "Quick notes" },
  { id: "terminal", name: "Shell",     icon: "❯", accent: "from-slate-300 to-slate-600",              description: "Spectral terminal" },
  { id: "settings", name: "Settings",  icon: "⚙", accent: "from-zinc-400 to-zinc-700",                description: "System config" },
];
