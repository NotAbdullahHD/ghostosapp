export const GHOST_PROXY = "https://ghostos-proxy.ghostos.workers.dev/";

export function proxify(url: string): string {
  if (!url) return url;
  if (url.startsWith("spectre://") || url.startsWith("about:") || url.startsWith("data:")) return url;
  // Avoid double-proxy
  if (url.startsWith(GHOST_PROXY)) return url;
  return `${GHOST_PROXY}?url=${encodeURIComponent(url)}`;
}

export function isUrlLike(input: string): boolean {
  const s = input.trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  if (/^[a-z0-9-]+:\/\//i.test(s)) return true;
  // domain.tld or domain.tld/path with no spaces
  if (!/\s/.test(s) && /^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(s)) return true;
  return false;
}

export type EngineId = "google" | "duckduckgo" | "brave";

export function toSearchUrl(query: string, engine: EngineId = "google"): string {
  const q = encodeURIComponent(query.trim());
  switch (engine) {
    case "duckduckgo": return `https://duckduckgo.com/?q=${q}`;
    case "brave":      return `https://search.brave.com/search?q=${q}`;
    case "google":
    default:           return `https://www.google.com/search?q=${q}`;
  }
}

export function resolveInput(input: string, engine: EngineId = "google"): string {
  const s = input.trim();
  if (!s) return s;
  if (s.startsWith("spectre://")) return s;
  if (isUrlLike(s)) {
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  }
  return toSearchUrl(s, engine);
}
