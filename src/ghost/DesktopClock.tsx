import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { usePersonalization } from "./PersonalizationProvider";
import { CLOCK_COLORS } from "./personalization";

export function DesktopClock() {
  const { hasFullscreen, locked, windows, showLauncher } = useGhost();
  const { clock, setShowClockEditor } = usePersonalization();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  if (hasFullscreen || locked || showLauncher || windows.some((w) => !w.minimized) || !now) return null;
  return (
    <div className="desktop-clock" data-desktop-clock data-no-ctx onContextMenu={event => { event.preventDefault(); event.stopPropagation(); setShowClockEditor(true); }} style={{ left: `${clock.x}%`, top: `${clock.y}%`, opacity: clock.opacity / 100, color: CLOCK_COLORS[clock.color], mixBlendMode: clock.blend, "--clock-size": `${clock.size}px`, "--clock-detail-size": `${clock.detailSize}px` } as React.CSSProperties}>
      <div className="desktop-clock-day">{clock.text || now.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()}</div>
      {clock.date && <div className="desktop-clock-date">{now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</div>}
      {clock.time && <div className="desktop-clock-time">- {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} -</div>}
    </div>
  );
}
