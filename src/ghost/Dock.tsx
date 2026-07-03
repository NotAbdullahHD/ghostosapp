import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useGhost } from "./store";
import { APPS, type AppDef, type AppId } from "./apps";
import { LayoutGrid } from "lucide-react";

const DISCORD_URL = "https://discord.gg/AyT6Mu8c5f";

// Curated dock — only the most important apps.
const DOCK_APPS: AppId[] = ["ghostcloud", "browser", "discover", "settings"];

export function Dock() {
  const { openApp, windows, toggleLauncher, showLauncher } = useGhost();
  const mouseX = useMotionValue<number | null>(null);
  const dockApps = DOCK_APPS.map((id) => APPS.find((a) => a.id === id)).filter(Boolean) as AppDef[];

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[600]"
    >
      <motion.div
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(null)}
        className="glass-strong rounded-2xl px-3 pt-2 pb-1.5 flex items-end gap-2 neon-border shadow-2xl shadow-black/60"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(20,10,40,.55))" }}
      >
        <LauncherDockIcon mouseX={mouseX} active={showLauncher} onClick={toggleLauncher} />
        <span className="self-stretch w-px mx-1 my-1 bg-gradient-to-b from-transparent via-fuchsia-400/30 to-transparent" />
        {dockApps.map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id);
          return (
            <DockIcon key={app.id} app={app} mouseX={mouseX} isOpen={isOpen}
              onClick={() => openApp(app.id, app.name)} />
          );
        })}
        <span className="self-stretch w-px mx-1 my-1 bg-gradient-to-b from-transparent via-fuchsia-400/30 to-transparent" />
        <DiscordDockIcon mouseX={mouseX} />
        <span className="self-stretch w-px mx-1 my-1 bg-gradient-to-b from-transparent via-fuchsia-400/30 to-transparent" />
        <DockClock />
      </motion.div>
      <div className="mx-auto mt-0.5 h-2 w-[80%] opacity-40 blur-md bg-gradient-to-b from-fuchsia-500/30 to-transparent rounded-full" />
    </motion.div>
  );
}

function DockIcon({ app, mouseX, isOpen, onClick }: { app: AppDef; mouseX: MotionValue<number | null>; isOpen: boolean; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (mx) => {
    if (mx === null || !ref.current) return 9999;
    const rect = ref.current.getBoundingClientRect();
    return mx - (rect.left + rect.width / 2);
  });
  const size = useTransform(distance, [-140, -70, 0, 70, 140], [48, 58, 72, 58, 48]);
  const lift = useTransform(distance, [-140, 0, 140], [0, -14, 0]);

  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title={app.name}>
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.35 }}
        whileTap={{ scale: 0.84 }}
        className={`relative rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-white text-2xl font-bold shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/20`}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/15" />
        <span className="relative drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]">{app.icon}</span>
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap bg-black/90 text-white/95 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-white/10 shadow-xl">
          {app.name}
        </span>
      </motion.div>
      <motion.span
        initial={false}
        animate={{ width: isOpen ? 14 : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="mt-1 h-[3px] rounded-full bg-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,1)]"
      />
    </button>
  );
}

function LauncherDockIcon({ mouseX, active, onClick }: { mouseX: MotionValue<number | null>; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (mx) => {
    if (mx === null || !ref.current) return 9999;
    const rect = ref.current.getBoundingClientRect();
    return mx - (rect.left + rect.width / 2);
  });
  const size = useTransform(distance, [-140, 0, 140], [48, 70, 48]);
  const lift = useTransform(distance, [-140, 0, 140], [0, -12, 0]);
  return (
    <button onClick={onClick} className="group relative flex flex-col items-center" title="App Launcher">
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.4 }}
        whileTap={{ scale: 0.86 }}
        className={`relative rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/60 ring-1 ring-white/20 ${active ? "bg-gradient-to-br from-fuchsia-500 to-violet-700" : "bg-gradient-to-br from-zinc-700 via-zinc-800 to-black"}`}
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/15" />
        <LayoutGrid className="relative h-7 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]" />
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap bg-black/90 text-fuchsia-200 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-fuchsia-400/20 shadow-xl">
          ALL APPS
        </span>
      </motion.div>
      <span className={`mt-0.5 h-1 w-1 rounded-full transition-all ${active ? "bg-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,1)]" : "bg-transparent"}`} />
    </button>
  );
}

