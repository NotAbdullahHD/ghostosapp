import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Flame, Trophy, Gamepad2, Heart, Clock, ArrowLeft, Loader2, Joystick, Zap, Star, Plus, Sparkles, Maximize } from "lucide-react";
import { useGhost } from "../store";
import { proxify } from "../proxy";
import { ArcadeVault } from "./ArcadeVault";

interface Provider {
  id: string;
  name: string;
  tagline: string;
  iconUrl?: string;
  iconEmoji?: string;
  accent: string;
  /** if set, this provider is a single embedded library URL */
  embedUrl?: string;
  /** if set, renders a custom component instead of an embed */
  custom?: "vault";
}

const PROVIDERS: Provider[] = [
  { id: "vault",   name: "Arcade Vault", tagline: "259 Ghost-curated games", iconEmoji: "▣", accent: "from-fuchsia-500 to-rose-700", custom: "vault" },
  { id: "gamezop", name: "Gamezop",      tagline: "Instant HTML5 arcade",   iconEmoji: "🎮", accent: "from-cyan-500 to-blue-700" },
  { id: "gnmath",  name: "GN-Math",      tagline: "Unblocked math arcade",  iconUrl: "https://cdn.jsdelivr.net/gh/snoopyeducation/securly.com@main/classlink.com/math.svg", accent: "from-violet-500 to-indigo-700", embedUrl: "https://gn-math.github.io/" },
  { id: "quizizz", name: "Quizizz",      tagline: "Live learning arena",    iconEmoji: "🧠", accent: "from-emerald-500 to-teal-700", embedUrl: "https://quizizz.com/join" },
  { id: "cloud",   name: "Cloud Vault",  tagline: "Open GhostCloud",        iconEmoji: "☁",  accent: "from-violet-500 to-fuchsia-700" },
];

const ARCADE = [
  { id: "ark",     name: "Ark Defender",    tag: "ACTION",   url: "https://zv1y2i8p.play.gamezop.com/g/SkhljT2fdgb", color: "from-fuchsia-600 via-purple-700 to-indigo-900" },
  { id: "knife",   name: "Knife Up",        tag: "ARCADE",   url: "https://zv1y2i8p.play.gamezop.com/g/r1qDQYcQS",   color: "from-rose-500 via-red-700 to-black" },
  { id: "bubble",  name: "Bubble Shooter",  tag: "PUZZLE",   url: "https://zv1y2i8p.play.gamezop.com/g/B1YKHqA9rb",  color: "from-cyan-500 via-blue-700 to-indigo-900" },
  { id: "tennis",  name: "Stickman Tennis", tag: "SPORTS",   url: "https://zv1y2i8p.play.gamezop.com/g/HJzVLqRcrW",  color: "from-emerald-500 via-teal-700 to-blue-900" },
  { id: "chess",   name: "Chess",           tag: "STRATEGY", url: "https://zv1y2i8p.play.gamezop.com/g/B1YphhMjr-",  color: "from-amber-500 via-orange-700 to-red-900" },
  { id: "ludo",    name: "Mini Ludo",       tag: "CLASSIC",  url: "https://zv1y2i8p.play.gamezop.com/g/H17_5pgesb",  color: "from-violet-500 via-fuchsia-700 to-purple-900" },
];

const trending = [
  { name: "Cyber Reign",    cat: "RPG",      color: "from-fuchsia-600 to-purple-900",  players: "2.1M" },
  { name: "Void Runner",    cat: "Action",   color: "from-cyan-500 to-blue-900",       players: "892K" },
  { name: "Ghost Protocol", cat: "Stealth",  color: "from-emerald-500 to-teal-900",    players: "1.4M" },
  { name: "Quantum Strike", cat: "Shooter",  color: "from-rose-500 to-red-900",        players: "3.2M" },
];

