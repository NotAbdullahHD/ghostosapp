import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, Volume2, VolumeX, BatteryFull, Bell, SlidersHorizontal, Radio, Lock } from "lucide-react";
import { useGhost } from "./store";

export function SystemTray() {
  const {
    toggleControlCenter, showControlCenter,
    toggleNotifCenter, showNotifCenter, notifications,
    toggleGhostDrop, showGhostDrop, setLocked,
  } = useGhost();
  const [now, setNow] = useState(new Date());
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-2 right-2 z-[600]"
    >
      <div
        className="rounded-2xl px-2 py-1.5 flex items-center gap-0.5 text-white/70"
        style={{
          background: "rgba(20,20,22,0.62)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 44px -22px rgba(0,0,0,.85), inset 0 1px 0 rgba(255,255,255,.06)",
        }}
      >
        <TrayButton label="GhostDrop" active={showGhostDrop} onClick={toggleGhostDrop}>
          <Radio className="h-[15px] w-[15px]" />
        </TrayButton>
        <TrayButton label="Lock GhostOS" onClick={() => setLocked(true)}>
          <Lock className="h-[15px] w-[15px]" />
        </TrayButton>

        <button
          onClick={toggleControlCenter}
          title="Control Center"
          className={`flex items-center gap-2 px-2 h-8 rounded-lg transition-colors duration-150 ${showControlCenter ? "bg-white/[0.12] text-white" : "hover:bg-white/[0.08] hover:text-white"}`}
        >
          <Wifi className="h-[15px] w-[15px]" />
          {muted ? <VolumeX className="h-[15px] w-[15px]" /> : <Volume2 className="h-[15px] w-[15px]" />}
          <BatteryFull className="h-[15px] w-[15px]" />
          <SlidersHorizontal className="h-[15px] w-[15px]" style={{ color: "#66d9ff" }} />
        </button>

        <TrayButton label="Notifications" active={showNotifCenter} onClick={toggleNotifCenter}>
          <span className="relative">
            <Bell className="h-[15px] w-[15px]" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "#66d9ff" }} />}
          </span>
        </TrayButton>

        <button
          onClick={toggleControlCenter}
          className="flex flex-col items-end justify-center px-2 h-8 rounded-lg hover:bg-white/[0.08] transition-colors duration-150 leading-tight"
          title="Date and time"
        >
          <span className="text-[12px] tabular-nums text-white/90">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="text-[9px] text-white/45">
            {now.toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </button>

        {/* keeps the mute control reachable without extra chrome */}
        <button className="sr-only" onClick={() => setMuted((m) => !m)}>Toggle mute</button>
      </div>
    </motion.div>
  );
}

function TrayButton({ label, active, onClick, children }: {
  label: string; active?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors duration-150 ${active ? "bg-white/[0.12] text-white" : "hover:bg-white/[0.08] hover:text-white"}`}
    >
      {children}
    </button>
  );
}
