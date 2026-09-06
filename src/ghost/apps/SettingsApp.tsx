import { useState } from "react";
import { motion } from "framer-motion";
import { useGhost, WALLPAPERS, SEARCH_ENGINES, PROXY_PROVIDERS } from "../store";
import { Volume2, Palette, Image as ImageIcon, Bell, Monitor, Lock, Sparkles, Shield, EyeOff, AlertTriangle, KeyRound, Clock, Gauge, Zap, Battery, Wand2, Code2, Globe, Search, AlignLeft, AlignCenter } from "lucide-react";

const RARITY_STYLE: Record<string, string> = {
  common:    "text-white/50 ring-white/10",
  rare:      "text-cyan-300 ring-cyan-400/40 shadow-[0_0_18px_rgba(34,211,238,.25)]",
  epic:      "text-fuchsia-300 ring-fuchsia-400/40 shadow-[0_0_22px_rgba(232,121,249,.3)]",
  legendary: "text-amber-300 ring-amber-400/50 shadow-[0_0_28px_rgba(251,191,36,.35)]",
  mythic:    "text-rose-300 ring-rose-400/60 shadow-[0_0_36px_rgba(244,63,94,.45)]",
};

const SECTIONS = [
  { id: "wallpaper", name: "Wallpaper", icon: ImageIcon },
  { id: "performance", name: "Performance", icon: Gauge },
  { id: "browser", name: "Browser", icon: Globe },
  { id: "privacy",   name: "Privacy",   icon: Shield },
  { id: "appearance", name: "Appearance", icon: Palette },
  { id: "sound", name: "Sound", icon: Volume2 },
  { id: "notifications", name: "Notifications", icon: Bell },
  { id: "display", name: "Display", icon: Monitor },
];

const CLOAK_PRESETS = [
  { id: "off",       name: "Off · GhostOS" },
  { id: "google",    name: "Google" },
  { id: "classroom", name: "Google Classroom" },
  { id: "docs",      name: "Google Docs" },
  { id: "drive",     name: "Google Drive" },
  { id: "canvas",    name: "Canvas" },
  { id: "classlink", name: "ClassLink" },
];

