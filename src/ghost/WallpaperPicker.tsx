import { useEffect, useRef, useState } from "react";
import { useGhost, WALLPAPERS } from "./store";
import { usePersonalization } from "./PersonalizationProvider";
import { Button } from "@/components/ui/button";
import { X, Lock, Upload, Check, Trash2, Image, ChevronLeft, ChevronRight } from "lucide-react";

export function WallpaperPicker() {
  const { showWallpaperPicker, setShowWallpaperPicker, wallpaperId, setWallpaperById, unlocked } = useGhost();
  const { images, customId, setCustomId, addImage, removeImage } = usePersonalization();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"collection" | "personal">("collection");
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showWallpaperPicker) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setShowWallpaperPicker(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showWallpaperPicker, setShowWallpaperPicker]);
  if (!showWallpaperPicker) return null;
  return <div data-no-ctx role="dialog" aria-label="Background studio" className="wallpaper-studio fixed inset-0 z-[9500] flex flex-col justify-end pb-24" onMouseDown={() => setShowWallpaperPicker(false)}>
    <div className="wallpaper-controls desktop-panel mx-auto mb-6 flex max-w-[calc(100%-32px)] items-center gap-1 rounded-lg p-1.5" onMouseDown={event => event.stopPropagation()}>
      <Button variant="desktop" className={`text-xs ${tab === "collection" ? "bg-chrome-hover" : ""}`} onClick={() => setTab("collection")}><Image/>Collection</Button>
      <Button variant="desktop" className={`text-xs ${tab === "personal" ? "bg-chrome-hover" : ""}`} onClick={() => setTab("personal")}><Upload/>My backgrounds</Button>
      <span className="mx-1 h-5 w-px bg-chrome-border"/>
      <Button variant="desktop" size="icon" aria-label="Close backgrounds" onClick={() => setShowWallpaperPicker(false)}><X/></Button>
    </div>
    <section className="wallpaper-strip" onMouseDown={event => event.stopPropagation()}>
      <div className="mx-auto mb-3 flex max-w-[1100px] items-center justify-between px-6 text-chrome-foreground"><h2 className="text-sm font-medium">{tab === "collection" ? "Background collection" : "Your backgrounds"}</h2><div className="flex gap-1"><Button variant="desktop" size="icon" aria-label="Previous backgrounds" onClick={() => rail.current?.scrollBy({ left: -350, behavior: "smooth" })}><ChevronLeft/></Button><Button variant="desktop" size="icon" aria-label="Next backgrounds" onClick={() => rail.current?.scrollBy({ left: 350, behavior: "smooth" })}><ChevronRight/></Button></div></div>
      <div ref={rail} className="wallpaper-rail flex gap-4 overflow-x-auto px-8 pb-5 pt-2">
        {tab === "collection" && WALLPAPERS.map(wallpaper => {
          const blocked = !!(wallpaper.code || wallpaper.exclusive) && !unlocked[wallpaper.id];
          const active = !customId && wallpaperId === wallpaper.id;
          return <Button key={wallpaper.id} variant="desktop" disabled={blocked} title={wallpaper.name} aria-label={`Choose ${wallpaper.name}`} aria-pressed={active} className={`wallpaper-preview group ${active ? "wallpaper-selected" : ""}`} onClick={() => { setWallpaperById(wallpaper.id); setCustomId(null); }}>
            {wallpaper.video ? <video src={wallpaper.video} muted playsInline preload="metadata" onMouseEnter={event => { void event.currentTarget.play().catch(() => {}); }} onMouseLeave={event => event.currentTarget.pause()} className="absolute inset-0 h-full w-full object-cover"/> : <span className="absolute inset-0 bg-cover bg-center" style={{ background: wallpaper.image ? `url(${wallpaper.image}) center / cover` : wallpaper.css }}/>}
            <span className="wallpaper-caption"><span className="truncate">{wallpaper.name}</span>{blocked ? <Lock/> : active ? <Check/> : null}</span>
          </Button>;
        })}
        {tab === "personal" && <>
          <label className={`wallpaper-upload ${saving ? "opacity-50" : ""}`}>
            <Upload className="h-6 w-6"/><span>{saving ? "Saving…" : "Add background"}</span>
            <input type="file" accept="image/*" aria-label="Upload background" disabled={saving} className="sr-only" onChange={async event => {
              const file = event.target.files?.[0]; if (!file) return;
              setError(""); setSaving(true);
              try { await addImage(file); } catch (issue) { setError(issue instanceof Error ? issue.message : "Could not save the background."); }
              finally { setSaving(false); event.target.value = ""; }
            }}/>
          </label>
          {images.map(image => <div key={image.id} className="relative shrink-0">
            <Button variant="desktop" aria-label={`Choose ${image.name}`} aria-pressed={customId === image.id} className={`wallpaper-preview ${customId === image.id ? "wallpaper-selected" : ""}`} onClick={() => setCustomId(image.id)}><img src={image.url} alt="" className="absolute inset-0 h-full w-full object-cover"/><span className="wallpaper-caption"><span className="truncate">{image.name}</span>{customId === image.id && <Check/>}</span></Button>
            <Button variant="desktop" size="icon" title="Remove background" aria-label={`Remove ${image.name}`} className="absolute right-2 top-2 bg-popover h-7 w-7" onClick={() => { void removeImage(image.id).catch(() => setError("Could not remove the background.")); }}><Trash2/></Button>
          </div>)}
        </>}
      </div>
      {error && <p role="alert" className="px-8 text-sm text-destructive">{error}</p>}
    </section>
  </div>;
}
