import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGhost } from "../store";
import { Cloud, Mail, Gamepad2, Loader2, RotateCw, Maximize, Star, Flame, Wifi, Copy, RefreshCw, Film, ChevronRight, ArrowLeft } from "lucide-react";
import { proxify } from "../proxy";

const RACCOON = "https://www.raccoongame.com/#/platform/cloudgame";
const CINESTREAM = "https://cinesteam.cine-softwares.workers.dev/";
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
type CloudSource = "raccoon" | "cinestream";

export function GhostCloudApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [tab, setTab] = useState<Tab>("cloud");
  const [source, setSource] = useState<CloudSource | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [phase, setPhase] = useState<"intro" | "loading" | "live">("intro");
  const [raccoonLoaded, setRaccoonLoaded] = useState(false);
  const [cineLoaded, setCineLoaded] = useState(false);
  const [mailLoaded, setMailLoaded] = useState(false);
  const [raccoonReload, setRaccoonReload] = useState(0);
  const [cineReload, setCineReload] = useState(0);
  const [mailReload, setMailReload] = useState(0);

  const launchCloud = (s: CloudSource) => {
    setSource(s);
    setShowPicker(false);
    setPhase("loading");
    setTimeout(() => setPhase("live"), 1600);
  };

  const me = windows.find((w) => w.appId === "ghostcloud");
  const requestFullscreen = () => { if (me) toggleFullscreen(me.id); };
  const backToPicker = () => { setShowPicker(true); setPhase("intro"); setSource(null); };

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-violet-950/80 via-black to-fuchsia-950/80 border-b border-fuchsia-500/15 relative">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-[0_0_18px_rgba(232,121,249,.5)]">
            <Cloud className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-black tracking-widest bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">GHOSTCLOUD</div>
            <div className="text-[9px] tracking-[0.4em] text-white/40 font-mono">DUAL RELAY · PERSISTENT SESSION</div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-black/50 ring-1 ring-white/10">
          <TabButton active={tab === "cloud"} onClick={() => setTab("cloud")} icon={<Gamepad2 className="h-3 w-3" />} label="Cloud" />
          <TabButton active={tab === "mail"} onClick={() => setTab("mail")} icon={<Mail className="h-3 w-3" />} label="TempMail" />
        </div>

        <div className="flex items-center gap-2">
          {!showPicker && tab === "cloud" && (
            <button onClick={backToPicker} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-white/70 ring-1 ring-white/15 hover:bg-white/10">
              <ArrowLeft className="h-3 w-3" /> SWITCH
            </button>
          )}
          <button onClick={requestFullscreen} title="Immersive fullscreen"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-fuchsia-200 ring-1 ring-fuchsia-400/30 hover:bg-fuchsia-500/15 transition">
            <Maximize className="h-3 w-3" /> IMMERSE
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="absolute inset-0" style={{ visibility: tab === "cloud" ? "visible" : "hidden", pointerEvents: tab === "cloud" ? "auto" : "none" }}>
          <AnimatePresence mode="wait">
            {showPicker && <SourcePicker key="picker" onPick={launchCloud} />}
            {!showPicker && phase === "loading" && <CloudLoader key="loader" source={source!} />}
          </AnimatePresence>
          {/* keep both iframes mounted once launched */}
          <div style={{ display: !showPicker && phase === "live" && source === "raccoon" ? "block" : "none", position: "absolute", inset: 0 }}>
            <CloudFrame label="RACCOON RELAY" url={RACCOON} loaded={raccoonLoaded} onLoad={() => setRaccoonLoaded(true)}
              reload={raccoonReload} onReload={() => { setRaccoonLoaded(false); setRaccoonReload((r) => r + 1); }} accent="fuchsia" />
          </div>
          <div style={{ display: !showPicker && phase === "live" && source === "cinestream" ? "block" : "none", position: "absolute", inset: 0 }}>
            <CloudFrame label="CINECLOUD · CINESTREAM" url={proxify(CINESTREAM)} loaded={cineLoaded} onLoad={() => setCineLoaded(true)}
              reload={cineReload} onReload={() => { setCineLoaded(false); setCineReload((r) => r + 1); }} accent="rose" />
          </div>
        </div>
        <div className="absolute inset-0" style={{ visibility: tab === "mail" ? "visible" : "hidden", pointerEvents: tab === "mail" ? "auto" : "none" }}>
          <TempMailView loaded={mailLoaded} onLoad={() => setMailLoaded(true)}
            reload={mailReload} onReload={() => { setMailLoaded(false); setMailReload((r) => r + 1); }} />
        </div>
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

