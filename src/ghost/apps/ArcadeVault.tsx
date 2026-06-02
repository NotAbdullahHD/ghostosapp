import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Play, Search, Star, Heart, Clock, Flame, Sparkles, Joystick, Zap, X, Shuffle } from "lucide-react";
import { useGhost } from "../store";
import { proxify } from "../proxy";
import catalogRaw from "../data/onlineGames.json";

export interface CatalogGame {
  title: string;
  embed: string;
  image: string;
  tags: string;
  description: string;
}

const CATALOG = catalogRaw as CatalogGame[];

const CATEGORY_DEFS: { id: string; label: string; match: (g: CatalogGame) => boolean; color: string }[] = [
  { id: "featured",    label: "Featured",     match: () => true,                                              color: "from-fuchsia-500 to-violet-700" },
  { id: "racing",      label: "Racing",       match: (g) => /racing|drift|car|driving|speed/i.test(g.tags),  color: "from-red-500 to-orange-700" },
  { id: "shooting",    label: "Shooter",      match: (g) => /shooting|shooter|gun|fps/i.test(g.tags),         color: "from-rose-500 to-red-900" },
  { id: "action",      label: "Action",       match: (g) => /action|battle|fight|war/i.test(g.tags),          color: "from-amber-500 to-rose-700" },
  { id: "arcade",      label: "Arcade",       match: (g) => /arcade|2d|html5/i.test(g.tags),                  color: "from-fuchsia-500 to-pink-700" },
  { id: "puzzle",      label: "Puzzle",       match: (g) => /puzzle|brain|logic|word/i.test(g.tags),          color: "from-emerald-500 to-teal-700" },
  { id: "sports",      label: "Sports",       match: (g) => /sports|football|basket|tennis|golf/i.test(g.tags), color: "from-cyan-500 to-blue-700" },
  { id: "multiplayer", label: "Multiplayer",  match: (g) => /multiplayer|2-player/i.test(g.tags),             color: "from-violet-500 to-indigo-700" },
  { id: "3d",          label: "3D",           match: (g) => /\b3d\b/i.test(g.tags),                            color: "from-sky-500 to-violet-700" },
];

const RP_KEY = "ghost.arcade.recent.v1";
const FAV_KEY = "ghost.arcade.favs.v1";
const LOAD_TIMEOUT_MS = 10_000;

