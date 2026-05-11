export type AppId = "games" | "movies" | "ghostai" | "browser" | "settings" | "files";

export interface AppDef {
  id: AppId;
  name: string;
  icon: string; // emoji/glyph
  accent: string;
  description: string;
}

export const APPS: AppDef[] = [
  { id: "ghostai", name: "GhostAI", icon: "✦", accent: "from-fuchsia-500 to-violet-600", description: "Neural assistant" },
  { id: "browser", name: "Spectre", icon: "◐", accent: "from-cyan-400 to-blue-600", description: "Quantum browser" },
  { id: "games", name: "Arcade", icon: "▣", accent: "from-pink-500 to-rose-600", description: "Game launcher" },
  { id: "movies", name: "Cinema", icon: "▶", accent: "from-red-500 to-orange-600", description: "Stream hub" },
  { id: "settings", name: "Settings", icon: "⚙", accent: "from-slate-400 to-slate-600", description: "System config" },
  { id: "files", name: "Vault", icon: "▤", accent: "from-emerald-400 to-teal-600", description: "Encrypted files" },
];
