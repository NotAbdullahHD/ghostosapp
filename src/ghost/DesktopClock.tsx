import { useEffect, useState } from "react";
import { useGhost } from "./store";

export function DesktopClock() {
  const { hasFullscreen, locked, windows, showLauncher } = useGhost();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  if (hasFullscreen || locked || showLauncher || windows.some((w) => !w.minimized) || !now) return null;
  return (
    <div className="desktop-clock" data-desktop-clock>
      <div className="desktop-clock-day">{now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</div>
      <div className="desktop-clock-date">{now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</div>
      <div className="desktop-clock-time">- {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} -</div>
    </div>
  );
}
