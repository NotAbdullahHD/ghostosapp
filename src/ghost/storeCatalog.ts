import type { AppId } from "./apps";
import minecraftAsset from "@/assets/minecraft.html.asset.json";

/**
 * Ghost Store catalog architecture.
 *
 * A listing describes something installable into GhostOS. Today only first-party
 * listings exist, but the shape is deliberately future-proof:
 *  - `publisher` + `verified` support third-party developers later.
 *  - `permissions` maps onto the future GhostOS App API.
 *  - `delivery` describes how the payload is mounted (native app, packaged HTML,
 *    or appearance content such as themes / wallpapers / icon packs).
 */

export type StoreCategoryId = "games" | "apps" | "utilities" | "themes";

export interface StoreCategory {
  id: StoreCategoryId;
  name: string;
  tagline: string;
  /** Sub-shelves used to organise a category as it grows. */
  shelves: string[];
}

export const STORE_CATEGORIES: StoreCategory[] = [
  { id: "games", name: "Games", tagline: "Play natively inside GhostOS.", shelves: ["Featured", "Sandbox", "Arcade", "Multiplayer"] },
  { id: "apps", name: "Apps", tagline: "Full applications built for GhostOS.", shelves: ["Featured", "Social", "Media", "Productivity"] },
  { id: "utilities", name: "Utilities", tagline: "Small tools that sharpen the system.", shelves: ["System", "Network", "Developer"] },
  { id: "themes", name: "Themes", tagline: "Make GhostOS yours.", shelves: ["Themes", "Wallpapers", "Icon Packs", "Fonts", "Sound Packs", "Cursor Packs", "Window Styles"] },
];

/** Future GhostOS App API surface. Declared now, enforced later. */
export type GhostPermission =
  | "notifications"
  | "file-types"
  | "context-menu"
  | "windows"
  | "widgets"
  | "storage"
  | "network";

export const PERMISSION_LABELS: Record<GhostPermission, string> = {
  notifications: "Send notifications",
  "file-types": "Register file types",
  "context-menu": "Add right-click actions",
  windows: "Open custom windows",
  widgets: "Create widgets",
  storage: "Store local data",
  network: "Access the network",
};

export type Delivery =
  | { kind: "native"; appId: AppId }
  | { kind: "packaged-html"; appId: AppId; url: string; sizeBytes: number }
  | { kind: "appearance"; assetType: "theme" | "wallpaper" | "icon-pack" | "font" | "sound-pack" | "cursor-pack" | "window-style" };

export interface StoreListing {
  id: string;
  name: string;
  tagline: string;
  description: string;
  publisher: string;
  verified: boolean;
  firstParty: boolean;
  category: StoreCategoryId;
  shelf: string;
  version: string;
  updated: string;
  rating: number;
  ratingCount: number;
  ageRating: string;
  permissions: GhostPermission[];
  delivery: Delivery;
  /** Visual identity — a listing can ship an image, otherwise the system icon is used. */
  iconUrl?: string;
  heroCss: string;
  screenshots: { label: string; css: string }[];
  requirements: { label: string; value: string }[];
  changelog: { version: string; date: string; notes: string[] }[];
}

/** Absolute origin so the packaged client also loads on external deployments. */
export const MINECRAFT_URL = `https://ghostosapp.lovable.app${minecraftAsset.url}`;
export const ROBLOX_URL = "https://nowgg.fun/apps/a/19900/b.html";

export const STORE_LISTINGS: StoreListing[] = [
  {
    id: "minecraft-launcher",
    name: "Minecraft Launcher",
    tagline: "The full 1.8 client, running natively in GhostOS.",
    description:
      "A complete offline-signed Minecraft 1.8 client packaged as a GhostOS application. Singleplayer worlds, multiplayer servers, resource packs and skins all run inside a normal GhostOS window — no downloads, no installers, no Java. Worlds are stored locally on this device and survive reboots.",
    publisher: "GhostOS Labs",
    verified: true,
    firstParty: true,
    category: "games",
    shelf: "Sandbox",
    version: "1.8 · u53",
    updated: "Aug 2026",
    rating: 4.8,
    ratingCount: 1284,
    ageRating: "7+",
    permissions: ["windows", "storage", "network"],
    delivery: { kind: "packaged-html", appId: "minecraft", url: MINECRAFT_URL, sizeBytes: 18002822 },
    heroCss: "linear-gradient(135deg,#0d1a10 0%,#12301c 45%,#0a0f0c 100%)",
    screenshots: [
      { label: "Survival", css: "linear-gradient(160deg,#14361f,#0b1a11)" },
      { label: "Multiplayer", css: "linear-gradient(160deg,#123049,#0a1620)" },
      { label: "Creative", css: "linear-gradient(160deg,#3a2f10,#1a1508)" },
      { label: "Worlds", css: "linear-gradient(160deg,#2a1236,#130a1a)" },
    ],
    requirements: [
      { label: "GhostOS", value: "3.0 or later" },
      { label: "Graphics", value: "WebGL 2.0" },
      { label: "Memory", value: "2 GB free" },
      { label: "Storage", value: "18 MB packaged + world data" },
      { label: "Network", value: "Optional (multiplayer only)" },
    ],
    changelog: [
      { version: "1.8 · u53", date: "Aug 2026", notes: ["Packaged as a native GhostOS application", "Window, fullscreen and pointer-lock support", "Local world storage persists between sessions"] },
      { version: "1.8 · u52", date: "Jul 2026", notes: ["Rendering stability fixes", "Improved server connection handling"] },
    ],
  },
  {
    id: "roblox",
    name: "Roblox",
    tagline: "Cloud-streamed Roblox inside a GhostOS window.",
    description:
      "Roblox streamed from the cloud — no install, no downloads. Because the game is streamed, it needs a fast and stable connection; on slow networks it can stay on the loading screen.",
    publisher: "now.gg",
    verified: false,
    firstParty: false,
    category: "games",
    shelf: "Multiplayer",
    version: "Cloud",
    updated: "Oct 2026",
    rating: 4.5,
    ratingCount: 0,
    ageRating: "Varies",
    permissions: ["windows", "network"],
    delivery: { kind: "native", appId: "roblox" },
    heroCss: "linear-gradient(135deg,#17181c 0%,#2a2c33 50%,#0d0e10 100%)",
    screenshots: [
      { label: "Experiences", css: "linear-gradient(160deg,#2a2c33,#111215)" },
      { label: "Avatar", css: "linear-gradient(160deg,#1d2a3a,#0c1118)" },
    ],
    requirements: [
      { label: "Network", value: "Fast connection (10 Mbps+)" },
      { label: "Input", value: "Keyboard & mouse" },
    ],
    changelog: [{ version: "Cloud", date: "Oct 2026", notes: ["Added to GhostOS Store"] }],
  },
];

export function listingsFor(category: StoreCategoryId) {
  return STORE_LISTINGS.filter((l) => l.category === category);
}
