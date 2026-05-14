import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Star, Flame, Trophy, Gamepad2, Heart, Clock, ChevronRight, ArrowLeft, Maximize2, Loader2, Wifi, Joystick, Zap } from "lucide-react";
import { useGhost } from "../store";

const CINESTREAM_URL = "https://cinesteam.cine-softwares.workers.dev/";

// Online arcade games (free embeddable HTML5)
const ARCADE = [
  { id: "ark",      name: "Ark Defender",     tag: "ACTION",   url: "https://zv1y2i8p.play.gamezop.com/g/SkhljT2fdgb",    color: "from-fuchsia-600 via-purple-700 to-indigo-900" },
  { id: "knife",    name: "Knife Up",         tag: "ARCADE",   url: "https://zv1y2i8p.play.gamezop.com/g/r1qDQYcQS",       color: "from-rose-500 via-red-700 to-black" },
  { id: "bubble",   name: "Bubble Shooter",   tag: "PUZZLE",   url: "https://zv1y2i8p.play.gamezop.com/g/B1YKHqA9rb",      color: "from-cyan-500 via-blue-700 to-indigo-900" },
  { id: "tennis",   name: "Stickman Tennis",  tag: "SPORTS",   url: "https://zv1y2i8p.play.gamezop.com/g/HJzVLqRcrW",      color: "from-emerald-500 via-teal-700 to-blue-900" },
  { id: "chess",    name: "Chess",            tag: "STRATEGY", url: "https://zv1y2i8p.play.gamezop.com/g/B1YphhMjr-",      color: "from-amber-500 via-orange-700 to-red-900" },
  { id: "ludo",     name: "Mini Ludo",        tag: "CLASSIC",  url: "https://zv1y2i8p.play.gamezop.com/g/H17_5pgesb",      color: "from-violet-500 via-fuchsia-700 to-purple-900" },
];

const featured = [
  { title: "CINESTREAM ARCADE",  tagline: "The hidden gaming universe. Discovered.", rating: 4.9, hero: "from-fuchsia-700 via-purple-900 to-black", cine: true },
  { title: "NEON DRIFT 2099",    tagline: "Race through chrome veins of Neo-Tokyo.",  rating: 4.8, hero: "from-cyan-600 via-blue-900 to-black" },
  { title: "VOID RUNNER X",      tagline: "Sprint between collapsing dimensions.",     rating: 4.7, hero: "from-emerald-600 via-teal-900 to-black" },
];

const games = [
  { name: "Cyber Reign",     cat: "RPG",      color: "from-fuchsia-600 to-purple-900",  players: "2.1M" },
  { name: "Void Runner",     cat: "Action",   color: "from-cyan-500 to-blue-900",       players: "892K" },
  { name: "Ghost Protocol",  cat: "Stealth",  color: "from-emerald-500 to-teal-900",    players: "1.4M" },
  { name: "Quantum Strike",  cat: "Shooter",  color: "from-rose-500 to-red-900",        players: "3.2M" },
  { name: "Stellar Forge",   cat: "Sandbox",  color: "from-amber-500 to-orange-900",    players: "624K" },
  { name: "Hex Tactics",     cat: "Strategy", color: "from-indigo-500 to-violet-900",   players: "412K" },
  { name: "Pixel Phantom",   cat: "Indie",    color: "from-pink-500 to-fuchsia-900",    players: "208K" },
  { name: "Helix Drift",     cat: "Racing",   color: "from-orange-500 to-red-900",      players: "1.0M" },
];

const cats = ["All", "Action", "RPG", "Strategy", "Shooter", "Sandbox", "Stealth", "Racing", "Indie"];