export function SettingsApp() {
  const { wallpaperId, setWallpaperById, unlocked, redeemCode, pushNotification, settings, updateSettings, triggerPanic } = useGhost();
  const [section, setSection] = useState("wallpaper");
  const [code, setCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleRedeem = () => {
    const r = redeemCode(code);
    if (r.ok && r.wallpaper) setRedeemMsg({ ok: true, text: `Unlocked ${r.wallpaper.name} (${r.wallpaper.rarity.toUpperCase()})` });
    else setRedeemMsg({ ok: false, text: r.reason || "redemption failed" });
    setCode("");
  };

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
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Wallpaper Library</h2>
                <p className="text-xs text-white/50 mt-1">Animated cinematic backdrops. Codes are dropped on Discord.</p>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-white/40">
                {Object.values(unlocked).filter(Boolean).length} / {WALLPAPERS.filter((w) => w.code || w.exclusive).length} HIDDEN UNLOCKED
              </div>
            </div>

            <div className="glass rounded-xl p-3 mb-5 flex items-center gap-2 ring-1 ring-fuchsia-400/20">
              <Sparkles className="h-4 w-4 text-fuchsia-300" />
              <input value={code} onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                placeholder="Redeem code  (drops on Discord)"
                className="flex-1 bg-transparent outline-none text-sm font-mono placeholder:text-white/30" />
              <button onClick={handleRedeem} className="px-3 py-1.5 rounded-lg gradient-neon text-xs font-bold">REDEEM</button>
            </div>
            {redeemMsg && (
              <div className={`text-[11px] font-mono mb-4 ${redeemMsg.ok ? "text-emerald-300" : "text-rose-300"}`}>
                {redeemMsg.ok ? "✓ " : "✗ "}{redeemMsg.text}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {WALLPAPERS.map((w) => {
                const lockedByCode = !!w.code && !unlocked[w.id];
                const lockedExclusive = !!w.exclusive && !unlocked[w.id];
                const locked = lockedByCode || lockedExclusive;
                const active = wallpaperId === w.id;
                return (
                  <button key={w.id}
                    disabled={locked}
                    onClick={() => {
                      const ok = setWallpaperById(w.id);
                      if (ok) pushNotification({ title: "Wallpaper updated", body: w.name });
                    }}
                    className={`group relative aspect-video rounded-xl overflow-hidden ring-2 transition ${
                      active ? "ring-fuchsia-400 shadow-[0_0_24px_rgba(232,121,249,.5)]" : `ring-1 ${RARITY_STYLE[w.rarity]}`
                    } ${locked ? "cursor-not-allowed" : "hover:scale-[1.02]"}`}
                    style={{ background: w.css }}>
                    {w.video && !locked && (
                      <video src={w.video} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    )}
                    {locked && (
                      <div className="absolute inset-0 backdrop-blur-md bg-black/65 flex flex-col items-center justify-center text-center px-2">
                        <Lock className="h-5 w-5 text-white/70 mb-1" />
                        {lockedExclusive ? (
                          <>
                            <div className="text-[10px] font-mono text-rose-300 tracking-widest">EXCLUSIVE</div>
                            <div className="text-[9px] font-mono text-white/50 mt-1 leading-snug">{w.exclusiveHint}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] font-mono text-white/60 tracking-widest">REQUIRES CODE</div>
                            <div className="text-[9px] font-mono text-fuchsia-300/80 mt-1">CHECK DISCORD</div>
                          </>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold tracking-wide text-white">{w.name}</div>
                        <div className={`text-[9px] font-mono tracking-widest ${RARITY_STYLE[w.rarity].split(" ")[0]}`}>{w.rarity.toUpperCase()}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-mono text-white/30 mt-5 tracking-widest">Drop a code in the Terminal too: <span className="text-fuchsia-300">redeem &lt;#code&gt;</span></p>
          </div>
        )}

        {section === "performance" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Performance</h2>
              <p className="text-xs text-white/50 mt-1">Tune how much work GhostOS does while you use it.</p>
            </div>

            <Card icon={<Zap className="h-4 w-4 text-[#66d9ff]" />} title="Power Mode" subtitle="Balance responsiveness against battery life.">
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { id: "performance", label: "Performance", icon: <Zap className="h-3.5 w-3.5" /> },
                  { id: "balanced", label: "Balanced", icon: <Gauge className="h-3.5 w-3.5" /> },
                  { id: "battery", label: "Battery Saver", icon: <Battery className="h-3.5 w-3.5" /> },
                ] as const).map((m) => (
                  <button key={m.id}
                    onClick={() => updateSettings(
                      m.id === "performance"
                        ? { powerMode: m.id, animationQuality: "high", blurEffects: true, wallpaperEffects: true, motionEffects: true }
                        : m.id === "balanced"
                          ? { powerMode: m.id, animationQuality: "high", blurEffects: true, wallpaperEffects: true, motionEffects: false }
                          : { powerMode: m.id, animationQuality: "reduced", blurEffects: false, wallpaperEffects: false, motionEffects: false }
                    )}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ring-1 transition ${
                      settings.powerMode === m.id ? "ring-[#66d9ff]/60 bg-[#66d9ff]/15 text-white" : "ring-white/10 text-white/60 hover:bg-white/5"
                    }`}>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            </Card>

            <Card icon={<Wand2 className="h-4 w-4 text-[#66d9ff]" />} title="Animation Quality" subtitle="Lower this if the interface ever feels heavy.">
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { id: "high", label: "High" },
                  { id: "reduced", label: "Reduced" },
                  { id: "off", label: "Off" },
                ] as const).map((a) => (
                  <button key={a.id} onClick={() => updateSettings({ animationQuality: a.id })}
                    className={`px-3 py-1.5 rounded-full text-xs ring-1 transition ${
                      settings.animationQuality === a.id ? "ring-[#66d9ff]/60 bg-[#66d9ff]/15 text-white" : "ring-white/10 text-white/55 hover:bg-white/5"
                    }`}>{a.label}</button>
                ))}
              </div>
            </Card>

            <Card icon={<Monitor className="h-4 w-4 text-[#66d9ff]" />} title="Visual Effects" subtitle="Blur, wallpaper and motion effects across the desktop.">
              <div className="space-y-3">
                <ToggleRow label="Blur effects" on={settings.blurEffects} onChange={(v) => updateSettings({ blurEffects: v })} />
                <ToggleRow label="Wallpaper effects" on={settings.wallpaperEffects} onChange={(v) => updateSettings({ wallpaperEffects: v })} />
                <ToggleRow label="Motion effects" on={settings.motionEffects} onChange={(v) => updateSettings({ motionEffects: v })} />
              </div>
            </Card>

            <Card icon={<Code2 className="h-4 w-4 text-[#66d9ff]" />} title="Developer Mode" subtitle="Shows diagnostics inside apps that support it.">
              <ToggleRow label="Developer mode" on={settings.developerMode} onChange={(v) => updateSettings({ developerMode: v })} />
            </Card>
          </div>
        )}

        {section === "browser" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Browser</h2>
              <p className="text-xs text-white/50 mt-1">Defaults used by the GhostOS Browser.</p>
            </div>

            <Card icon={<Search className="h-4 w-4 text-[#66d9ff]" />} title="Search Engine" subtitle="Used when you type a term instead of an address.">
              <div className="grid grid-cols-2 gap-2">
                {SEARCH_ENGINES.map((e) => (
                  <button key={e.id} onClick={() => updateSettings({ searchEngine: e.id })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ring-1 transition ${
                      settings.searchEngine === e.id ? "ring-[#66d9ff]/60 bg-[#66d9ff]/15 text-white" : "ring-white/10 text-white/60 hover:bg-white/5"
                    }`}>
                    <span>{e.name}{e.id === "google" && <span className="text-white/30"> · Default</span>}</span>
                    {settings.searchEngine === e.id && <span className="text-[9px] font-mono tracking-widest text-[#66d9ff]">ACTIVE</span>}
                  </button>
                ))}
              </div>
            </Card>

            <Card icon={<Shield className="h-4 w-4 text-[#66d9ff]" />} title="Proxy Provider" subtitle="The engine that fetches and rewrites sites.">
              <div className="space-y-2">
                {PROXY_PROVIDERS.map((p) => (
                  <button key={p.id} disabled={!p.available} onClick={() => updateSettings({ proxyProvider: p.id })}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs ring-1 transition ${
                      settings.proxyProvider === p.id ? "ring-[#66d9ff]/60 bg-[#66d9ff]/15 text-white" : "ring-white/10 text-white/60 hover:bg-white/5"
                    } ${p.available ? "" : "opacity-40 cursor-not-allowed"}`}>
                    <span className="text-left">
                      <span className="block text-white/90">{p.name}</span>
                      <span className="block text-[10px] text-white/40 mt-0.5">{p.note}</span>
                    </span>
                    {settings.proxyProvider === p.id && <span className="text-[9px] font-mono tracking-widest text-[#66d9ff]">ACTIVE</span>}
                  </button>
                ))}
              </div>
            </Card>

            <Card icon={<Globe className="h-4 w-4 text-[#66d9ff]" />} title="Homepage" subtitle="Loaded when the browser opens.">
              <input value={settings.homepage} onChange={(e) => updateSettings({ homepage: e.target.value })}
                placeholder="https://www.google.com"
                className="w-full px-3 py-2 rounded-lg bg-black/40 ring-1 ring-white/10 outline-none text-xs font-mono focus:ring-[#66d9ff]/40" />
            </Card>

            <Card icon={<Monitor className="h-4 w-4 text-[#66d9ff]" />} title="New Tab" subtitle="What a new tab shows.">
              <div className="flex items-center gap-2 flex-wrap">
                {([
                  { id: "ghost", label: "Ghost Start Page" },
                  { id: "homepage", label: "Homepage" },
                  { id: "blank", label: "Blank" },
                ] as const).map((n) => (
                  <button key={n.id} onClick={() => updateSettings({ newTab: n.id })}
                    className={`px-3 py-1.5 rounded-full text-xs ring-1 transition ${
                      settings.newTab === n.id ? "ring-[#66d9ff]/60 bg-[#66d9ff]/15 text-white" : "ring-white/10 text-white/55 hover:bg-white/5"
                    }`}>{n.label}</button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {section === "privacy" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Privacy &amp; Stealth</h2>
              <p className="text-xs text-white/50 mt-1">Tools to keep GhostOS hidden in plain sight.</p>
            </div>

            <Card icon={<EyeOff className="h-4 w-4 text-cyan-300" />} title="Tab Cloaking" subtitle="Disguise the browser tab title and favicon.">
              <div className="grid grid-cols-2 gap-2">
                {CLOAK_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => updateSettings({ tabCloak: p.id })}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition ring-1 ${
                      settings.tabCloak === p.id ? "ring-fuchsia-400/60 bg-fuchsia-500/15 text-white" : "ring-white/10 text-white/60 hover:bg-white/5"
                    }`}>
                    <span>{p.name}</span>
                    {settings.tabCloak === p.id && <span className="text-[9px] font-mono tracking-widest text-fuchsia-300">ACTIVE</span>}
                  </button>
                ))}
              </div>
            </Card>

            <Card icon={<AlertTriangle className="h-4 w-4 text-amber-300" />} title="Panic Key" subtitle="Press to instantly minimize everything &amp; cloak the tab.">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-white/50 font-mono">Trigger key</div>
                  <input value={settings.panicKey} maxLength={1} onChange={(e) => updateSettings({ panicKey: e.target.value })}
                    className="mt-1 w-16 px-2 py-1 rounded-md text-center font-mono text-lg text-white bg-black/60 ring-1 ring-fuchsia-400/30 outline-none" />
                </div>
                <button onClick={triggerPanic}
                  className="px-4 py-2 rounded-lg text-xs font-mono tracking-widest bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40 hover:bg-rose-500/25">
                  TEST PANIC
                </button>
              </div>
            </Card>

            <Card icon={<Clock className="h-4 w-4 text-violet-300" />} title="Idle Lock Screen" subtitle="Auto-lock the OS after inactivity.">
              <div className="flex items-center gap-2 flex-wrap">
                {[0, 1, 5, 10, 30].map((m) => (
                  <button key={m} onClick={() => updateSettings({ idleLockMinutes: m })}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono ring-1 transition ${
                      settings.idleLockMinutes === m ? "ring-fuchsia-400/60 bg-fuchsia-500/20 text-white" : "ring-white/10 text-white/55 hover:bg-white/5"
                    }`}>{m === 0 ? "Off" : `${m} min`}</button>
                ))}
              </div>
            </Card>

            <Card icon={<KeyRound className="h-4 w-4 text-emerald-300" />} title="Redirect Confirmation" subtitle="Warn before the page navigates away.">
              <Toggle on={settings.redirectConfirm} onChange={(v) => updateSettings({ redirectConfirm: v })} />
            </Card>
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
            <div className="glass mt-4 rounded-xl p-4">
              <div className="mb-3 text-sm font-semibold">Dock Position</div>
              <div className="flex gap-2">
                {([["left", "Left"], ["bottom", "Bottom"], ["right", "Right"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => updateSettings({ dockPosition: id })}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ring-1 ${settings.dockPosition === id ? "bg-ice/15 text-white ring-ice/60" : "text-white/60 ring-white/10"}`}>
                    {label}
                  </button>
                ))}
              </div>
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

function Card({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-4 ring-1 ring-white/5 hover:ring-fuchsia-400/20 transition">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-sm font-bold tracking-wide">{title}</div>
      </div>
      <div className="text-[11px] text-white/50 mb-3" dangerouslySetInnerHTML={{ __html: subtitle }} />
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition ring-1 ${on ? "bg-fuchsia-500/40 ring-fuchsia-400/60 shadow-[0_0_18px_rgba(232,121,249,.5)]" : "bg-white/5 ring-white/10"}`}>
      <motion.span layout className={`absolute top-1 h-5 w-5 rounded-full ${on ? "bg-white shadow-[0_0_12px_rgba(255,255,255,.6)]" : "bg-white/60"}`}
        style={{ left: on ? 24 : 4 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
    </button>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/70">{label}</span>
      <Toggle on={on} onChange={onChange} />
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
