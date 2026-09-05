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

  const day = now.toLocaleDateString([], { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-[10] -translate-x-1/2 -translate-y-1/2 select-none text-center">
      <div
        className="whitespace-nowrap text-[clamp(36px,5vw,72px)] font-normal leading-none text-white/95"
        style={{ fontFamily: '"Ethnocentric", "Syncopate", sans-serif', letterSpacing: "0" }}
      >
        {day}
      </div>
      <div className="mt-6 text-[13px] font-semibold text-white/80" style={{ fontFamily: '"Montserrat", sans-serif', letterSpacing: "0" }}>{date}</div>
      <div className="mt-3 text-[13px] font-semibold tabular-nums text-white/70" style={{ fontFamily: '"Montserrat", sans-serif', letterSpacing: "0" }}>
        - {time} -
      </div>
    </div>
  );
}
