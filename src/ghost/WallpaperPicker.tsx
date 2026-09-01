import { useGhost, WALLPAPERS } from "./store";
import { X, Lock } from "lucide-react";

export function WallpaperPicker() {
  const { showWallpaperPicker, setShowWallpaperPicker, wallpaperId, setWallpaperById, unlocked } = useGhost();
  if (!showWallpaperPicker) return null;

  return (
    <div
      data-no-ctx
      className="fixed inset-0 z-[9500] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={() => setShowWallpaperPicker(false)}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#141416] p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm text-white/90">Wallpaper</h2>
          <button onClick={() => setShowWallpaperPicker(false)} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {WALLPAPERS.map((w) => {
            const isLocked = !!(w.code || w.exclusive) && !unlocked[w.id];
            const active = w.id === wallpaperId;
            return (
              <button
                key={w.id}
                disabled={isLocked}
                onClick={() => { setWallpaperById(w.id); setShowWallpaperPicker(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs ${
                  active ? "bg-white/[0.12] text-white" : "text-white/70 hover:bg-white/[0.07]"
                } ${isLocked ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <span
                  className="h-8 w-14 shrink-0 rounded border border-white/10 bg-cover bg-center"
                  style={{ background: w.image ? undefined : w.css, backgroundImage: w.image ? `url(${w.image})` : undefined }}
                />
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {isLocked && <Lock className="h-3.5 w-3.5 shrink-0" />}
                {active && <span className="text-[10px] text-[var(--ice,#66d9ff)]">Current</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