export function GamesApp() {
  const { windows, toggleFullscreen, openApp } = useGhost();
  const [providerId, setProviderId] = useState<string>("vault");
  const [arcadeGame, setArcadeGame] = useState<typeof ARCADE[number] | null>(null);
  const [arcadeLoaded, setArcadeLoaded] = useState(false);
  const [providerLoaded, setProviderLoaded] = useState(false);

  const provider = PROVIDERS.find((p) => p.id === providerId)!;

  useEffect(() => { setProviderLoaded(false); }, [providerId]);

  useEffect(() => {
    if (!arcadeGame) return;
    const me = windows.find((w) => w.appId === "games");
    if (me && !me.fullscreen) toggleFullscreen(me.id);
  }, [arcadeGame, windows, toggleFullscreen]);

  const exitArcade = () => {
    const me = windows.find((w) => w.appId === "games");
    if (me?.fullscreen) toggleFullscreen(me.id);
    setArcadeGame(null);
    setArcadeLoaded(false);
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-black via-purple-950/30 to-black text-white overflow-hidden relative">
      {/* SIDEBAR — Game source / provider switcher */}
      <aside className="w-56 shrink-0 border-r border-fuchsia-500/15 bg-black/60 backdrop-blur-xl flex flex-col relative">
        <div className="px-4 py-4 border-b border-white/5">
          <div className="text-[9px] tracking-[0.45em] font-mono text-fuchsia-300/70">GAME SOURCES</div>
          <div className="text-sm font-black tracking-wider bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent mt-1">GHOSTARCADE</div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 space-y-1">
          {PROVIDERS.map((p) => {
            const active = p.id === providerId;
            return (
              <motion.button
                key={p.id}
                whileHover={{ x: 2 }}
                onClick={() => {
                  if (p.id === "cloud") { openApp("ghostcloud", "GhostCloud"); return; }
                  setProviderId(p.id);
                }}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition group ${
                  active ? "bg-gradient-to-r from-fuchsia-500/15 to-violet-500/10 ring-1 ring-fuchsia-400/40" : "hover:bg-white/5"
                }`}
              >
                {active && (
                  <motion.span layoutId="provider-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-gradient-to-b from-fuchsia-400 to-violet-500 shadow-[0_0_12px_rgba(232,121,249,.8)]" />
                )}
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${p.accent} flex items-center justify-center ring-1 ring-white/15 shadow-md shrink-0 overflow-hidden`}>
                  {p.iconUrl ? <img src={p.iconUrl} alt={p.name} className="h-6 w-6 object-contain" /> : <span className="text-base">{p.iconEmoji}</span>}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-xs font-bold tracking-wide ${active ? "text-white" : "text-white/80"}`}>{p.name}</div>
                  <div className="text-[10px] text-white/45 font-mono truncate">{p.tagline}</div>
                </div>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,.9)]" />}
              </motion.button>
            );
          })}
        </div>
        <div className="px-3 py-3 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono tracking-widest text-fuchsia-300/80 ring-1 ring-fuchsia-400/20 hover:bg-fuchsia-500/10 transition">
            <Plus className="h-3 w-3" /> ADD SOURCE
          </button>
          <div className="text-center text-[9px] text-white/30 font-mono mt-2">More providers soon</div>
        </div>
        {/* ambient line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent animate-scan" />
      </aside>

      {/* MAIN PANEL */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={providerId}
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0">
            {provider.embedUrl
              ? <EmbeddedProvider provider={provider} loaded={providerLoaded} onLoad={() => setProviderLoaded(true)} />
              : provider.id === "gamezop"
                ? <GamezopHub onPlay={(g) => { setArcadeLoaded(false); setArcadeGame(g); }} />
                : <ComingSoon provider={provider} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ARCADE FULLSCREEN OVERLAY */}
      <AnimatePresence>
        {arcadeGame && (
          <motion.div key={arcadeGame.id} initial={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.02, filter: "blur(6px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-30 flex flex-col bg-black">
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-fuchsia-950/80 via-black to-purple-950/80 border-b border-fuchsia-500/20">
              <button onClick={exitArcade} className="flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white transition">
                <ArrowLeft className="h-3.5 w-3.5" /> EXIT ARCADE
              </button>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] text-fuchsia-300">
                <Joystick className="h-3 w-3" />
                {arcadeGame.name.toUpperCase()} · LIVE
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
                ARCADE ONLINE
              </div>
            </div>
            <div className="relative flex-1 bg-black">
              {!arcadeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black">
                  <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
                  <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300">LOADING {arcadeGame.name.toUpperCase()}…</div>
                </div>
              )}
              <iframe
                src={proxify(arcadeGame.url)}
                title={arcadeGame.name}
                onLoad={() => setArcadeLoaded(true)}
                className="w-full h-full bg-black"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                allow="autoplay; fullscreen; gamepad; clipboard-write; encrypted-media"
                referrerPolicy="no-referrer"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmbeddedProvider({ provider, loaded, onLoad }: { provider: Provider; loaded: boolean; onLoad: () => void }) {
  const { windows, toggleFullscreen } = useGhost();
  const me = windows.find((w) => w.appId === "games");

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-fuchsia-950/40 via-black to-violet-950/40 border-b border-fuchsia-500/15">
        <div className="flex items-center gap-2.5">
          <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${provider.accent} flex items-center justify-center ring-1 ring-white/15 overflow-hidden`}>
            {provider.iconUrl ? <img src={provider.iconUrl} alt="" className="h-5 w-5" /> : <span className="text-sm">{provider.iconEmoji}</span>}
          </div>
          <div>
            <div className="text-xs font-black tracking-wider">{provider.name.toUpperCase()}</div>
            <div className="text-[9px] tracking-[0.35em] font-mono text-fuchsia-300/60">LIVE PROVIDER</div>
          </div>
        </div>
        <button onClick={() => me && toggleFullscreen(me.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest text-fuchsia-200 ring-1 ring-fuchsia-400/30 hover:bg-fuchsia-500/15 transition">
          <Maximize className="h-3 w-3" /> IMMERSE
        </button>
      </div>
      <div className="flex-1 relative bg-black">
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black">
            <div className="relative h-16 w-16">
              <motion.div className="absolute inset-0 rounded-full border-2 border-fuchsia-400/30" />
              <motion.div className="absolute inset-0 rounded-full border-t-2 border-fuchsia-400"
                animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
            </div>
            <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300">LOADING {provider.name.toUpperCase()}…</div>
          </div>
        )}
        <iframe
          src={provider.embedUrl}
          title={provider.name}
          onLoad={onLoad}
          className="w-full h-full bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          allow="autoplay; fullscreen; gamepad; clipboard-write; encrypted-media"
          referrerPolicy="no-referrer"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
      </div>
    </div>
  );
}

function GamezopHub({ onPlay }: { onPlay: (g: typeof ARCADE[number]) => void }) {
  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="relative h-60 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-700 via-purple-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,255,255,.15),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6">
          <span className="text-[10px] tracking-[0.4em] text-fuchsia-300 font-mono">GAMEZOP · INSTANT PLAY</span>
          <h2 className="text-4xl font-black neon-text tracking-tight mt-1">ARCADE VAULT</h2>
          <p className="text-sm text-white/70 mt-1 max-w-md">Curated HTML5 classics. Zero downloads. Click to play.</p>
        </div>
      </div>

      <Section icon={<Joystick className="h-3 w-3 text-fuchsia-300" />} label="INSTANT PLAY">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ARCADE.map((g, i) => (
            <motion.button key={g.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }}
              onClick={() => onPlay(g)}
              className="relative aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <Zap className="absolute top-2 right-2 h-3.5 w-3.5 text-amber-300/80" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[10px] text-fuchsia-300 font-mono">{g.tag}</div>
                <div className="text-sm font-bold leading-tight">{g.name}</div>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/40">
                <div className="h-12 w-12 rounded-full gradient-neon flex items-center justify-center shadow-xl">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </Section>

      <Section icon={<Flame className="h-3 w-3 text-orange-400" />} label="TRENDING">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {trending.map((g, i) => (
            <motion.div key={g.name} whileHover={{ scale: 1.04, y: -4 }}
              className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group ring-1 ring-white/10">
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <Gamepad2 className="absolute top-3 right-3 h-4 w-4 text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[10px] text-fuchsia-300 font-mono">{g.cat.toUpperCase()}</div>
                <div className="text-sm font-bold">{g.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/50 font-mono">{g.players}</span>
                  <div className="flex items-center gap-0.5 text-[10px] text-amber-300"><Star className="h-2.5 w-2.5 fill-amber-300" /> 4.{(i % 9) + 1}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>
      <div className="h-6" />
    </div>
  );
}

function ComingSoon({ provider }: { provider: Provider }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-950/30 to-black">
      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
        className={`h-24 w-24 rounded-3xl bg-gradient-to-br ${provider.accent} flex items-center justify-center ring-1 ring-white/15 shadow-[0_0_50px_rgba(232,121,249,.4)]`}>
        <Sparkles className="h-10 w-10 text-white" />
      </motion.div>
      <div className="mt-6 text-3xl font-black neon-text tracking-widest">{provider.name.toUpperCase()}</div>
      <div className="mt-2 text-[10px] tracking-[0.5em] font-mono text-fuchsia-300/70">PROVIDER COMING SOON</div>
      <div className="mt-1 text-xs text-white/40 max-w-xs text-center">{provider.tagline}</div>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="px-6 pt-6">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest text-white/60">{icon} {label}</div>
      {children}
    </div>
  );
}

// silence unused warning for icons retained for future sections
void Heart; void Clock; void Trophy;
