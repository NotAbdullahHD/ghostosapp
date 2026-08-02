import { motion } from "framer-motion";
import { useGhost } from "./store";

export function GhostLogo({ size = 80, glow = true, interactive = false }: { size?: number; glow?: boolean; interactive?: boolean }) {
  const { unlockExclusive, unlocked, pushNotification } = useGhost();
  const handleClick = () => {
    if (!interactive) return;
    const KEY = "ghost.logoClicks";
    const next = (parseInt(sessionStorage.getItem(KEY) || "0", 10) || 0) + 1;
    sessionStorage.setItem(KEY, String(next));
    if (next >= 6 && !unlocked["yuta"]) {
      unlockExclusive("yuta");
      sessionStorage.setItem(KEY, "0");
    } else if (next >= 3 && next < 6 && !unlocked["yuta"]) {
      pushNotification({ title: "GHOST WHISPERS", body: `${6 - next} more taps until something awakens…` });
    }
  };
  return (
    <motion.div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center ${interactive ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
      whileHover={interactive ? { scale: 1.08 } : undefined}
      whileTap={interactive ? { scale: 0.92 } : undefined}
      animate={
        glow
          ? {
              filter: [
                "drop-shadow(0 0 14px rgba(102,217,255,.28))",
                "drop-shadow(0 0 26px rgba(102,217,255,.45))",
                "drop-shadow(0 0 14px rgba(102,217,255,.28))",
              ],
            }
          : undefined
      }
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id="ghostGrad" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#dff6ff" />
            <stop offset="100%" stopColor="#66d9ff" />
          </linearGradient>
        </defs>
        <path
          d="M50 8 C26 8 14 24 14 46 V86 L24 78 L34 86 L44 78 L54 86 L64 78 L74 86 L86 78 V46 C86 24 74 8 50 8 Z"
          fill="url(#ghostGrad)"
        />
        <circle cx="38" cy="46" r="6" fill="#0b0b0d" />
        <circle cx="62" cy="46" r="6" fill="#0b0b0d" />
        <circle cx="38" cy="44.5" r="1.9" fill="#ffffff" opacity="0.9" />
        <circle cx="62" cy="44.5" r="1.9" fill="#ffffff" opacity="0.9" />
      </svg>
    </motion.div>
  );
}
