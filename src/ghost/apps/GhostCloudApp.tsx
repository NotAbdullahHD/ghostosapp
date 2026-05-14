import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhost } from "../store";
import { Cloud, Mail, Gamepad2, Loader2, RotateCw, Maximize, Star, Flame, Wifi, Copy, RefreshCw } from "lucide-react";

const RACCOON = "https://www.raccoongame.com/#/platform/cloudgame";
const TEMPMAIL = "https://tempmail.ing/";

const FEATURED_GAMES = [
  { name: "Genshin Impact", tag: "OPEN WORLD",  color: "from-cyan-500 via-blue-700 to-indigo-900" },
  { name: "Honkai Star Rail", tag: "RPG",       color: "from-violet-500 via-purple-700 to-indigo-950" },
  { name: "Wuthering Waves", tag: "ACTION",     color: "from-fuchsia-500 via-rose-600 to-purple-900" },
  { name: "PUBG Mobile",     tag: "BATTLE",     color: "from-amber-500 via-orange-700 to-red-900" },
  { name: "Free Fire",       tag: "SHOOTER",    color: "from-rose-500 via-red-700 to-black" },
  { name: "Mobile Legends",  tag: "MOBA",       color: "from-emerald-500 via-teal-700 to-blue-900" },
  { name: "League of Legends", tag: "MOBA",     color: "from-sky-500 via-blue-700 to-indigo-900" },
  { name: "Valorant",        tag: "TACTICAL",   color: "from-red-500 via-rose-700 to-pink-900" },
];

type Tab = "cloud" | "mail";