function loadKeys(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function isValidEmbed(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, window.location.href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

type LaunchStatus = "loading" | "ready" | "error";

export function ArcadeVault() {
  const { windows, toggleFullscreen } = useGhost();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("featured");
  const [active, setActive] = useState<CatalogGame | null>(null);
  const [status, setStatus] = useState<LaunchStatus>("loading");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(() => loadKeys(RP_KEY));
  const [favs, setFavs] = useState<string[]>(() => loadKeys(FAV_KEY));
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const launchStartRef = useRef<number>(0);

  const filtered = useMemo(() => {
    const def = CATEGORY_DEFS.find((c) => c.id === category) ?? CATEGORY_DEFS[0];
    let list = CATALOG.filter(def.match);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.tags.toLowerCase().includes(q));
    }
    return list;
  }, [category, query]);

  const featured = useMemo(() => CATALOG[Math.floor(Date.now() / 60000) % CATALOG.length], []);
  const trending = useMemo(() => CATALOG.slice(0, 80).sort(() => Math.random() - 0.5).slice(0, 12), []);
  const continuePlaying = useMemo(
    () => recent.map((t) => CATALOG.find((g) => g.title === t)).filter(Boolean) as CatalogGame[],
    [recent]
  );
  const favorites = useMemo(
    () => favs.map((t) => CATALOG.find((g) => g.title === t)).filter(Boolean) as CatalogGame[],
    [favs]
  );

  const pushDiag = (line: string) => {
    const stamp = new Date().toLocaleTimeString();
    setDiagnostics((d) => [...d.slice(-20), `[${stamp}] ${line}`]);
  };

  // Progress + timeout fallback. Progress is driven by status, never gets stuck.
  useEffect(() => {
    if (!active) return;
    if (status !== "loading") return;

    launchStartRef.current = Date.now();
    setProgress(0);
    pushDiag(`Launching "${active.title}"…`);

    const tick = setInterval(() => {
      setProgress((p) => {
        const elapsed = Date.now() - launchStartRef.current;
        // ease toward 90% over ~8s; never exceed 90% while still loading
        const target = Math.min(90, (elapsed / 8000) * 90);
        return p < target ? Math.min(p + Math.random() * 4 + 1, target) : p;
      });
    }, 160);

    const timeout = setTimeout(() => {
      // If still loading, treat as failure but let user continue.
      setStatus((s) => {
        if (s === "loading") {
          pushDiag("Timeout: iframe did not signal ready within 10s.");
          setErrorMsg("Game took too long to respond.");
          return "error";
        }
        return s;
      });
    }, LOAD_TIMEOUT_MS);

    return () => { clearInterval(tick); clearTimeout(timeout); };
  }, [active, status]);

  // Animate progress to 100% on ready
  useEffect(() => {
    if (status !== "ready") return;
    setProgress(100);
  }, [status]);

  useEffect(() => {
    if (!active) return;
    const me = windows.find((w) => w.appId === "games");
    if (me && !me.fullscreen) toggleFullscreen(me.id);
    setRecent((r) => {
      const next = [active.title, ...r.filter((t) => t !== active.title)].slice(0, 8);
      localStorage.setItem(RP_KEY, JSON.stringify(next));
      return next;
    });
  }, [active, windows, toggleFullscreen]);

  // Global error listener while a game is active (catches script errors that bubble)
  useEffect(() => {
    if (!active) return;
    const onErr = (e: ErrorEvent) => pushDiag(`window error: ${e.message}`);
    const onRej = (e: PromiseRejectionEvent) => pushDiag(`unhandled: ${String(e.reason).slice(0, 80)}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [active]);

  const launch = (g: CatalogGame) => {
    if (!isValidEmbed(g.embed)) {
      setActive(g);
      setStatus("error");
      setErrorMsg("Invalid game URL — provider failed validation.");
      pushDiag(`Validation failed for ${g.embed}`);
      return;
    }
    setErrorMsg(null);
    setDiagnostics([]);
    setStatus("loading");
    setActive(g);
  };
  const retry = () => {
    if (!active) return;
    setErrorMsg(null);
    setStatus("loading");
    setProgress(0);
    // force iframe reload
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      requestAnimationFrame(() => { if (iframeRef.current) iframeRef.current.src = src; });
    }
    pushDiag("Retrying launch…");
  };
  const continueAnyway = () => { setStatus("ready"); pushDiag("User continued past error."); };
  const exit = () => {
    const me = windows.find((w) => w.appId === "games");
    if (me?.fullscreen) toggleFullscreen(me.id);
    setActive(null);
    setStatus("loading");
    setErrorMsg(null);
  };
  const toggleFav = (title: string) => {
    setFavs((f) => {
      const next = f.includes(title) ? f.filter((t) => t !== title) : [title, ...f].slice(0, 24);
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleIframeLoad = () => {
    pushDiag(`Iframe load event in ${Date.now() - launchStartRef.current}ms.`);
    setStatus((s) => (s === "loading" ? "ready" : s));
  };
  const handleIframeError = () => {
    pushDiag("Iframe error event fired.");
    setErrorMsg("Game frame failed to load.");
    setStatus("error");
  };


  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide bg-black">
      {/* HERO FEATURED */}
      <div className="relative h-72 overflow-hidden">
        <motion.img
          key={featured.title}
          src={featured.image}
          alt={featured.title}
          initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4 }}
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="relative h-full flex items-end p-6">
          <div className="max-w-xl">
            <span className="text-[10px] tracking-[0.5em] text-fuchsia-300 font-mono">GHOST · FEATURED TONIGHT</span>
            <h2 className="text-4xl font-black neon-text tracking-tight mt-2">{featured.title}</h2>
            <p className="text-xs text-white/60 mt-2 line-clamp-2">{featured.description}</p>
            <div className="flex items-center gap-2 mt-4">
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => launch(featured)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-neon text-white font-bold text-xs tracking-widest shadow-[0_0_30px_rgba(232,121,249,.5)]">
                <Play className="h-3.5 w-3.5 fill-white" /> LAUNCH
              </motion.button>
              <button onClick={() => toggleFav(featured.title)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg ring-1 ring-white/20 text-white/80 text-xs font-mono hover:bg-white/5">
                <Heart className={`h-3.5 w-3.5 ${favs.includes(featured.title) ? "fill-rose-400 text-rose-400" : ""}`} /> FAVORITE
              </button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent animate-scan" />
      </div>

      {/* SEARCH + CATEGORIES */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-black/60 border-b border-fuchsia-500/15 px-6 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 259 games…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 ring-1 ring-white/10 text-xs text-white placeholder:text-white/30 font-mono focus:outline-none focus:ring-fuchsia-400/40"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {CATEGORY_DEFS.map((c) => {
            const active = c.id === category;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`relative px-3 py-1.5 rounded-full text-[10px] font-mono tracking-widest whitespace-nowrap transition ${
                  active ? "text-white" : "text-white/50 hover:text-white"
                }`}>
                {active && <motion.span layoutId="vault-cat"
                  className={`absolute inset-0 rounded-full bg-gradient-to-r ${c.color} opacity-70 ring-1 ring-white/20`} />}
                <span className="relative">{c.label.toUpperCase()}</span>
              </button>
            );
          })}
          <button onClick={() => launch(CATALOG[Math.floor(Math.random() * CATALOG.length)])}
            className="ml-2 px-3 py-1.5 rounded-full ring-1 ring-fuchsia-400/30 text-fuchsia-200 text-[10px] font-mono tracking-widest hover:bg-fuchsia-500/10 flex items-center gap-1.5">
            <Shuffle className="h-3 w-3" /> SURPRISE
          </button>
        </div>
      </div>

      {/* CONTINUE PLAYING */}
      {continuePlaying.length > 0 && !query && category === "featured" && (
        <Row icon={<Clock className="h-3 w-3 text-cyan-300" />} label="CONTINUE PLAYING" games={continuePlaying} onPlay={launch} favs={favs} onFav={toggleFav} />
      )}
      {/* FAVORITES */}
      {favorites.length > 0 && !query && category === "featured" && (
        <Row icon={<Heart className="h-3 w-3 text-rose-300" />} label="FAVORITES" games={favorites} onPlay={launch} favs={favs} onFav={toggleFav} />
      )}
      {/* TRENDING */}
      {!query && category === "featured" && (
        <Row icon={<Flame className="h-3 w-3 text-orange-300" />} label="TRENDING TONIGHT" games={trending} onPlay={launch} favs={favs} onFav={toggleFav} />
      )}

      {/* MAIN GRID */}
      <div className="px-6 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest text-white/60">
          <Sparkles className="h-3 w-3 text-fuchsia-300" />
          {query ? `RESULTS · ${filtered.length}` : `${CATEGORY_DEFS.find((c) => c.id === category)?.label.toUpperCase()} · ${filtered.length}`}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.slice(0, 60).map((g, i) => (
            <GameCard key={g.title + i} g={g} onPlay={launch} fav={favs.includes(g.title)} onFav={() => toggleFav(g.title)} index={i} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-xs font-mono text-white/40">NO MATCH IN THE VAULT</div>
        )}
      </div>

      {/* CINEMATIC LAUNCH OVERLAY */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 flex flex-col bg-black">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-fuchsia-950/80 via-black to-purple-950/80 border-b border-fuchsia-500/20">
              <button onClick={exit} className="flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> EXIT ARCADE
              </button>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] text-fuchsia-300">
                <Joystick className="h-3 w-3" /> {active.title.toUpperCase()} · LIVE
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
                ARCADE ONLINE
              </div>
            </div>

            {/* Game frame */}
            <div className="relative flex-1 bg-black">
              {!loaded && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black">
                  <motion.img src={active.image} alt={active.title}
                    initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 0.35 }}
                    transition={{ duration: 1.2 }}
                    className="absolute inset-0 w-full h-full object-cover blur-2xl" />
                  <div className="relative z-10 flex flex-col items-center gap-5">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6 }}
                      className="relative w-64 aspect-video rounded-xl overflow-hidden ring-1 ring-fuchsia-400/40 shadow-[0_0_60px_rgba(232,121,249,.4)]">
                      <img src={active.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <div className="text-[9px] tracking-[0.4em] text-fuchsia-300 font-mono">GHOST · INITIALIZING</div>
                        <div className="text-sm font-bold">{active.title}</div>
                      </div>
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent animate-scan" />
                    </motion.div>
                    <div className="w-64">
                      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300"
                          animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[9px] font-mono tracking-widest text-white/50">
                        <span>STREAMING ASSETS</span>
                        <span className="text-fuchsia-300">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <Loader2 className="h-4 w-4 animate-spin text-fuchsia-300" />
                  </div>
                </motion.div>
              )}
              <iframe
                src={proxify(active.embed)}
                title={active.title}
                onLoad={() => { setProgress(100); setTimeout(() => setLoaded(true), 350); }}
                className="w-full h-full bg-black"
                sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
                allow="autoplay; fullscreen; gamepad; clipboard-write; encrypted-media; accelerometer; gyroscope"
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

function GameCard({ g, onPlay, fav, onFav, index }: { g: CatalogGame; onPlay: (g: CatalogGame) => void; fav: boolean; onFav: () => void; index: number }) {
  const primaryTag = g.tags.split(",")[0]?.toUpperCase() ?? "GAME";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.4) }}
      whileHover={{ scale: 1.04, y: -4 }}
      className="relative aspect-[4/5] rounded-xl overflow-hidden ring-1 ring-white/10 group cursor-pointer bg-zinc-900"
      onClick={() => onPlay(g)}>
      <img src={g.image} alt={g.title} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <Zap className="absolute top-2 right-2 h-3.5 w-3.5 text-amber-300/80" />
      <button
        onClick={(e) => { e.stopPropagation(); onFav(); }}
        className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/50 ring-1 ring-white/15 backdrop-blur flex items-center justify-center hover:bg-black/70">
        <Heart className={`h-3 w-3 ${fav ? "fill-rose-400 text-rose-400" : "text-white/70"}`} />
      </button>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="text-[9px] text-fuchsia-300 font-mono tracking-widest">{primaryTag}</div>
        <div className="text-xs font-bold leading-tight line-clamp-2">{g.title}</div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="h-12 w-12 rounded-full gradient-neon flex items-center justify-center shadow-xl ring-2 ring-white/30">
          <Play className="h-5 w-5 fill-white text-white" />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
        <div className="absolute inset-0 ring-1 ring-inset ring-fuchsia-400/40 rounded-xl" />
      </div>
    </motion.div>
  );
}

function Row({ icon, label, games, onPlay, favs, onFav }: { icon: React.ReactNode; label: string; games: CatalogGame[]; onPlay: (g: CatalogGame) => void; favs: string[]; onFav: (t: string) => void }) {
  return (
    <div className="px-6 pt-6">
      <div className="flex items-center gap-2 mb-3 text-[11px] font-mono tracking-widest text-white/60">{icon} {label}</div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x">
        {games.map((g, i) => (
          <div key={g.title + i} className="w-40 shrink-0 snap-start">
            <GameCard g={g} onPlay={onPlay} fav={favs.includes(g.title)} onFav={() => onFav(g.title)} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}

// silence unused
void X; void Star;
