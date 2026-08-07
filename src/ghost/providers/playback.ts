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
//
// Audit notes (verified against the live endpoints):
//  - Every host below responds 200 with a real player document and sends NO
//    X-Frame-Options / frame-ancestors header, so embedding is permitted.
//  - These players refuse to run inside a sandboxed frame (they need their own
//    origin for storage + the HLS worker). Providers therefore declare
//    `unsandboxed: true`; the frame is still cross-origin, so it cannot reach
//    GhostOS' DOM, cookies or storage.
//  - vidsrc.xyz / embed.su / moviesapi.club no longer resolve and were removed.

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
  /** Drop the sandbox attribute entirely (provider requires its own origin). */
  unsandboxed?: boolean;
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

const IMDB_RE = /^tt\d{6,}$/;

/** Rejects malformed IDs before we ever build a URL (kills "Invalid URL string"). */
function validImdb(id: string | undefined | null): string | null {
  const clean = (id ?? "").trim();
  return IMDB_RE.test(clean) ? clean : null;
}

/** Final sanity check — never hand a malformed string to an iframe. */
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// TMDB lookup (needed for providers that only accept TMDB IDs).
// Cached, best-effort, degrades gracefully.
// ---------------------------------------------------------------------------
const TMDB_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const tmdbCache = new Map<string, string | null>();

async function imdbToTmdb(imdbID: string): Promise<string | null> {
  if (tmdbCache.has(imdbID)) return tmdbCache.get(imdbID) ?? null;
  const url = `https://api.themoviedb.org/3/find/${encodeURIComponent(
    imdbID,
  )}?api_key=${TMDB_KEY}&external_source=imdb_id`;
  const read = async (target: string) => {
    const res = await fetch(target);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const json = (await res.json()) as { movie_results?: { id?: number }[] };
    const id = json?.movie_results?.[0]?.id;
    return id ? String(id) : null;
  };
  try {
    const tmdb = await read(url);
    tmdbCache.set(imdbID, tmdb);
    return tmdb;
  } catch {
    try {
      // Some networks block TMDB directly — retry through the GhostOS relay.
      const tmdb = await read(proxify(url));
      tmdbCache.set(imdbID, tmdb);
      return tmdb;
    } catch {
      tmdbCache.set(imdbID, null);
      return null;
    }
  }
}

interface Spec {
  id: string;
  label: string;
  description: string;
  kind: "imdb" | "tmdb";
  build: (id: string) => string;
  timeoutMs?: number;
}

function makeProvider(spec: Spec): PlaybackProvider {
  return {
    id: spec.id,
    label: spec.label,
    description: spec.description,
    async resolve({ imdbID, title }) {
      const imdb = validImdb(imdbID);
      if (!imdb) {
        return { ok: false, fallback: false, message: `${title} has no valid IMDb ID — playback unavailable.` };
      }

      let key = imdb;
      if (spec.kind === "tmdb") {
        const tmdb = await imdbToTmdb(imdb);
        if (!tmdb) return { ok: false, fallback: true, message: `No TMDB match for ${title}.` };
        key = tmdb;
      }

      const url = safeUrl(spec.build(encodeURIComponent(key)));
      if (!url) return { ok: false, fallback: true, message: `${spec.label} produced an invalid URL.` };

      return {
        ok: true,
        url,
        unsandboxed: true,
        allow:
          "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; accelerometer; gyroscope",
        timeoutMs: spec.timeoutMs ?? 15_000,
      };
    },
  };
}

// Ordered list — first entry is the default. Order can be customized per user.
export const ALL_PROVIDERS: PlaybackProvider[] = [
  makeProvider({
    id: "vidlink",
    label: "VidLink.pro",
    description: "Primary source. Fast HLS player with wide catalogue coverage.",
    kind: "tmdb",
    build: (id) => `https://vidlink.pro/movie/${id}`,
  }),
  makeProvider({
    id: "videasy",
    label: "Videasy",
    description: "Modern player, strong 1080p availability.",
    kind: "tmdb",
    build: (id) => `https://player.videasy.to/movie/${id}`,
  }),
  makeProvider({
    id: "vidfast",
    label: "VidFast",
    description: "Low-latency mirror with automatic quality switching.",
    kind: "tmdb",
    build: (id) => `https://vidfast.vc/movie/${id}`,
  }),
  makeProvider({
    id: "vidsrc-su",
    label: "VidSrc.su",
    description: "IMDb-native relay, good fallback coverage.",
    kind: "imdb",
    build: (id) => `https://vidsrc.su/embed/movie/${id}`,
  }),
  makeProvider({
    id: "vidsrc-to",
    label: "VidSrc.to",
    description: "High-availability relay with multiple mirrors.",
    kind: "imdb",
    build: (id) => `https://vidsrc.to/embed/movie/${id}`,
  }),
  makeProvider({
    id: "2embed",
    label: "2Embed",
    description: "Broad catalogue, works well as the final fallback.",
    kind: "imdb",
    build: (id) => `https://www.2embed.cc/embed/${id}`,
  }),
];

// ---------------------------------------------------------------------------
// User preferences (persisted).
// ---------------------------------------------------------------------------
const PREF_KEY = "ghostflix.providers.v2";

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
