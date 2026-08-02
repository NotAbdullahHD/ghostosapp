import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppDef, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { LayoutGrid } from "lucide-react";

const DISCORD_URL = "https://discord.gg/AyT6Mu8c5f";

// Curated dock — the essentials.
const DOCK_APPS: AppId[] = ["browser", "ghostcloud", "games", "movies", "music", "chat", "files", "settings"];

const REVEAL_ZONE = 90; // px from bottom that reveals the hidden dock

export function Dock() {
  const { openApp, windows, toggleLauncher, showLauncher } = useGhost();
  const mouseX = useMotionValue<number | null>(null);
  const [revealed, setRevealed] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const dockApps = DOCK_APPS.map((id) => APPS.find((a) => a.id === id)).filter(Boolean) as AppDef[];

  // Auto-hide: dock stays hidden until the pointer reaches the bottom edge.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(false), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setRevealed(window.innerHeight - e.clientY <= REVEAL_ZONE);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  const visible = revealed || pinnedOpen || showLauncher;

  return (
    <>
      {/* invisible hover strip so the dock can be summoned reliably */}
      <div className="fixed bottom-0 inset-x-0 h-6 z-[590]" onMouseEnter={() => setRevealed(true)} />

      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: visible ? 0 : 96, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={() => setPinnedOpen(true)}
        onMouseLeave={() => setPinnedOpen(false)}
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[600]"
      >
        <motion.div
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(null)}
          className="glass-panel rounded-[22px] px-3 pt-2 pb-1.5 flex items-end gap-1.5"
        >
          <LauncherDockIcon mouseX={mouseX} active={showLauncher} onClick={toggleLauncher} />
          <Divider />
          {dockApps.map((app) => (
            <DockIcon
              key={app.id}
              app={app}
              mouseX={mouseX}
              isOpen={windows.some((w) => w.appId === app.id)}
              onClick={() => openApp(app.id, app.name)}
            />
          ))}
          <Divider />
          <DiscordDockIcon mouseX={mouseX} />
          <Divider />
          <DockClock />
        </motion.div>
      </motion.div>
    </>
  );
}

function Divider() {
  return <span className="self-stretch w-px mx-1 my-2 bg-white/10" />;
}

function useMagnify(mouseX: MotionValue<number | null>, ref: React.RefObject<HTMLDivElement | null>, base = 46, peak = 66) {
  const distance = useTransform(mouseX, (mx) => {
    if (mx === null || !ref.current) return 9999;
    const rect = ref.current.getBoundingClientRect();
    return mx - (rect.left + rect.width / 2);
  });
  const size = useTransform(distance, [-130, -65, 0, 65, 130], [base, (base + peak) / 2, peak, (base + peak) / 2, base]);
  const lift = useTransform(distance, [-130, 0, 130], [0, -12, 0]);
  return { size, lift };
}

function DockIcon({ app, mouseX, isOpen, onClick }: { app: AppDef; mouseX: MotionValue<number | null>; isOpen: boolean; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { size, lift } = useMagnify(mouseX, ref);

  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title={app.name}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 480, damping: 30, mass: 0.35 }}
        whileTap={{ scale: 0.86 }}
        className="relative"
      >
        <AppIcon id={app.id} size={64} className="!w-full !h-full" />
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[11px] whitespace-nowrap bg-[#141416]/95 text-white/90 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-xl">
          {app.name}
        </span>
      </motion.div>
      <motion.span
        initial={false}
        animate={{ width: isOpen ? 16 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="mt-1 h-[3px] rounded-full bg-[#66d9ff] shadow-[0_0_10px_rgba(102,217,255,.8)]"
      />
    </button>
  );
}

function LauncherDockIcon({ mouseX, active, onClick }: { mouseX: MotionValue<number | null>; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { size, lift } = useMagnify(mouseX, ref);
  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title="All apps">
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.4 }}
        whileTap={{ scale: 0.88 }}
        className="relative rounded-[18px] flex items-center justify-center overflow-hidden"
        // eslint-disable-next-line react/forbid-dom-props
      >
        <span
          className="absolute inset-0 rounded-[18px]"
          style={{
            background: active
              ? "linear-gradient(160deg, #3aa9d6, #1d6a8a)"
              : "linear-gradient(160deg, #26262b 0%, #17171a 55%, #101013 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.14), 0 10px 24px -12px rgba(0,0,0,.9)",
          }}
        />
        <LayoutGrid className="relative h-6 w-6" strokeWidth={1.8} style={{ color: active ? "#eaf9ff" : "#66d9ff" }} />
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[11px] whitespace-nowrap bg-[#141416]/95 text-white/90 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-xl">
          All apps
        </span>
      </motion.div>
      <span className={`mt-1 h-[3px] rounded-full transition-all ${active ? "w-4 bg-[#66d9ff] shadow-[0_0_10px_rgba(102,217,255,.8)]" : "w-0"}`} />
    </button>
  );
}

function DiscordDockIcon({ mouseX }: { mouseX: MotionValue<number | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const { size, lift } = useMagnify(mouseX, ref);

  return (
    <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="group relative flex flex-col items-center" title="GhostOS Discord">
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.4 }}
        whileTap={{ scale: 0.88 }}
        className="relative rounded-[18px] flex items-center justify-center overflow-hidden"
      >
        <span
          className="absolute inset-0 rounded-[18px]"
          style={{
            background: "linear-gradient(160deg, #26262b 0%, #17171a 55%, #101013 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.14), 0 10px 24px -12px rgba(0,0,0,.9)",
          }}
        />
        <svg viewBox="0 0 24 24" className="relative h-6 w-6" fill="#8ea6ff">
          <path d="M19.27 5.33A19.4 19.4 0 0 0 14.4 4l-.21.4a17.7 17.7 0 0 1 4.41 1.4 14.4 14.4 0 0 0-12.2 0 17.7 17.7 0 0 1 4.4-1.4L10.6 4a19.4 19.4 0 0 0-4.87 1.33A20.6 20.6 0 0 0 2.5 16.5a19.4 19.4 0 0 0 5.92 3l.46-.66a13 13 0 0 1-2.96-1.42c.25-.18.5-.37.74-.57a13 13 0 0 0 11.7 0c.24.2.49.39.74.57a13 13 0 0 1-2.97 1.43l.46.66a19.4 19.4 0 0 0 5.93-3 20.6 20.6 0 0 0-3.25-11.18ZM9.5 14.3c-.96 0-1.75-.9-1.75-2s.78-2 1.75-2 1.76.9 1.75 2c0 1.1-.78 2-1.75 2Zm5 0c-.96 0-1.75-.9-1.75-2s.78-2 1.75-2 1.76.9 1.75 2c0 1.1-.78 2-1.75 2Z" />
        </svg>
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400" />
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-[11px] whitespace-nowrap bg-[#141416]/95 text-white/90 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-xl">
          Discord
        </span>
      </motion.div>
      <span className="mt-1 h-[3px] w-0" />
    </a>
  );
}

function DockClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return (
    <div className="flex flex-col items-end justify-center px-3 py-1.5 rounded-xl select-none cursor-default whitespace-nowrap min-w-[86px]">
      <span className="text-sm font-medium tabular-nums text-white/90">{time}</span>
      <span className="text-[10px] text-white/45">{date}</span>
    </div>
  );
}
