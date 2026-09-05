import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, BatteryFull, Bell, SlidersHorizontal, Radio, Lock } from "lucide-react";
import { useGhost } from "./store";

export function SystemTray() {
  const {
    toggleControlCenter, showControlCenter,
    toggleNotifCenter, showNotifCenter, notifications,
    toggleGhostDrop, showGhostDrop, setLocked,
  } = useGhost();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-3 top-3 z-[600]"
    >
      <div
        className="flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-white/70"
        style={{
          background: "rgba(18,18,20,0.38)",
          backdropFilter: "blur(22px) saturate(135%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 36px -22px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.07)",
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
          <BatteryFull className="h-[15px] w-[15px]" />
          <SlidersHorizontal className="h-[15px] w-[15px] text-ice" />
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
