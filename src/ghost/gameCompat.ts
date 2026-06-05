/**
 * GhostOS Game Compatibility Layer
 * ---------------------------------
 * Validates embed URLs, classifies game launch status, picks the best
 * launch mode (direct vs proxy), and caches results in localStorage so we
 * don't retest known broken games.
 *
 * Status meaning:
 *   "verified"      🟢 plays direct
 *   "proxy"         🟡 only works through proxy
 *   "broken"        🔴 fails both direct and proxy
 *   "unknown"       ⚪ not yet validated
 */

import { proxify, GHOST_PROXY } from "./proxy";

export type GameStatus = "verified" | "proxy" | "broken" | "unknown";
export type LaunchMode = "direct" | "proxy";

interface CacheEntry {
  status: GameStatus;
  mode: LaunchMode;
  /** unix ms */
  checkedAt: number;
  /** last error if any */
  error?: string;
}

const CACHE_KEY = "ghost.gamecompat.v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    // prune stale entries
    const now = Date.now();
    for (const k of Object.keys(parsed)) {
      if (now - parsed[k].checkedAt > CACHE_TTL_MS) delete parsed[k];
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota — ignore */
  }
}

let memCache: Record<string, CacheEntry> | null = null;
function cache(): Record<string, CacheEntry> {
  if (!memCache) memCache = loadCache();
  return memCache;
}

export function keyFor(game: { title: string; embed: string }): string {
  return `${game.title}::${game.embed}`;
}

export function getCachedStatus(game: { title: string; embed: string }): CacheEntry | undefined {
  return cache()[keyFor(game)];
}

export function setCachedStatus(
  game: { title: string; embed: string },
  patch: Partial<CacheEntry> & { status: GameStatus; mode: LaunchMode }
) {
  const c = cache();
  c[keyFor(game)] = { checkedAt: Date.now(), ...patch };
  saveCache(c);
}

export function markVerified(game: { title: string; embed: string }, mode: LaunchMode) {
  setCachedStatus(game, { status: mode === "proxy" ? "proxy" : "verified", mode });
}

export function markBroken(game: { title: string; embed: string }, error?: string) {
  setCachedStatus(game, { status: "broken", mode: "direct", error });
}

/** Basic URL sanity check — protocol must be http(s) and host must parse. */
export function isValidEmbed(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.host) return false;
    return true;
  } catch {
    return false;
  }
}

/** Detect mixed-content: page is https but embed is http. */
export function isMixedContent(url: string): boolean {
  try {
    const u = new URL(url);
    return window.location.protocol === "https:" && u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Pick best initial launch mode based on cache + URL heuristics.
 * - Cached preference always wins.
 * - Mixed-content → proxy.
 * - Otherwise → direct (most embed providers allow iframes).
 */
export function pickLaunchMode(game: { title: string; embed: string }): LaunchMode {
  const c = getCachedStatus(game);
  if (c && c.status !== "broken") return c.mode;
  if (isMixedContent(game.embed)) return "proxy";
  return "direct";
}

/** Build the iframe src for the chosen mode. */
export function buildSrc(embed: string, mode: LaunchMode): string {
  if (mode === "proxy") return proxify(embed);
  return embed;
}

/**
 * Background HEAD/GET probe via proxy to validate reachability.
 * Returns true if the embed responded with a non-error status.
 * Best-effort — many providers block HEAD; we treat opaque/network errors as inconclusive (true).
 */
export async function probeReachable(embed: string, signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(`${GHOST_PROXY}?url=${encodeURIComponent(embed)}`, {
      method: "GET",
      mode: "cors",
      redirect: "follow",
      signal,
    });
    if (res.status === 404 || res.status === 410 || res.status === 403) return false;
    return true;
  } catch {
    // Network/CORS error from probe doesn't mean the iframe will fail — be lenient.
    return true;
  }
}

/** Get a list of titles known to be broken (for filtering Featured/Trending). */
export function brokenTitles(): Set<string> {
  const out = new Set<string>();
  const c = cache();
  for (const k of Object.keys(c)) {
    if (c[k].status === "broken") out.add(k.split("::")[0]);
  }
  return out;
}

/** Clear status for a single game (used by "Report Issue"/manual recheck). */
export function clearStatus(game: { title: string; embed: string }) {
  const c = cache();
  delete c[keyFor(game)];
  saveCache(c);
}
