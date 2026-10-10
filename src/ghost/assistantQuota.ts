/**
 * Ghost Assistant daily message quota.
 * Client-side limit: DAILY_LIMIT assistant messages per calendar day (local time).
 * Persisted in localStorage so it survives reloads.
 */

export const DAILY_LIMIT = 100;
export const QUOTA_KEY = "ghost.assistant.quota.v1";

export interface QuotaState {
  used: number;
  remaining: number;
  limit: number;
  /** Epoch ms of the next local midnight. */
  resetsAt: number;
}

interface StoredQuota {
  day: string;
  used: number;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next local midnight (the moment the daily limit resets). */
export function nextReset(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
}

/** Pure: derive the quota state from stored raw JSON. Expired days reset to 0. */
export function computeState(raw: string | null, now: Date = new Date()): QuotaState {
  let stored: StoredQuota | null = null;
  try {
    if (raw) stored = JSON.parse(raw) as StoredQuota;
  } catch {
    stored = null;
  }
  const today = dayKey(now);
  const used = stored && stored.day === today && typeof stored.used === "number" && stored.used >= 0
    ? Math.min(stored.used, DAILY_LIMIT)
    : 0;
  return { used, remaining: Math.max(0, DAILY_LIMIT - used), limit: DAILY_LIMIT, resetsAt: nextReset(now) };
}

export function readQuota(now: Date = new Date()): QuotaState {
  try {
    return computeState(localStorage.getItem(QUOTA_KEY), now);
  } catch {
    return computeState(null, now);
  }
}

/** Increments today's counter (clamped at the limit) and returns the new state. */
export function incrementQuota(now: Date = new Date()): QuotaState {
  const state = readQuota(now);
  const used = Math.min(DAILY_LIMIT, state.used + 1);
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({ day: dayKey(now), used }));
  } catch {
    /* storage unavailable — limit simply doesn't persist */
  }
  return { used, remaining: Math.max(0, DAILY_LIMIT - used), limit: DAILY_LIMIT, resetsAt: nextReset(now) };
}

/** Human label like "resets in 3h 12m". */
export function resetLabel(resetsAt: number, now: Date = new Date()): string {
  const ms = Math.max(0, resetsAt - now.getTime());
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `resets in ${h}h ${m}m`;
  return `resets in ${m}m`;
}
