import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Wallpaper } from "./store";

export function AnimatedWallpaperLayer({ wallpaper }: { wallpaper: Wallpaper | undefined }) {
  if (!wallpaper) return null;

  if (wallpaper.image) {
    return (
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${wallpaper.image})` }}
      />
    );
  }


  // Live video wallpapers take precedence
  if (wallpaper.video) {
    return (
      <>
        <video
          key={wallpaper.id}
          src={wallpaper.video}
          autoPlay loop muted playsInline
          className="pointer-events-none absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(1.05) contrast(1.05)" }}
        />
        {/* darken/vignette so UI remains legible */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,.05) 0%, rgba(0,0,0,.55) 100%)" }} />
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,.0) 60%, rgba(0,0,0,.5) 100%)" }} />
      </>
    );
  }

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
  const lights = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: (i * 47) % 100,
    delay: (i * 0.3) % 6,
    hue: i % 3 === 0 ? "#22d3ee" : i % 3 === 1 ? "#a855f7" : "#ec4899",
  })), []);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168,85,247,.4), transparent 60%)" }} />
      {lights.map((l, i) => (
        <motion.span key={i}
          className="pointer-events-none absolute h-[2px] w-[2px] rounded-full"
          style={{ left: `${l.left}%`, bottom: `${10 + (i * 7) % 30}%`, background: l.hue, boxShadow: `0 0 6px ${l.hue}` }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: l.delay }} />
      ))}
    </>
  );
}

function RainLayer() {
  const drops = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    duration: 0.6 + Math.random() * 0.8,
    delay: Math.random() * 2,
    height: 14 + Math.random() * 26,
    _i: i,
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <motion.span key={d._i}
          className="absolute w-px bg-gradient-to-b from-transparent via-cyan-200/60 to-transparent"
          style={{ left: `${d.left}%`, height: d.height }}
          initial={{ y: "-10vh" }}
          animate={{ y: "110vh" }}
          transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "linear" }} />
      ))}
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
    </>
  );
}