function SourcePicker({ onPick }: { onPick: (s: CloudSource) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 overflow-y-auto scrollbar-hide bg-gradient-to-br from-black via-purple-950/30 to-black">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />

      <div className="relative px-6 pt-8 pb-4 text-center">
        <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300/70">CHOOSE YOUR CLOUD</div>
        <h1 className="text-4xl font-black mt-2 neon-text">WHAT DO YOU WANT TO PLAY?</h1>
        <p className="text-sm text-white/50 mt-2">Pick a relay. Switch any time. Sessions stay alive.</p>
      </div>

      <div className="px-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <PickerCard
          onClick={() => onPick("raccoon")}
          title="GHOSTCLOUD"
          subtitle="RACCOON · AAA mobile"
          desc="Stream Genshin, Honkai, PUBG, Wuthering Waves and more in 4K HDR."
          icon={<Cloud className="h-8 w-8 text-white" />}
          gradient="from-violet-600 via-fuchsia-700 to-purple-900"
          tags={["4K", "120 FPS", "MOBILE AAA"]}
        />
        <PickerCard
          onClick={() => onPick("cinestream")}
          title="CINECLOUD"
          subtitle="CINESTREAM · Arcade universe"
          desc="The hidden student arcade. Hundreds of pick-up-and-play titles."
          icon={<Film className="h-8 w-8 text-white" />}
          gradient="from-rose-600 via-fuchsia-700 to-indigo-900"
          tags={["INSTANT", "STUDENT", "EXCLUSIVE"]}
        />
      </div>

      <div className="px-6 pt-8">
        <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest text-white/55 max-w-3xl mx-auto">
          <Flame className="h-3 w-3 text-orange-400" /> TRENDING ON GHOSTCLOUD
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {FEATURED_GAMES.map((g, i) => (
            <motion.button key={g.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.04, y: -4 }} onClick={() => onPick("raccoon")}
              className="relative aspect-[4/5] rounded-xl overflow-hidden ring-1 ring-white/10 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <Gamepad2 className="absolute top-3 right-3 h-4 w-4 text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[10px] text-fuchsia-300 font-mono">{g.tag}</div>
                <div className="text-sm font-bold leading-tight">{g.name}</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300"><Star className="h-2.5 w-2.5 fill-amber-300" /> 4.{(i % 9) + 1}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="h-8" />
    </motion.div>
  );
}

function PickerCard({ onClick, title, subtitle, desc, icon, gradient, tags }: { onClick: () => void; title: string; subtitle: string; desc: string; icon: React.ReactNode; gradient: string; tags: string[] }) {
  return (
    <motion.button whileHover={{ y: -4, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick}
      className="group relative overflow-hidden rounded-2xl text-left ring-1 ring-white/15 shadow-[0_20px_40px_-10px_rgba(0,0,0,.7)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,.25),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,.18)_50%,transparent_65%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      <div className="relative p-5 flex flex-col gap-3 h-full">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-black/40 ring-1 ring-white/20 flex items-center justify-center">{icon}</div>
          <div className="flex-1">
            <div className="text-[10px] font-mono tracking-[0.3em] text-white/70">{subtitle}</div>
            <div className="text-2xl font-black tracking-tight">{title}</div>
          </div>
          <ChevronRight className="h-6 w-6 text-white/80" />
        </div>
        <p className="text-sm text-white/85">{desc}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((t) => (
            <span key={t} className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-black/30 ring-1 ring-white/20">{t}</span>
          ))}
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function CloudLoader({ source }: { source: CloudSource }) {
  const STEPS = source === "raccoon"
    ? ["INITIALIZING SECURE TUNNEL", "AUTHENTICATING WITH RACCOON", "SPINNING UP GPU INSTANCE", "STREAMING FRAMES…"]
    : ["RESOLVING CINECLOUD RELAY", "WARMING ARCADE CACHE", "MOUNTING GAME VAULT", "STREAMING ARCADE…"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => Math.min(i + 1, STEPS.length - 1)), 400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
        <div className={`h-28 w-28 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(232,121,249,.6)] ${source === "raccoon" ? "bg-gradient-to-br from-fuchsia-500 to-violet-700" : "bg-gradient-to-br from-rose-500 to-fuchsia-700"}`}>
          {source === "raccoon" ? <Cloud className="h-12 w-12 text-white" /> : <Film className="h-12 w-12 text-white" />}
        </div>
        <motion.div animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
          className="absolute inset-0 rounded-3xl ring-2 ring-fuchsia-400" />
      </motion.div>
      <div className="mt-8 text-2xl font-black neon-text tracking-[0.3em]">{source === "raccoon" ? "GHOSTCLOUD" : "CINECLOUD"}</div>
      <div className="mt-2 text-[10px] tracking-[0.5em] text-fuchsia-300/70 font-mono">{STEPS[idx]}</div>
      <div className="mt-6 w-72 h-[3px] bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.4, ease: "easeInOut" }} className="h-full gradient-neon" />
      </div>
    </motion.div>
  );
}

function CloudFrame({ label, url, loaded, onLoad, reload, onReload, accent }: { label: string; url: string; loaded: boolean; onLoad: () => void; reload: number; onReload: () => void; accent: "fuchsia" | "rose" }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const border = accent === "fuchsia" ? "border-fuchsia-500/15" : "border-rose-500/20";
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <div className={`flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-violet-950/60 via-black to-fuchsia-950/60 border-b ${border}`}>
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-fuchsia-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
          {label} · LIVE · SESSION PERSISTED
        </div>
        <div className="flex items-center gap-1">
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-300/80"><Wifi className="h-3 w-3" /> 18ms</span>
          <button onClick={onReload} className="p-1.5 rounded hover:bg-white/10 text-white/60"><RotateCw className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="relative flex-1 bg-black">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" />
            <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300">SYNCING…</div>
          </div>
        )}
        <iframe key={reload} ref={ref} src={url} title={label}
          onLoad={onLoad}
          className="w-full h-full bg-black"
          allow="autoplay; fullscreen; encrypted-media; clipboard-write; gamepad"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="no-referrer" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
      </div>
    </div>
  );
}

function TempMailView({ loaded, onLoad, reload, onReload }: { loaded: boolean; onLoad: () => void; reload: number; onReload: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/60 via-black to-fuchsia-950/40 border-b border-cyan-500/15">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.4em] font-mono text-cyan-300">DISPOSABLE INBOX · PERSISTENT</div>
            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">GHOST TEMPMAIL</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ring-cyan-400/30 text-[11px] font-mono tracking-wider text-cyan-200 hover:bg-cyan-500/15">
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
