import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wifi, BatteryFull, Bell, SlidersHorizontal, Radio, Lock } from "lucide-react";
import { useGhost } from "./store";
import { GLASS } from "./glass";

/**
 * Top chrome, split into three pieces:
 *  · controls pill (GhostDrop, lock, wifi/battery/control center) — top right
 *  · small time pill — top center
 *  · round notification button — top right corner
 */
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
    <>
      {/* Time — top center */}
      <motion.div
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-1/2 top-3 z-[600] -translate-x-1/2"
      >
        <button
          onClick={toggleControlCenter}
          style={GLASS}
          className="flex h-8 items-center gap-2 rounded-full px-3.5 text-white/90 transition hover:bg-white/20"
          title="Date and time"
        >
          <span className="text-[12px] font-medium tabular-nums">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span className="text-[11px] text-white/65">
            {now.toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
        </button>
      </motion.div>

      {/* Controls + notifications — top right */}
      <motion.div
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-3 top-3 z-[600] flex items-center gap-2"
      >
        <div className="flex items-center gap-0.5 rounded-full px-1.5 py-1 text-white/80" style={GLASS}>
          <TrayButton label="GhostDrop" active={showGhostDrop} onClick={toggleGhostDrop}>
            <Radio className="h-[15px] w-[15px]" />
          </TrayButton>
          <TrayButton label="Lock GhostOS" onClick={() => setLocked(true)}>
            <Lock className="h-[15px] w-[15px]" />
          </TrayButton>
          <button
            onClick={toggleControlCenter}
            title="Control Center"
            className={`flex h-8 items-center gap-2 rounded-full px-2.5 transition-colors duration-150 ${showControlCenter ? "bg-white/25 text-white" : "hover:bg-white/15 hover:text-white"}`}
          >
            <Wifi className="h-[15px] w-[15px]" />
            <BatteryFull className="h-[15px] w-[15px]" />
            <SlidersHorizontal className="h-[15px] w-[15px]" />
          </button>
        </div>

        <button
          onClick={toggleNotifCenter}
          title="Notifications"
          style={GLASS}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 ${showNotifCenter ? "bg-white/25 text-white" : ""}`}
        >
          <Bell className="h-[16px] w-[16px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-black/30" style={{ background: "#66d9ff" }} />
          )}
        </button>
      </motion.div>
    </>
  );
}

function TrayButton({ label, active, onClick, children }: {
  label: string; active?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150 ${active ? "bg-white/25 text-white" : "hover:bg-white/15 hover:text-white"}`}
    >
      {children}
    </button>
  );
}
