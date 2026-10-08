export const ESCAPE_HOLD_MS = 1000;
export const CLOCK_COLORS = {
  frost: "var(--chrome-foreground)", ice: "var(--ice)", rose: "var(--clock-rose)", mint: "var(--clock-mint)", graphite: "var(--clock-graphite)",
} as const;
export type ClockSettings = {
  text: string; size: number; detailSize: number; opacity: number; x: number; y: number;
  color: keyof typeof CLOCK_COLORS; blend: "normal" | "difference" | "overlay" | "screen";
  date: boolean; time: boolean;
};
export const DEFAULT_CLOCK: ClockSettings = { text: "", size: 64, detailSize: 15, opacity: 100, x: 50, y: 49, color: "frost", blend: "normal", date: true, time: true };
export function normalizeClock(raw: Partial<ClockSettings>): ClockSettings {
  const clamp = (n: unknown, min: number, max: number, fallback: number) => typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  return {
    text: typeof raw.text === "string" ? raw.text.slice(0, 40) : "",
    size: clamp(raw.size, 24, 110, DEFAULT_CLOCK.size), detailSize: clamp(raw.detailSize, 10, 24, DEFAULT_CLOCK.detailSize),
    opacity: clamp(raw.opacity, 10, 100, 100), x: clamp(raw.x, 15, 85, 50), y: clamp(raw.y, 20, 75, 49),
    color: raw.color && raw.color in CLOCK_COLORS ? raw.color : "frost",
    blend: ["normal", "difference", "overlay", "screen"].includes(raw.blend ?? "") ? raw.blend ?? "normal" : "normal",
    date: typeof raw.date === "boolean" ? raw.date : true, time: typeof raw.time === "boolean" ? raw.time : true,
  };
}
export type PersonalWallpaper = { id: string; name: string; blob: Blob };
export async function wallpaperStorage<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("ghost-personal-wallpapers", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("images", { keyPath: "id" });
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction("images", mode);
      const request = action(transaction.objectStore("images"));
      transaction.oncomplete = () => { resolve(request.result); db.close(); };
      transaction.onerror = () => { reject(transaction.error); db.close(); };
      transaction.onabort = () => { reject(transaction.error); db.close(); };
    };
  });
}