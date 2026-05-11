import { motion } from "framer-motion";

export function GhostLogo({ size = 80, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      animate={glow ? { filter: ["drop-shadow(0 0 18px rgba(192,132,252,.6))", "drop-shadow(0 0 32px rgba(192,132,252,.9))", "drop-shadow(0 0 18px rgba(192,132,252,.6))"] } : undefined}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <linearGradient id="ghostGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <path
          d="M50 8 C26 8 14 24 14 46 V86 L24 78 L34 86 L44 78 L54 86 L64 78 L74 86 L86 78 V46 C86 24 74 8 50 8 Z"
          fill="url(#ghostGrad)"
          opacity="0.9"
        />
        <circle cx="38" cy="46" r="6" fill="#0a0612" />
        <circle cx="62" cy="46" r="6" fill="#0a0612" />
        <circle cx="38" cy="45" r="2" fill="#fff" />
        <circle cx="62" cy="45" r="2" fill="#fff" />
      </svg>
    </motion.div>
  );
}
