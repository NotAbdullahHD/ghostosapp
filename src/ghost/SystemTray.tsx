import { useEffect, useState } from "react";
import { Wifi, WifiOff, Battery, BatteryCharging, Bell, SlidersHorizontal, Radio, Lock, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGhost } from "./store";
import { GLASS } from "./glass";
import { useDeviceStatus } from "./useDeviceStatus";

export function SystemTray() {
  const { toggleControlCenter, toggleNotifCenter, notifications, toggleGhostDrop, setLocked, toggleLauncher, windows } = useGhost();
  const { online, battery } = useDeviceStatus();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const tick = () => setNow(new Date()); tick(); const t = setInterval(tick, 1000); return () => clearInterval(t); }, []);
  const active = [...windows].filter(w => !w.minimized).sort((a,b) => b.z-a.z)[0];
  return <>
    <div className="fixed left-2 top-2 z-[600] flex gap-1.5">
      <Button variant="desktop" size="sm" style={GLASS} className="desktop-top-button px-2 gap-2" title="All apps" onClick={toggleLauncher}><LayoutGrid className="h-3 w-3" /><span className="hidden sm:inline">{active?.title || "GhostOS"}</span></Button>
    </div>
    <Button variant="desktop" size="sm" style={GLASS} className="desktop-top-button fixed left-1/2 top-2 z-[600] -translate-x-1/2 px-2.5 tabular-nums" onClick={toggleControlCenter} title="Date and time">
      {now && <><span className="desktop-top-date">{now.toLocaleDateString("en-GB", { day:"2-digit", month:"short" })}</span><span>{now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false })}</span></>}
    </Button>
    <div className="fixed right-2 top-2 z-[600] flex gap-1.5">
      <div className="flex gap-0.5 rounded-md px-0.5" style={GLASS}>
        <Button variant="desktop" size="icon" className="h-[26px] w-[26px] p-0" title="GhostDrop" onClick={toggleGhostDrop}><Radio className="h-3 w-3" /></Button>
        <Button variant="desktop" size="icon" className="h-[26px] w-[26px] p-0" title="Lock GhostOS" onClick={() => setLocked(true)}><Lock className="h-3 w-3" /></Button>
      </div>
      <Button variant="desktop" size="sm" style={GLASS} className="desktop-top-button gap-2 px-2" title="Control Center" onClick={toggleControlCenter}>
        {online === false ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
        {battery && <span className="hidden sm:flex items-center gap-1 text-[10px]">{battery.charging ? <BatteryCharging className="h-3 w-3"/> : <Battery className="h-3 w-3"/>}{battery.level}%</span>}
        <SlidersHorizontal className="h-3 w-3" />
      </Button>
      <Button variant="desktop" size="icon" style={GLASS} className="relative h-[26px] w-[26px] rounded-full p-0" title="Notifications" onClick={toggleNotifCenter}><Bell className="h-3 w-3" />{notifications.some(n=>!n.read) && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary"/>}</Button>
    </div>
  </>;
}