export function GamesApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [hero, setHero] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [arcadeGame, setArcadeGame] = useState<typeof ARCADE[number] | null>(null);
  const [arcadeLoaded, setArcadeLoaded] = useState(false);

  useEffect(() => {
    if (!arcadeGame) return;
    const me = windows.find((w) => w.appId === "games");
    if (me && !me.fullscreen) toggleFullscreen(me.id);
  }, [arcadeGame, windows, toggleFullscreen]);

  const launchCine = () => {
    setLaunching(true);
    setIframeLoaded(false);
    setTimeout(() => { setInGame(true); setLaunching(false); }, 1600);
  };

  const exitArcade = () => {
    const me = windows.find((w) => w.appId === "games");
    if (me?.fullscreen) toggleFullscreen(me.id);
    setArcadeGame(null);
    setArcadeLoaded(false);
  };

  return (
    <div className="h-full relative bg-gradient-to-br from-black via-purple-950/40 to-black text-white overflow-hidden">
      {/* ambient grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(232,121,249,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(232,121,249,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent animate-scan" />

      <AnimatePresence mode="wait">
        {/* IN-GAME (cinestream embed) */}
        {inGame ? (
          <motion.div key="ingame" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col">
            {/* Game chrome */}
            <div className="flex items-center justify-between px-4 py-2 glass-strong border-b border-fuchsia-500/20">
              <button onClick={() => setInGame(false)} className="flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white transition">
                <ArrowLeft className="h-3.5 w-3.5" /> EXIT
              </button>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] text-fuchsia-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,.9)] animate-ghost-pulse" />
                CINESTREAM · LIVE INSTANCE
              </div>
              <div className="flex items-center gap-3 text-white/50 text-xs">
                <Wifi className="h-3.5 w-3.5" />
                <Maximize2 className="h-3.5 w-3.5" />
              </div>
            </div>
            {/* iframe stage */}
            <div className="relative flex-1 bg-black">
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black">
                  <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
                  <div className="text-[10px] tracking-[0.5em] font-mono text-fuchsia-300">SYNCING ARCADE FRAME…</div>
                </div>
              )}
              <iframe
                src={CINESTREAM_URL}
                title="CineStream Arcade"
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full bg-black"
                allow="autoplay; fullscreen; clipboard-write"
              />
              {/* subtle overlay */}
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/40 to-transparent" />
            </div>
          </motion.div>
        ) : (
          // BROWSE
          <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-y-auto scrollbar-hide">
            {/* HERO */}
            <div className="relative h-72 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={hero} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}
                  className={`absolute inset-0 bg-gradient-to-br ${featured[hero].hero}`} />
              </AnimatePresence>
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,.5), transparent 50%)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-6">
                <span className="text-[10px] tracking-[0.4em] text-fuchsia-300 font-mono mb-2">FEATURED · STAFF PICK</span>
                <AnimatePresence mode="wait">
                  <motion.div key={hero} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <h2 className="text-4xl font-black neon-text tracking-tight">{featured[hero].title}</h2>
                    <p className="text-sm text-white/70 mt-1 max-w-md">{featured[hero].tagline}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="flex items-center gap-3 mt-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={featured[hero].cine ? launchCine : undefined}
                    className="flex items-center gap-2 px-5 py-2 rounded-full gradient-neon text-white font-bold text-sm shadow-lg shadow-fuchsia-500/40">
                    <Play className="h-4 w-4 fill-current" /> {featured[hero].cine ? "Launch Arcade" : "Play Now"}
                  </motion.button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full glass text-white text-sm hover:bg-white/10">
                    <Heart className="h-3.5 w-3.5" /> Wishlist
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    {featured.map((_, i) => (
                      <button key={i} onClick={() => setHero(i)}
                        className={`h-1.5 rounded-full transition-all ${i === hero ? "w-8 bg-fuchsia-400" : "w-2 bg-white/30 hover:bg-white/50"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* QUICK LAUNCH — CINESTREAM */}
            <div className="px-6 pt-5">
              <motion.button onClick={launchCine} whileHover={{ y: -3 }} whileTap={{ scale: 0.99 }}
                className="group relative w-full overflow-hidden rounded-2xl ring-1 ring-fuchsia-500/30 neon-border">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-700 via-purple-700 to-indigo-700" />
                <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white, transparent 60%)" }} />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.18)_50%,transparent_70%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative flex items-center gap-4 p-4">
                  <div className="h-14 w-14 rounded-xl bg-black/40 ring-1 ring-white/20 flex items-center justify-center">
                    <Gamepad2 className="h-7 w-7 text-fuchsia-200" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-[10px] font-mono tracking-[0.3em] text-fuchsia-200/80">EXCLUSIVE · GHOSTOS DROP</div>
                    <div className="text-lg font-black tracking-tight">CINESTREAM ARCADE</div>
                    <div className="text-[11px] text-white/70">A hidden universe of student games. Tap to enter.</div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/80" />
                </div>
              </motion.button>
            </div>

            {/* CATEGORIES */}
            <div className="px-6 pt-5">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                {cats.map((c, i) => (
                  <button key={c}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition ${i === 0 ? "gradient-neon text-white shadow-md shadow-fuchsia-500/30" : "glass text-white/60 hover:text-white"}`}>
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* ARCADE — instantly playable in-browser */}
            <Section icon={<Joystick className="h-3 w-3 text-fuchsia-300" />} label="ARCADE · INSTANT PLAY">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ARCADE.map((g, i) => (
                  <motion.button key={g.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setArcadeLoaded(false); setArcadeGame(g); }}
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
                    {/* shimmer */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div className="absolute -inset-y-2 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        initial={{ x: "-150%" }} animate={{ x: "300%" }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 + i * 0.5 }} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </Section>

            {/* TRENDING */}
            <Section icon={<Flame className="h-3 w-3 text-orange-400" />} label="TRENDING NOW">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {games.map((g, i) => <GameCard key={g.name} g={g} i={i} />)}
              </div>
            </Section>

            {/* RECENT */}
            <Section icon={<Clock className="h-3 w-3 text-cyan-300" />} label="RECENTLY PLAYED">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {games.slice(0, 6).map((g, i) => (
                  <motion.div key={g.name} whileHover={{ y: -4 }} className="shrink-0 w-40 aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 relative cursor-pointer group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="h-6 w-6 fill-white" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                      <div className="text-xs font-bold truncate">{g.name}</div>
                      <div className="text-[9px] text-white/40 font-mono">{i + 1}h ago</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* FAVORITES */}
            <Section icon={<Heart className="h-3 w-3 text-rose-400 fill-rose-400" />} label="FAVORITES">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {games.slice(0, 6).map((g) => (
                  <motion.div key={g.name} whileHover={{ scale: 1.05 }} className={`aspect-square rounded-lg ring-1 ring-white/10 bg-gradient-to-br ${g.color} relative overflow-hidden cursor-pointer`}>
                    <Trophy className="absolute top-1 right-1 h-3 w-3 text-amber-300/80" />
                    <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-bold bg-black/60 truncate">{g.name}</div>
                  </motion.div>
                ))}
              </div>
            </Section>

            <div className="h-6" />
          </motion.div>
        )}

        {/* LAUNCH OVERLAY */}
        {launching && (
          <motion.div key="launch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative">
              <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-violet-700 flex items-center justify-center shadow-[0_0_60px_rgba(232,121,249,0.6)]">
                <Gamepad2 className="h-12 w-12 text-white" />
              </div>
              <motion.div animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl ring-2 ring-fuchsia-400" />
            </motion.div>
            <div className="mt-8 text-2xl font-black neon-text tracking-[0.3em]">CINESTREAM</div>
            <div className="mt-2 text-[10px] tracking-[0.5em] text-fuchsia-300/70 font-mono">ESTABLISHING SECURE TUNNEL…</div>
            <div className="mt-6 w-64 h-[3px] bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.4, ease: "easeInOut" }} className="h-full w-1/2 gradient-neon" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                src={arcadeGame.url}
                title={arcadeGame.name}
                onLoad={() => setArcadeLoaded(true)}
                className="w-full h-full bg-black"
                allow="autoplay; fullscreen; gamepad; clipboard-write"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-fuchsia-500/10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function GameCard({ g, i }: { g: typeof games[number]; i: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      whileHover={{ scale: 1.04, y: -4 }}
      className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group ring-1 ring-white/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
      <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
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
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
        <div className="h-12 w-12 rounded-full gradient-neon flex items-center justify-center shadow-xl">
          <Play className="h-5 w-5 fill-white text-white" />
        </div>
      </div>
    </motion.div>
  );
}
