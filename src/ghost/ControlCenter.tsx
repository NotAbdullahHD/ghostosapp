import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Wifi, WifiOff, Bluetooth, Volume2, Sun, Moon, Focus, Gamepad2, Zap,
  Radio, MessageCircle, BatteryFull, HardDrive, User,
} from "lucide-react";
import { useGhost } from "./store";

interface CCState {
  wifi: boolean;
  bluetooth: boolean;
  focus: boolean;
  gaming: boolean;
  night: boolean;
  performance: boolean;
  volume: number;
  brightness: number;
}

const LS_CC = "ghost.controlcenter.v1";
const DEFAULT: CCState = {
  wifi: true, bluetooth: false, focus: false, gaming: false,
  night: false, performance: true, volume: 65, brightness: 80,
};

function load(): CCState {
  try {
    if (typeof window === "undefined") return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LS_CC) || "{}") };
  } catch { return DEFAULT; }
}

export function ControlCenter() {
  const { showControlCenter, toggleControlCenter, openGhostDrop, openApp, pushNotification } = useGhost();
  const [s, setS] = useState<CCState>(load);
  const [now, setNow] = useState(new Date());
  const [ghostUser, setGhostUser] = useState<string>("");

  useEffect(() => {
    try { localStorage.setItem(LS_CC, JSON.stringify(s)); } catch { /* noop */ }
  }, [s]);

  useEffect(() => {
    if (!showControlCenter) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [showControlCenter]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("ghost.chat.username")
        || localStorage.getItem("ghost.username")
        || "Ghost User";
      setGhostUser(u);
    } catch { setGhostUser("Ghost User"); }
  }, [showControlCenter]);

  // Apply night mode as a subtle screen tint.
  useEffect(() => {
    const id = "ghost-night-tint";
    let el = document.getElementById(id) as HTMLDivElement | null;
    if (!s.night) { el?.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;background:rgba(255,140,60,0.14);mix-blend-mode:multiply;transition:opacity .3s";
      document.body.appendChild(el);
    }
  }, [s.night]);

  // Apply brightness as body filter.
  useEffect(() => {
    document.body.style.filter = `brightness(${(50 + s.brightness / 2) / 100})`;
    return () => { document.body.style.filter = ""; };
  }, [s.brightness]);

  const t = (patch: Partial<CCState>) => setS((prev) => ({ ...prev, ...patch }));

  return (
    <AnimatePresence>
      {showControlCenter && (
        <>
          <motion.div
            className="fixed inset-0 z-[780]"
            onClick={toggleControlCenter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-label="Control Center"
            className="fixed right-3 top-11 w-[360px] z-[800] rounded-3xl p-4 window-shadow"
            style={{
              background: "linear-gradient(155deg, rgba(30,15,45,0.85), rgba(10,5,20,0.75))",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(168,85,247,.15), inset 0 1px 0 rgba(255,255,255,.08)",
            }}
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Header row: user + time */}
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full gradient-neon flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate max-w-[140px]">{ghostUser}</div>
                  <div className="text-[10px] font-mono text-fuchsia-300/70 tracking-widest">SPECTRAL · ONLINE</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-white/90 tabular-nums">
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-[9px] font-mono text-white/40 tracking-widest">
                  {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Connectivity pill card */}
            <div className="rounded-2xl p-3 mb-3 grid grid-cols-2 gap-2"
                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <PillToggle
                icon={s.wifi ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                label="Wi-Fi" sub={s.wifi ? "Ghost-Net" : "Off"} active={s.wifi}
                onClick={() => t({ wifi: !s.wifi })}
              />
              <PillToggle
                icon={<Bluetooth className="h-4 w-4" />}
                label="Bluetooth" sub={s.bluetooth ? "On" : "Off"} active={s.bluetooth}
                onClick={() => t({ bluetooth: !s.bluetooth })}
              />
            </div>

            {/* Mode toggles */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <ModeTile icon={<Focus className="h-4 w-4" />} label="Focus" active={s.focus}
                onClick={() => t({ focus: !s.focus })} />
              <ModeTile icon={<Gamepad2 className="h-4 w-4" />} label="Gaming" active={s.gaming}
                onClick={() => t({ gaming: !s.gaming })} />
              <ModeTile icon={<Moon className="h-4 w-4" />} label="Night" active={s.night}
                onClick={() => t({ night: !s.night })} />
              <ModeTile icon={<Zap className="h-4 w-4" />} label="Perf" active={s.performance}
                onClick={() => t({ performance: !s.performance })} />
            </div>

            {/* Sliders */}
            <div className="rounded-2xl p-3 mb-3 space-y-3"
                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Slider icon={<Sun className="h-3.5 w-3.5" />} label="Brightness"
                value={s.brightness} onChange={(v) => t({ brightness: v })} />
              <Slider icon={<Volume2 className="h-3.5 w-3.5" />} label="Volume"
                value={s.volume} onChange={(v) => t({ volume: v })} />
            </div>

            {/* Shortcuts */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <ShortcutCard
                icon={<Radio className="h-4 w-4" />} title="GhostDrop" sub="Nearby transfer"
                onClick={() => { toggleControlCenter(); openGhostDrop(); }}
              />
              <ShortcutCard
                icon={<MessageCircle className="h-4 w-4" />} title="GhostChat" sub="Online"
                onClick={() => { toggleControlCenter(); openApp("chat", "GhostChat"); }}
              />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={<BatteryFull className="h-3.5 w-3.5" />} label="Battery" value="87%" bar={87} tint="from-emerald-400 to-teal-500" />
              <StatCard icon={<HardDrive className="h-3.5 w-3.5" />} label="Storage" value="128 / 512 GB" bar={25} tint="from-fuchsia-400 to-violet-500" />
            </div>

            <button
              onClick={() => { pushNotification({ title: "Snapshot saved", body: "System state captured.", app: "system" }); }}
              className="mt-3 w-full text-[10px] font-mono tracking-[0.35em] text-white/40 hover:text-fuchsia-300 transition py-2"
            >
              GHOSTOS · CONTROL CENTER
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PillToggle({ icon, label, sub, active, onClick }: {
  icon: React.ReactNode; label: string; sub: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition"
      style={{
        background: active
          ? "linear-gradient(135deg, rgba(168,85,247,.35), rgba(120,60,220,.25))"
          : "rgba(255,255,255,0.05)",
        border: active ? "1px solid rgba(232,121,249,.4)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active ? "0 0 24px rgba(168,85,247,.35)" : "none",
      }}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${active ? "bg-white text-fuchsia-700" : "bg-white/10 text-white/70"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-white truncate">{label}</div>
        <div className="text-[10px] text-white/50 font-mono truncate">{sub}</div>
      </div>
    </button>
  );
}

function ModeTile({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 transition"
      style={{
        background: active
          ? "linear-gradient(160deg, rgba(232,121,249,.4), rgba(120,60,220,.35))"
          : "rgba(255,255,255,0.05)",
        border: active ? "1px solid rgba(232,121,249,.5)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow: active ? "0 0 22px rgba(232,121,249,.4)" : "none",
      }}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${active ? "bg-white text-fuchsia-700" : "bg-white/10 text-white/80"}`}>
        {icon}
      </div>
      <div className="text-[10px] font-mono tracking-widest text-white/80">{label}</div>
    </button>
  );
}

function Slider({ icon, label, value, onChange }: {
  icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 tracking-widest mb-1.5">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500"
             style={{ width: `${value}%`, boxShadow: "0 0 12px rgba(232,121,249,.6)" }} />
        <input type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
    </div>
  );
}

function ShortcutCard({ icon, title, sub, onClick }: {
  icon: React.ReactNode; title: string; sub: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 rounded-2xl p-3 text-left transition hover:bg-white/8"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="h-9 w-9 rounded-xl gradient-neon flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold text-white truncate">{title}</div>
        <div className="text-[10px] text-white/50 font-mono truncate">{sub}</div>
      </div>
    </button>
  );
}

function StatCard({ icon, label, value, bar, tint }: {
  icon: React.ReactNode; label: string; value: string; bar: number; tint: string;
}) {
  return (
    <div className="rounded-2xl p-3"
         style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center justify-between text-[10px] font-mono text-white/50 tracking-widest mb-2">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
      </div>
      <div className="text-sm font-bold text-white mb-1.5">{value}</div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${tint}`} style={{ width: `${bar}%` }} />
      </div>
    </div>
  );
}
