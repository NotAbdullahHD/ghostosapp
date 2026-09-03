import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GhostLogo } from "./GhostLogo";
import bootVideo from "@/assets/boot.mp4.asset.json";

const TOTAL_MS = 3400;

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 900);
    const t2 = setTimeout(onDone, TOTAL_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0b0b0d]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        src={bootVideo.url}
        autoPlay
        muted
        playsInline
        aria-hidden
      />
      <div className="absolute inset-0 bg-[#0b0b0d]/55" />

      <motion.div
        className="relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <GhostLogo size={96} />
      </motion.div>


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: phase ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="mt-14 flex flex-col items-center gap-5"
      >
        {/* circular spinner */}
        <div className="relative h-7 w-7">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: "#66d9ff" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-[13px] tracking-[0.02em] text-white/60">Starting GhostOS…</div>
      </motion.div>
    </motion.div>
  );
}
