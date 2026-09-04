import { useEffect, useState } from "react";
import { useGhost } from "./store";

function greetingFor(h: number) {
  if (h < 5) return "GOOD NIGHT";
  if (h < 12) return "GOOD MORNING";
  if (h < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

/** Reference-style desktop clock: greeting, wide day name, date and time between hairlines. */
export function DesktopClock() {
  const { hasFullscreen, locked, windows } = useGhost();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 20_000);
    return () => clearInterval(id);
  }, []);

  const anyOpen = windows.some((w) => !w.minimized);
  if (hasFullscreen || locked || anyOpen || !now) return null;

  const [g1, g2] = greetingFor(now.getHours()).split(" ");
  const day = now.toLocaleDateString([], { weekday: "long" }).toUpperCase();
  const date = now
    .toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase()
    .replace(/,/g, "")
    .replace(/\./g, "");
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="pointer-events-none absolute left-[9%] top-1/2 z-[10] -translate-y-1/2 select-none text-center">
      <div className="mx-auto mb-9 h-16 w-px bg-white/25" />

      <div className="text-[11px] font-light leading-[2.4] tracking-[0.5em] text-white/70">
        <div>{g1}</div>
        <div>{g2}</div>
      </div>

      <div
        className="mt-6 whitespace-nowrap text-[clamp(28px,3.6vw,52px)] font-normal leading-none text-white/95"
        style={{ fontFamily: '"Syncopate", var(--font-display)', letterSpacing: "0.06em" }}
      >
        {day}
      </div>

      <div className="mt-7 text-[12px] font-light tracking-[0.42em] text-white/70">{date}</div>
      <div className="mt-2 text-[12px] font-light tracking-[0.42em] tabular-nums text-white/50">
        - {time} -
      </div>

      <div className="mx-auto mt-9 h-16 w-px bg-white/25" />
    </div>
  );
}
