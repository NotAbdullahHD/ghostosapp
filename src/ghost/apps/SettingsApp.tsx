import { useState } from "react";
import { useGhost, WALLPAPERS } from "../store";
import { Volume2, Palette, Image as ImageIcon, Bell, Monitor, Lock, Sparkles } from "lucide-react";

const RARITY_STYLE: Record<string, string> = {
  common:    "text-white/50 ring-white/10",
  rare:      "text-cyan-300 ring-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,.25)]",
  epic:      "text-fuchsia-300 ring-fuchsia-400/40 shadow-[0_0_22px_rgba(232,121,249,.3)]",
  legendary: "text-amber-300 ring-amber-400/50 shadow-[0_0_28px_rgba(251,191,36,.35)]",
  mythic:    "text-rose-300 ring-rose-400/60 shadow-[0_0_36px_rgba(244,63,94,.45)]",
};

const SECTIONS = [
  { id: "wallpaper", name: "Wallpaper", icon: ImageIcon },
  { id: "appearance", name: "Appearance", icon: Palette },
  { id: "sound", name: "Sound", icon: Volume2 },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "display", name: "Display", icon: Monitor },
];

export function SettingsApp() {
  const { wallpaper, setWallpaper, pushNotification } = useGhost();
  const [section, setSection] = useState("wallpaper");

  return (
    <div className="h-full flex bg-gradient-to-br from-black via-[#0e0820] to-black text-white">
      <aside className="w-48 border-r border-white/5 p-3 space-y-1">
        <div className="text-[10px] font-mono tracking-widest text-white/40 px-2 py-2">SYSTEM</div>
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition ${
              section === s.id ? "gradient-neon text-white" : "text-white/60 hover:bg-white/5"
            }`}>
            <s.icon className="h-3.5 w-3.5" />
            {s.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6 overflow-y-auto scrollbar-hide">
        {section === "wallpaper" && (
          <div>
            <h2 className="text-xl font-bold mb-1">Wallpaper</h2>
            <p className="text-xs text-white/50 mb-5">Pick a backdrop for your desktop.</p>
            <div className="grid grid-cols-3 gap-3">
              {WALLPAPERS.map((w) => (
                <button key={w.id} onClick={() => { setWallpaper(w.css); pushNotification({ title: "Wallpaper updated", body: w.name }); }}
                  className={`group relative aspect-video rounded-xl overflow-hidden ring-2 transition ${wallpaper === w.css ? "ring-fuchsia-400 shadow-[0_0_20px_rgba(232,121,249,.5)]" : "ring-white/10 hover:ring-white/30"}`}
                  style={{ background: w.css }}>
                  <div className="absolute inset-x-0 bottom-0 p-2 text-xs font-mono text-white bg-black/50">
                    {w.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {section === "appearance" && (
          <div>
            <h2 className="text-xl font-bold mb-1">Appearance</h2>
            <p className="text-xs text-white/50 mb-5">Always dark. Always Ghost.</p>
            <div className="glass rounded-xl p-4 space-y-3">
              <Row label="Theme" value="Spectral Dark" />
              <Row label="Accent" value="Neon Violet" />
              <Row label="Transparency" value="High" />
              <Row label="Animations" value="Cinematic" />
            </div>
          </div>
        )}
        {section === "sound" && (
          <div>
            <h2 className="text-xl font-bold mb-1">Sound</h2>
            <p className="text-xs text-white/50 mb-5">Audio output and system sounds.</p>
            <div className="glass rounded-xl p-4 space-y-4">
              <Slider label="Master volume" value={68} />
              <Slider label="System sounds" value={42} />
              <Slider label="Notifications" value={80} />
            </div>
          </div>
        )}
        {section === "notifications" && (
          <div>
            <h2 className="text-xl font-bold mb-1">Notifications</h2>
            <p className="text-xs text-white/50 mb-5">Test the notification center.</p>
            <button onClick={() => pushNotification({ title: "Test", body: "This is a Ghost transmission." })}
              className="px-4 py-2 rounded-lg gradient-neon text-sm font-bold shadow-lg shadow-fuchsia-700/40">
              Send Test Notification
            </button>
          </div>
        )}
        {section === "display" && (
          <div>
            <h2 className="text-xl font-bold mb-1">Display</h2>
            <div className="glass rounded-xl p-4 space-y-3 mt-4">
              <Row label="Resolution" value="3840 × 2160" />
              <Row label="Refresh rate" value="120 Hz" />
              <Row label="Color profile" value="Spectral P3" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className="text-fuchsia-200 font-mono">{value}</span>
    </div>
  );
}

function Slider({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/60 mb-1.5"><span>{label}</span><span>{value}%</span></div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full gradient-neon" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