export function GhostCloudApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [tab, setTab] = useState<Tab>("cloud");
  const [phase, setPhase] = useState<"intro" | "loading" | "live">("intro");
  const [mailLoaded, setMailLoaded] = useState(false);

  useEffect(() => {
    if (tab !== "cloud") return;
    if (phase === "intro") return;
  }, [tab, phase]);

  const launchCloud = () => {
    setPhase("loading");
    setTimeout(() => setPhase("live"), 1800);
  };

  const me = windows.find((w) => w.appId === "ghostcloud");
  const requestFullscreen = () => { if (me) toggleFullscreen(me.id); };

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      {/* Header chrome */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-violet-950/80 via-black to-fuchsia-950/80 border-b border-fuchsia-500/15 relative">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_18px_rgba(232,121,249,.5)]">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-black tracking-widest bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">GHOSTCLOUD</div>
            <div className="text-[9px] tracking-[0.4em] text-white/40 font-mono">RACCOON RELAY · ENCRYPTED</div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-black/50 ring-1 ring-white/10">
          <TabButton active={tab === "cloud"} onClick={() => setTab("cloud")} icon={<Gamepad2 className="h-3 w-3" />} label="Cloud Games" />
          <TabButton active={tab === "mail"} onClick={() => setTab("mail")} icon={<Mail className="h-3 w-3" />} label="TempMail" />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" /> 18 ms · OPTIMAL
          </span>
          <button onClick={requestFullscreen} title="Immersive fullscreen"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-fuchsia-200 ring-1 ring-fuchsia-400/30 hover:bg-fuchsia-500/15 transition">
            <Maximize className="h-3 w-3" /> IMMERSE
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {tab === "cloud" ? (
            <motion.div key="cloud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              {phase === "intro" && <CloudIntro onLaunch={launchCloud} />}
              {phase === "loading" && <CloudLoader />}
              {phase === "live" && <CloudLive />}
            </motion.div>
          ) : (
            <motion.div key="mail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <TempMailView loaded={mailLoaded} onLoad={() => setMailLoaded(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition ${active ? "text-white" : "text-white/50 hover:text-white/85"}`}>
      {active && <motion.span layoutId="ghostcloud-tab" className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 shadow-[0_0_18px_rgba(168,85,247,.5)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
      <span className="relative">{icon}</span>
      <span className="relative">{label}</span>
    </button>
  );
}

function CloudIntro({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-gradient-to-br from-black via-purple-950/30 to-black">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent animate-scan" />

      {/* HERO featured */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-700 via-purple-900 to-black" />
        <div className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "radial-gradient(circle at 70% 40%, white, transparent 50%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-7">
          <span className="text-[10px] tracking-[0.4em] font-mono text-fuchsia-300">FEATURED · CLOUD POWERED BY RACCOON</span>
          <h1 className="text-5xl font-black mt-2 neon-text">GHOSTCLOUD GAMING</h1>
          <p className="text-sm text-white/70 mt-2 max-w-md">Stream AAA mobile titles in 4K from anywhere. No downloads. No installs. Just pure ghost-fast cloud play.</p>
          <div className="flex items-center gap-3 mt-5">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onLaunch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full gradient-neon text-white font-bold text-sm shadow-[0_0_30px_rgba(232,121,249,.5)]">
              <Gamepad2 className="h-4 w-4" /> Launch GhostCloud
            </motion.button>
            <div className="text-[10px] font-mono text-white/40 tracking-widest flex items-center gap-2">
              <Wifi className="h-3 w-3 text-emerald-400" /> 18 MS · 4K HDR · 120 FPS
            </div>
          </div>
        </div>
      </div>

      {/* Trending */}
      <div className="px-6 pt-6">
        <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest text-white/60">
          <Flame className="h-3 w-3 text-orange-400" /> TRENDING ON GHOSTCLOUD
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURED_GAMES.map((g, i) => (
            <motion.button key={g.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.04, y: -4 }}
              onClick={onLaunch}
              className="relative aspect-[4/5] rounded-xl overflow-hidden ring-1 ring-white/10 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
              <Gamepad2 className="absolute top-3 right-3 h-4 w-4 text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[10px] text-fuchsia-300 font-mono">{g.tag}</div>
                <div className="text-sm font-bold leading-tight">{g.name}</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300"><Star className="h-2.5 w-2.5 fill-amber-300" /> 4.{(i % 9) + 1}</div>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/40">
                <div className="h-12 w-12 rounded-full gradient-neon flex items-center justify-center shadow-xl">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-6 py-7 text-center">
        <div className="text-[10px] tracking-[0.4em] text-white/30 font-mono">RACCOON CLOUD · GHOSTOS CERTIFIED RELAY</div>
      </div>
    </div>
  );
}

function CloudLoader() {
  const STEPS = ["INITIALIZING SECURE TUNNEL", "AUTHENTICATING WITH RACCOON RELAY", "SPINNING UP GPU INSTANCE", "STREAMING FRAMES…"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => Math.min(i + 1, STEPS.length - 1)), 400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative">
        <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center shadow-[0_0_60px_rgba(232,121,249,.6)]">
          <Cloud className="h-12 w-12 text-white" />
        </div>
        <motion.div animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl ring-2 ring-fuchsia-400" />
      </motion.div>
      <div className="mt-8 text-2xl font-black neon-text tracking-[0.3em]">GHOSTCLOUD</div>
      <div className="mt-2 text-[10px] tracking-[0.5em] text-fuchsia-300/70 font-mono">{STEPS[idx]}</div>
      <div className="mt-6 w-72 h-[3px] bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: "easeInOut" }} className="h-full gradient-neon" />
      </div>
    </div>
  );
}

function CloudLive() {
  const ref = useRef<HTMLIFrameElement>(null);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-violet-950/60 via-black to-fuchsia-950/60 border-b border-fuchsia-500/15">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-fuchsia-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
          RACCOON RELAY · LIVE INSTANCE · 4K HDR
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { setLoaded(false); setReload((r) => r + 1); }}
            className="p-1.5 rounded hover:bg-white/10 text-white/60"><RotateCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
            <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300">SYNCING CLOUD FRAME…</div>
          </div>
        )}
        <iframe key={reload} ref={ref} src={RACCOON} title="GhostCloud · Raccoon"
          onLoad={() => setLoaded(true)}
          className="w-full h-full bg-black"
          allow="autoplay; fullscreen; encrypted-media; clipboard-write" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
      </div>
    </div>
  );
}

function TempMailView({ loaded, onLoad }: { loaded: boolean; onLoad: () => void }) {
  const [reload, setReload] = useState(0);
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Mini header */}
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/60 via-black to-fuchsia-950/40 border-b border-cyan-500/15">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.4em] font-mono text-cyan-300">DISPOSABLE INBOX</div>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">GHOST TEMPMAIL</h2>
            <p className="text-[11px] text-white/50 mt-1 max-w-md">Burn-on-read inbox. Use for game registrations, sketchy logins, or whenever you need to stay invisible.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { onLoad(); setReload((r) => r + 1); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-cyan-400/30 text-[11px] font-mono tracking-wider text-cyan-200 hover:bg-cyan-500/15">
              <RefreshCw className="h-3 w-3" /> NEW INBOX
            </button>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-300">
              <Copy className="h-3 w-3" /> AUTO-COPY
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-black">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
            <div className="text-[10px] tracking-[0.5em] font-mono text-cyan-200/80">PROVISIONING INBOX…</div>
          </div>
        )}
        <iframe key={reload} src={TEMPMAIL} title="TempMail" onLoad={onLoad}
          className="w-full h-full bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-clipboard-write" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cyan-500/10" />
      </div>
    </div>
  );
}
