import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_CLOCK, normalizeClock, wallpaperStorage, type ClockSettings, type PersonalWallpaper } from "./personalization";

type SavedWallpaper = PersonalWallpaper & { url: string };
type Personalization = {
  clock: ClockSettings; updateClock: (patch: Partial<ClockSettings>) => void;
  showClockEditor: boolean; setShowClockEditor: (show: boolean) => void;
  images: SavedWallpaper[]; customId: string | null; setCustomId: (id: string | null) => void;
  customImage: SavedWallpaper | undefined; addImage: (file: File) => Promise<void>; removeImage: (id: string) => Promise<void>;
};
const Context = createContext<Personalization | null>(null);
export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState(DEFAULT_CLOCK);
  const [showClockEditor, setShowClockEditor] = useState(false);
  const [images, setImages] = useState<SavedWallpaper[]>([]);
  const [customId, selectImage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    const urls: string[] = [];
    try {
      setClock(normalizeClock(JSON.parse(localStorage.getItem("ghost.clock.v1") || "{}")));
      selectImage(localStorage.getItem("ghost.customBackground.v1"));
    } catch { /* use defaults */ }
    wallpaperStorage<PersonalWallpaper[]>("readonly", store => store.getAll()).then(rows => {
      if (disposed) return;
      setImages(rows.map(row => { const url = URL.createObjectURL(row.blob); urls.push(url); return { ...row, url }; }));
    }).catch(() => {}).finally(() => { if (!disposed) setReady(true); });
    return () => { disposed = true; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("ghost.clock.v1", JSON.stringify(clock));
      if (customId) localStorage.setItem("ghost.customBackground.v1", customId);
      else localStorage.removeItem("ghost.customBackground.v1");
    } catch { /* storage may be blocked */ }
  }, [clock, customId, ready]);
  const addImage = async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); throw new Error("This browser could not read the image."); }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Could not save this image.")), "image/webp", 0.9));
    const row = { id: crypto.randomUUID(), name: file.name.replace(/\.[^.]+$/, ""), blob };
    await wallpaperStorage("readwrite", store => store.put(row));
    setImages(current => [...current, { ...row, url: URL.createObjectURL(blob) }]); selectImage(row.id);
  };
  const removeImage = async (id: string) => {
    await wallpaperStorage("readwrite", store => store.delete(id));
    const image = images.find(item => item.id === id);
    if (image) URL.revokeObjectURL(image.url);
    setImages(current => current.filter(item => item.id !== id));
    if (customId === id) selectImage(null);
  };
  return <Context.Provider value={{ clock, updateClock: patch => setClock(current => normalizeClock({ ...current, ...patch })), showClockEditor, setShowClockEditor, images, customId, setCustomId: selectImage, customImage: images.find(item => item.id === customId), addImage, removeImage }}>{children}</Context.Provider>;
}
export function usePersonalization() {
  const context = useContext(Context);
  if (!context) throw new Error("Desktop personalization is unavailable.");
  return context;
}