function DiscordDockIcon({ mouseX }: { mouseX: MotionValue<number | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (mx) => {
    if (mx === null || !ref.current) return 9999;
    const rect = ref.current.getBoundingClientRect();
    return mx - (rect.left + rect.width / 2);
  });
  const size = useTransform(distance, [-140, 0, 140], [48, 70, 48]);
  const lift = useTransform(distance, [-140, 0, 140], [0, -12, 0]);

  return (
    <a href={DISCORD_URL} target="_blank" rel="noreferrer" className="group relative flex flex-col items-center" title="GhostOS Discord">
      <motion.div
        ref={ref}
        style={{ width: size, height: size, y: lift }}
        transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.4 }}
        whileTap={{ scale: 0.86 }}
        className="relative rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/60 ring-1 ring-white/25"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/15" />
        <svg viewBox="0 0 24 24" className="relative h-7 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]" fill="currentColor">
          <path d="M19.27 5.33A19.4 19.4 0 0 0 14.4 4l-.21.4a17.7 17.7 0 0 1 4.41 1.4 14.4 14.4 0 0 0-12.2 0 17.7 17.7 0 0 1 4.4-1.4L10.6 4a19.4 19.4 0 0 0-4.87 1.33A20.6 20.6 0 0 0 2.5 16.5a19.4 19.4 0 0 0 5.92 3l.46-.66a13 13 0 0 1-2.96-1.42c.25-.18.5-.37.74-.57a13 13 0 0 0 11.7 0c.24.2.49.39.74.57a13 13 0 0 1-2.97 1.43l.46.66a19.4 19.4 0 0 0 5.93-3 20.6 20.6 0 0 0-3.25-11.18ZM9.5 14.3c-.96 0-1.75-.9-1.75-2s.78-2 1.75-2 1.76.9 1.75 2c0 1.1-.78 2-1.75 2Zm5 0c-.96 0-1.75-.9-1.75-2s.78-2 1.75-2 1.76.9 1.75 2c0 1.1-.78 2-1.75 2Z"/>
        </svg>
        <motion.span
          className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-black"
          animate={{ scale: [1, 1.25, 1], boxShadow: ["0 0 0 0 rgba(74,222,128,.55)", "0 0 0 8px rgba(74,222,128,0)", "0 0 0 0 rgba(74,222,128,0)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap bg-black/90 text-emerald-300 opacity-0 group-hover:opacity-100 transition pointer-events-none border border-emerald-400/20 shadow-xl">
          DISCORD · CODES
        </span>
        <span className="absolute inset-0 rounded-2xl overflow-hidden">
          <motion.span
            className="absolute -inset-y-2 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
            animate={{ x: ["-150%", "250%"] }}
            transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
      <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,.9)]" />
    </a>
  );
}

function DockClock() {
  const [now, setNow] = useState(new Date());
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const seconds = now.toLocaleTimeString([], { second: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="relative flex flex-col items-end justify-center px-3 py-1 rounded-xl cursor-default select-none"
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(20,10,40,.4))", boxShadow: hovered ? "0 0 0 1px rgba(232,121,249,.35), 0 0 18px rgba(232,121,249,.25)" : "inset 0 0 0 1px rgba(255,255,255,.06)" }}
    >
      <div className="flex items-baseline gap-1 font-mono">
        <span className="text-sm font-bold tracking-wider text-white drop-shadow-[0_0_8px_rgba(232,121,249,.6)]">{time}</span>
        <span className="text-[9px] tracking-widest text-fuchsia-300/70">:{seconds}</span>
      </div>
      <span className="text-[9px] tracking-[0.25em] text-white/55 font-mono">{date.toUpperCase()}</span>
    </motion.div>
  );
}
