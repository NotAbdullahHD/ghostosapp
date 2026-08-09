/**
 * GhostFlix viewing profiles — Netflix-style "Who's watching?" identities.
 * Stored locally; no account required.
 */

export interface FlixProfile {
  id: string;
  name: string;
  avatar: string;
  kids: boolean;
  createdAt: number;
}

export const PROFILE_AVATARS = ["👻", "🎬", "🛸", "🐺", "🦊", "🧊", "🎮", "🌙", "⚡", "🐙", "🦉", "🍿"];

const KEY = "ghostos.flix.profiles";
const ACTIVE_KEY = "ghostos.flix.activeProfile";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadProfiles(): FlixProfile[] {
  if (typeof window === "undefined") return [];
  return safeParse<FlixProfile[]>(localStorage.getItem(KEY), []);
}

export function saveProfiles(list: FlixProfile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function loadActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveProfileId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function createProfile(name: string, avatar: string, kids: boolean): FlixProfile {
  return {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim().slice(0, 24) || "Guest",
    avatar,
    kids,
    createdAt: Date.now(),
  };
}
