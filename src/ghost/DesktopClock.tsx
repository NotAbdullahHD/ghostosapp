import { useEffect, useState } from "react";
import { useGhost } from "./store";

/** Minimal left-aligned desktop clock — day name, date and time between hairlines. */
export function DesktopClock() {
  const { hasFullscreen, locked } = useGhost();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);

  if (hasFullscreen || locked || !now) return null;

  const day = now.toLocaleDateString([], { weekday: "long" }).toUpperCase();
  const date = now
    .toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(/,/g, "");
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="pointer-events-none absolute left-[7%] top-1/2 z-[400] -translate-y-1/2 select-none">
      <div className="mx-auto mb-6 h-14 w-px bg-white/20" />
      <div className="text-[clamp(34px,5vw,64px)] font-extralight leading-none tracking-[0.18em] text-white/90">
        {day}
      </div>
      <div className="mt-5 text-center text-[12px] font-light tracking-[0.42em] text-white/60">{date}</div>
      <div className="mt-2 text-center text-[12px] font-light tracking-[0.42em] tabular-nums text-white/45">
        - {time} -
      </div>
      <div className="mx-auto mt-6 h-14 w-px bg-white/20" />
    </div>
  );
}
