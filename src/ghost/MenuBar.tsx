import { motion } from "framer-motion";
import { Wifi, BatteryFull, Volume2, Bell, Search, Lock, Radio, SlidersHorizontal } from "lucide-react";
import { useGhost } from "./store";
import { GhostLogo } from "./GhostLogo";

export function MenuBar() {
  const { toggleNotifCenter, notifications, toggleLauncher, setLocked, toggleGhostDrop, showGhostDrop, toggleControlCenter, showControlCenter } = useGhost();
  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 h-9 z-[500] flex items-center justify-between px-5 text-xs font-mono"
      style={{ background: "linear-gradient(180deg, rgba(10,5,20,.7), rgba(10,5,20,.3))", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.05)" }}
    >
      <div className="flex items-center gap-5">
        <button onClick={toggleLauncher} className="flex items-center gap-2 neon-text font-bold tracking-widest hover:text-white transition group">
          <span className="inline-flex items-center justify-center h-5 w-5 -my-1">
            <GhostLogo size={20} glow={false} interactive />
          </span>
          GHOSTOS
        </button>
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
        <button onClick={toggleLauncher} className="hover:text-white transition" title="App launcher (search)">
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={toggleControlCenter}
          className={`flex items-center gap-2 px-2 py-1 rounded-md transition ${showControlCenter ? "bg-white/10 text-white" : "hover:bg-white/5 hover:text-white"}`}
          title="Control Center"
        >
          <Wifi className="h-3.5 w-3.5" />
          <Volume2 className="h-3.5 w-3.5" />
          <BatteryFull className="h-3.5 w-3.5" />
          <SlidersHorizontal className="h-3.5 w-3.5 text-fuchsia-300/80" />
        </button>
        <button
          onClick={toggleGhostDrop}
          className={`transition ${showGhostDrop ? "text-fuchsia-300" : "hover:text-fuchsia-300"}`}
          title="GhostDrop"
        >
          <Radio className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setLocked(true)} className="hover:text-fuchsia-300 transition" title="Lock GhostOS">
          <Lock className="h-3.5 w-3.5" />
        </button>
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
