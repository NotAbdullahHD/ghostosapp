import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Wifi, WifiOff, Bluetooth, Volume2, Sun, Moon, Focus, Radio, BatteryFull } from "lucide-react";
import { useGhost } from "./store";

interface CCState {
  wifi: boolean;
  bluetooth: boolean;
  focus: boolean;
  night: boolean;
  volume: number;
  brightness: number;
}

const LS_CC = "ghost.controlcenter.v1";
const DEFAULT: CCState = { wifi: true, bluetooth: false, focus: false, night: false, volume: 65, brightness: 80 };

function load(): CCState {
  try {
    if (typeof window === "undefined") return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(LS_CC) || "{}") };
  } catch { return DEFAULT; }
}

export function ControlCenter() {
  const { showControlCenter, toggleControlCenter, openApp, toggleGhostDrop } = useGhost();
  const [s, setS] = useState<CCState>(load);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    try { localStorage.setItem(LS_CC, JSON.stringify(s)); } catch { /* noop */ }
  }, [s]);

  useEffect(() => {
    if (!showControlCenter) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, [showControlCenter]);

  // Night shift tint.
  useEffect(() => {
    const id = "ghost-night-tint";
    let el = document.getElementById(id) as HTMLDivElement | null;
    if (!s.night) { el?.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;background:rgba(255,140,60,0.12);mix-blend-mode:multiply";
      document.body.appendChild(el);
    }
  }, [s.night]);

  useEffect(() => {
    document.body.style.filter = `brightness(${(50 + s.brightness / 2) / 100})`;
    return () => { document.body.style.filter = ""; };
  }, [s.brightness]);

  const t = (patch: Partial<CCState>) => setS((prev) => ({ ...prev, ...patch }));

  return (
    <AnimatePresence>
      {showControlCenter && (
        <>
          <div className="fixed inset-0 z-[780]" onClick={toggleControlCenter} />
          <motion.div
            role="dialog"
            aria-label="Control Center"
            className="fixed right-2 bottom-16 w-[320px] z-[800] rounded-2xl p-3"
            style={{
              background: "rgba(20,20,22,0.86)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 26px 60px -24px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.06)",
            }}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Tile
                icon={s.wifi ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                label="Wi-Fi" sub={s.wifi ? "Ghost-Net" : "Off"} active={s.wifi}
                onClick={() => t({ wifi: !s.wifi })}
              />
              <Tile
                icon={<Bluetooth className="h-4 w-4" />}
                label="Bluetooth" sub={s.bluetooth ? "On" : "Off"} active={s.bluetooth}
                onClick={() => t({ bluetooth: !s.bluetooth })}
              />
              <Tile icon={<Focus className="h-4 w-4" />} label="Focus" sub={s.focus ? "On" : "Off"} active={s.focus}
                onClick={() => t({ focus: !s.focus })} />
              <Tile icon={<Moon className="h-4 w-4" />} label="Night Shift" sub={s.night ? "On" : "Off"} active={s.night}
                onClick={() => t({ night: !s.night })} />
            </div>

            <div className="rounded-xl p-3 space-y-3 mb-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Slider icon={<Volume2 className="h-3.5 w-3.5" />} label="Volume" value={s.volume} onChange={(v) => t({ volume: v })} />
              <Slider icon={<Sun className="h-3.5 w-3.5" />} label="Brightness" value={s.brightness} onChange={(v) => t({ brightness: v })} />
            </div>

            <div className="flex items-center justify-between px-1">
              <button
                onClick={() => { toggleControlCenter(); toggleGhostDrop(); }}
                className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors duration-150"
              >
                <Radio className="h-3.5 w-3.5" /> GhostDrop
              </button>
              <div className="flex items-center gap-2 text-[11px] text-white/45">
                <BatteryFull className="h-3.5 w-3.5" />
                <span className="tabular-nums">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <button
                  onClick={() => { toggleControlCenter(); openApp("settings", "Settings"); }}
                  className="text-white/60 hover:text-white transition-colors duration-150"
                >
                  Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Tile({ icon, label, sub, active, onClick }: {
  icon: React.ReactNode; label: string; sub: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors duration-150"
      style={{
        background: active ? "rgba(102,217,255,0.16)" : "rgba(255,255,255,0.05)",
        border: active ? "1px solid rgba(102,217,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span className={`h-7 w-7 rounded-full flex items-center justify-center ${active ? "text-[#0b0b0d]" : "text-white/70"}`}
        style={{ background: active ? "#66d9ff" : "rgba(255,255,255,0.08)" }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-white truncate">{label}</span>
        <span className="block text-[10px] text-white/45 truncate">{sub}</span>
      </span>
    </button>
  );
}

function Slider({ icon, label, value, onChange }: {
  icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-white/55 mb-1.5">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: "#66d9ff" }} />
        <input type="range" min={0} max={100} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
    </div>
  );
}
