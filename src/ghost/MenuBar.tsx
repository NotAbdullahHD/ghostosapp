import { motion } from "framer-motion";
import { Wifi, BatteryFull, Volume2, Bell, Search } from "lucide-react";
import { useGhost } from "./store";

export function MenuBar() {
  const { toggleNotifCenter, notifications } = useGhost();
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 h-9 z-[500] flex items-center justify-between px-5 text-xs font-mono"
      style={{ background: "linear-gradient(180deg, rgba(10,5,20,.7), rgba(10,5,20,.3))", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.05)" }}
    >
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 neon-text font-bold tracking-widest">
          <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400 animate-ghost-pulse" />
          GHOSTOS
        </div>
        <div className="hidden sm:flex items-center gap-4 text-white/50">
          <span className="hover:text-white/90 cursor-default transition">File</span>
          <span className="hover:text-white/90 cursor-default transition">Edit</span>
          <span className="hover:text-white/90 cursor-default transition">View</span>
          <span className="hover:text-white/90 cursor-default transition">Window</span>
          <span className="hover:text-white/90 cursor-default transition">Help</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-white/70">
        <span className="hidden md:inline text-[10px] tracking-[0.3em] text-fuchsia-300/60">SPECTRAL · ONLINE</span>
        <Search className="h-3.5 w-3.5 hover:text-white transition cursor-pointer" />
        <Wifi className="h-3.5 w-3.5" />
        <Volume2 className="h-3.5 w-3.5" />
        <BatteryFull className="h-3.5 w-3.5" />
        <button onClick={toggleNotifCenter} className="relative hover:text-fuchsia-300 transition">
          <Bell className="h-3.5 w-3.5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,.9)]" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
