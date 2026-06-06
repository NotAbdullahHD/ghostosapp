// OMDb integration for GhostFlix. Public API key supplied by user.
const OMDB_KEY = "e345283a";
const OMDB_BASE = "https://www.omdbapi.com/";

export interface OmdbMovie {
  imdbID: string;
  Title: string;
  Year: string;
  Rated?: string;
  Released?: string;
  Runtime?: string;
  Genre?: string;
  Director?: string;
  Actors?: string;
  Plot?: string;
  Poster?: string;
  imdbRating?: string;
  Type?: string;
  Response?: string;
}

const cache = new Map<string, OmdbMovie>();
const inflight = new Map<string, Promise<OmdbMovie | null>>();

export async function fetchMovie(imdbId: string): Promise<OmdbMovie | null> {
  if (cache.has(imdbId)) return cache.get(imdbId)!;
  if (inflight.has(imdbId)) return inflight.get(imdbId)!;
  const p = (async () => {
    try {
      const res = await fetch(`${OMDB_BASE}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_KEY}&plot=full`);
      const json = (await res.json()) as OmdbMovie;
      if (json && json.Response !== "False" && json.imdbID) {
        cache.set(imdbId, json);
        return json;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(imdbId);
    }
  })();
  inflight.set(imdbId, p);
  return p;
}

export async function fetchMovies(ids: string[]): Promise<OmdbMovie[]> {
  const results = await Promise.all(ids.map(fetchMovie));
  return results.filter((m): m is OmdbMovie => !!m);
}

export interface OmdbSearchItem {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

export async function searchMovies(query: string): Promise<OmdbSearchItem[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${OMDB_BASE}?s=${encodeURIComponent(q)}&type=movie&apikey=${OMDB_KEY}`);
    const json = await res.json();
    if (json?.Response === "True" && Array.isArray(json.Search)) {
      return json.Search as OmdbSearchItem[];
    }
    return [];
  } catch {
    return [];
  }
}

/** Curated IMDb ID lists per category. OMDb has no trending endpoint. */
export const CATEGORIES: { label: string; ids: string[] }[] = [
  {
    label: "Trending",
    ids: ["tt1375666","tt0816692","tt15398776","tt1517268","tt10366206","tt1160419","tt1630029","tt0468569"],
  },
  {
    label: "Popular",
    ids: ["tt4154796","tt1745960","tt10872600","tt7286456","tt6751668","tt6723592","tt1877830","tt6710474"],
  },
  {
    label: "Top Rated",
    ids: ["tt0111161","tt0068646","tt0468569","tt0110912","tt0108052","tt0167260","tt0137523","tt0109830"],
  },
  {
    label: "Action",
    ids: ["tt1392190","tt2911666","tt4912910","tt0172495","tt0095016","tt0113277","tt0381061","tt1899353"],
  },
  {
    label: "Comedy",
    ids: ["tt0829482","tt1119646","tt0838283","tt0357413","tt1478338","tt8946378","tt2278388","tt0443453"],
  },
  {
    label: "Horror",
    ids: ["tt0081505","tt7784604","tt5052448","tt1457767","tt1396484","tt6644200","tt1922777","tt8772262"],
  },
  {
    label: "Sci-Fi",
    ids: ["tt0133093","tt1856101","tt2543164","tt0470752","tt1631867","tt1136608","tt1276104","tt2798920"],
  },
  {
    label: "Animation",
    ids: ["tt4633694","tt9362722","tt0245429","tt0114709","tt2096673","tt0910970","tt2380307","tt0382932"],
  },
];

export const FEATURED_ID = "tt0816692"; // Interstellar — cinematic hero
export const FALLBACK_POSTER = ""; // empty → component shows gradient

export function isValidImdbId(id?: string | null): id is string {
  return !!id && /^tt\d{6,10}$/.test(id);
}

/** Ordered list of stream providers. Each accepts a raw IMDb id. */
export const STREAM_SOURCES: { id: string; label: string; build: (imdb: string) => string }[] = [
  { id: "vidsrc-to",  label: "VidSrc.to",  build: (i) => `https://vidsrc.to/embed/movie/${encodeURIComponent(i)}` },
  { id: "vidsrc-xyz", label: "VidSrc.xyz", build: (i) => `https://vidsrc.xyz/embed/movie/${encodeURIComponent(i)}` },
  { id: "vidsrc-cc",  label: "VidSrc.cc",  build: (i) => `https://vidsrc.cc/v2/embed/movie/${encodeURIComponent(i)}` },
  { id: "2embed",     label: "2Embed",     build: (i) => `https://www.2embed.cc/embed/${encodeURIComponent(i)}` },
];

export function buildVidsrcUrl(imdbId: string, sourceIndex = 0): string {
  const src = STREAM_SOURCES[sourceIndex] ?? STREAM_SOURCES[0];
  return src.build(imdbId);
}
