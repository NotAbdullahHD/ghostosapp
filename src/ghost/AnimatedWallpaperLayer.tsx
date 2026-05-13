import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Wallpaper } from "./store";

export function AnimatedWallpaperLayer({ wallpaper }: { wallpaper: Wallpaper | undefined }) {
  if (!wallpaper?.animated) return null;
  switch (wallpaper.animated) {
    case "city":    return <CityLayer />;
    case "rain":    return <RainLayer />;
    case "grid":    return <GridLayer />;
    case "aurora":  return <AuroraLayer />;
    case "glitch":  return <GlitchLayer />;
    default:        return null;
  }
}

function AuroraLayer() {
  return (
    <>
      <motion.div className="pointer-events-none absolute -inset-32 mix-blend-screen"
        style={{ background: "radial-gradient(ellipse 50% 35% at 30% 30%, rgba(168,85,247,.55), transparent 60%)" }}
        animate={{ x: [0, 60, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="pointer-events-none absolute -inset-32 mix-blend-screen"
        style={{ background: "radial-gradient(ellipse 45% 30% at 70% 70%, rgba(34,211,238,.45), transparent 60%)" }}
        animate={{ x: [0, -50, 40, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} />
    </>
  );
}

function CityLayer() {
  // distant cyberpunk skyline silhouette + drifting lights
  const lights = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: (i * 47) % 100,
    delay: (i * 0.3) % 6,
    hue: i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a855f7" : "#ec4899",
  })), []);
  return (
    <>
      {/* horizon glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168,85,247,.4), transparent 60%)" }} />
      {/* skyline */}
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-1/2 opacity-90" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1a0540" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" />
          </linearGradient>
        </defs>
        <path fill="url(#sky)" d="M0,400 L0,260 L60,260 L60,200 L120,200 L120,250 L180,250 L180,160 L240,160 L240,220 L300,220 L300,180 L360,180 L360,240 L420,240 L420,150 L480,150 L480,210 L540,210 L540,170 L600,170 L600,230 L660,230 L660,140 L720,140 L720,200 L780,200 L780,170 L840,170 L840,250 L900,250 L900,180 L960,180 L960,220 L1020,220 L1020,160 L1080,160 L1080,240 L1140,240 L1140,200 L1200,200 L1200,400 Z" />
      </svg>
      {/* window lights blinking */}
      {lights.map((l, i) => (
        <motion.span key={i}
          className="pointer-events-none absolute h-[2px] w-[2px] rounded-full"
          style={{ left: `${l.left}%`, bottom: `${10 + (i * 7) % 30}%`, background: l.hue, boxShadow: `0 0 6px ${l.hue}` }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: l.delay }} />
      ))}
      {/* drone light */}
      <motion.span className="pointer-events-none absolute h-1 w-1 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,.9)]"
        animate={{ x: ["-10vw", "110vw"], y: ["20vh", "30vh", "20vh"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
    </>
  );
}

function RainLayer() {
  const drops = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    duration: 0.6 + Math.random() * 0.8,
    delay: Math.random() * 2,
    height: 14 + Math.random() * 26,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d, i) => (
        <motion.span key={i}
          className="absolute w-px bg-gradient-to-b from-transparent via-cyan-200/60 to-transparent"
          style={{ left: `${d.left}%`, height: d.height }}
          initial={{ y: "-10vh" }}
          animate={{ y: "110vh" }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "linear" }} />
      ))}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(232,121,249,.18), transparent 60%)" }} />
    </div>
  );
}

function GridLayer() {
  return (
    <>
      <motion.div className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,140,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,140,.5) 1px, transparent 1px)", backgroundSize: "44px 44px" }}
        animate={{ backgroundPositionY: ["0px", "44px"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,.7) 100%)" }} />
    </>
  );
}

function GlitchLayer() {
  return (
    <>
      <motion.div className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{ background: "linear-gradient(90deg, rgba(0,255,200,.06), rgba(255,0,150,.06))" }}
        animate={{ opacity: [0.3, 0.8, 0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="pointer-events-none absolute inset-x-0 h-12"
        style={{ background: "linear-gradient(180deg, rgba(168,85,247,.0), rgba(168,85,247,.25), rgba(168,85,247,.0))" }}
        animate={{ y: ["-10%", "110%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }} />
    </>
  );
}
