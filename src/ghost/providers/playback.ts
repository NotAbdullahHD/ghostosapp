// GhostFlix modular playback provider system.
// Each provider is an independent module. Providers can be added, removed,
// reordered, or replaced without changing the GhostFlix UI.
//
// Contract:
//   resolve(movie) -> { ok: true, url, sandbox?, allow?, timeoutMs? }
//                   | { ok: false, fallback: boolean, message: string }
//
// The player asks the current provider for a URL. If the provider rejects
// with `fallback: true`, the player automatically walks to the next enabled
// provider. If none succeed, a clean GhostOS error screen is shown.

import { proxify } from "../proxy";

export interface PlaybackRequest {
  imdbID: string;
  title: string;
  year?: string;
}

export interface PlaybackResolved {
  ok: true;
  url: string;
  /** Iframe sandbox override — optional. */
  sandbox?: string;
  /** Iframe allow override — optional. */
  allow?: string;
  /** Per-provider load timeout (ms). */
  timeoutMs?: number;
}

export interface PlaybackFailure {
  ok: false;
  fallback: boolean;
  message: string;
}

export type PlaybackResult = PlaybackResolved | PlaybackFailure;

export interface PlaybackProvider {
  id: string;
  label: string;
  description: string;
  resolve(req: PlaybackRequest): Promise<PlaybackResult>;
}

// ---------------------------------------------------------------------------
// TMDB lookup (needed for providers that only accept TMDB IDs, e.g. toustream).
// Cached, best-effort, degrades gracefully.
// ---------------------------------------------------------------------------
const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const tmdbCache = new Map<string, string | null>();

async function imdbToTmdb(imdbID: string): Promise<string | null> {
  if (tmdbCache.has(imdbID)) return tmdbCache.get(imdbID) ?? null;
  const url = `https://api.themoviedb.org/3/find/${encodeURIComponent(
    imdbID,
  )}?api_key=${TMDB_KEY}&external_source=imdb_id`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const json = (await res.json()) as {
      movie_results?: { id?: number }[];
    };
    const id = json?.movie_results?.[0]?.id;
    const tmdb = id ? String(id) : null;
    tmdbCache.set(imdbID, tmdb);
    return tmdb;
  } catch {
    // Try proxied path once — some networks block TMDB directly.
    try {
      const res = await fetch(proxify(url));
      const json = (await res.json()) as { movie_results?: { id?: number }[] };
      const id = json?.movie_results?.[0]?.id;
      const tmdb = id ? String(id) : null;
      tmdbCache.set(imdbID, tmdb);
      return tmdb;
    } catch {
      tmdbCache.set(imdbID, null);
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const vidsrcTo: PlaybackProvider = {
  id: "vidsrc-to",
  label: "VidSrc.to",
  description: "High-availability relay with multiple mirrors.",
  async resolve({ imdbID }) {
    return {
      ok: true,
      url: `https://vidsrc.to/embed/movie/${encodeURIComponent(imdbID)}`,
    };
  },
};

const vidsrcXyz: PlaybackProvider = {
  id: "vidsrc-xyz",
  label: "VidSrc.xyz",
  description: "Fast fallback mirror with wide catalogue coverage.",
  async resolve({ imdbID }) {
    return {
      ok: true,
      url: `https://vidsrc.xyz/embed/movie?imdb=${encodeURIComponent(imdbID)}`,
    };
  },
};

const vidlink: PlaybackProvider = {
  id: "vidlink",
  label: "VidLink.pro",
  description: "Clean player, occasional rate limits.",
  async resolve({ imdbID }) {
    return {
      ok: true,
      url: `https://vidlink.pro/movie/${encodeURIComponent(imdbID)}`,
    };
  },
};

const twoEmbed: PlaybackProvider = {
  id: "2embed",
  label: "2Embed",
  description: "Broad catalogue, works well as final fallback.",
  async resolve({ imdbID }) {
    return {
      ok: true,
      url: `https://www.2embed.cc/embed/${encodeURIComponent(imdbID)}`,
    };
  },
};

const toustream: PlaybackProvider = {
  id: "toustream",
  label: "Toustream",
  description: "TMDB-based stream, routed via NET22 relay.",
  async resolve({ imdbID, title }) {
    const tmdb = await imdbToTmdb(imdbID);
    if (!tmdb) {
      return {
        ok: false,
        fallback: true,
        message: `No TMDB match for ${title}.`,
      };
    }
    const target = `https://toustream.xyz/tou/movies/${encodeURIComponent(tmdb)}`;
    return {
      ok: true,
      // Route through the GhostOS proxy so mixed-origin / referrer checks
      // don't block the embed.
      url: proxify(target),
      timeoutMs: 16_000,
    };
  },
};

// Ordered list — first entry is the default. Order can be customized per user.
export const ALL_PROVIDERS: PlaybackProvider[] = [
  vidsrcTo,
  vidsrcXyz,
  vidlink,
  toustream,
  twoEmbed,
];

// ---------------------------------------------------------------------------
// User preferences (persisted).
// ---------------------------------------------------------------------------
const PREF_KEY = "ghostflix.providers.v1";

export interface ProviderPrefs {
  /** Ordered provider IDs. First is preferred. Unknown IDs ignored. */
  order: string[];
  /** IDs the user has explicitly disabled. */
  disabled: string[];
}

export function loadProviderPrefs(): ProviderPrefs {
  if (typeof window === "undefined") return { order: [], disabled: [] };
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return { order: [], disabled: [] };
    const parsed = JSON.parse(raw) as Partial<ProviderPrefs>;
    return {
      order: Array.isArray(parsed.order) ? parsed.order.filter((x) => typeof x === "string") : [],
      disabled: Array.isArray(parsed.disabled) ? parsed.disabled.filter((x) => typeof x === "string") : [],
    };
  } catch {
    return { order: [], disabled: [] };
  }
}

export function saveProviderPrefs(prefs: ProviderPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}

/** Ordered enabled providers according to user preference. */
export function orderedProviders(prefs: ProviderPrefs = loadProviderPrefs()): PlaybackProvider[] {
  const byId = new Map(ALL_PROVIDERS.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const out: PlaybackProvider[] = [];
  for (const id of prefs.order) {
    const p = byId.get(id);
    if (p && !seen.has(id)) {
      out.push(p);
      seen.add(id);
    }
  }
  for (const p of ALL_PROVIDERS) {
    if (!seen.has(p.id)) out.push(p);
  }
  return out.filter((p) => !prefs.disabled.includes(p.id));
}
