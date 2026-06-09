import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Info, Search, Maximize2, X, Loader2, ArrowLeft, RotateCw, Star, Activity } from "lucide-react";
import { SafeEmbed } from "../SafeEmbed";
import {
  CATEGORIES, FEATURED_ID, type OmdbMovie, fetchMovie, fetchMovies,
  searchMovies, isValidImdbId, buildVidsrcUrl, STREAM_SOURCES,
} from "../omdb";

const COLORS = [
  "from-purple-700 to-indigo-950",
  "from-red-700 to-black",
  "from-pink-600 to-rose-950",
  "from-blue-700 to-slate-950",
  "from-orange-600 to-red-950",
  "from-teal-600 to-emerald-950",
  "from-fuchsia-700 to-purple-950",
  "from-amber-600 to-rose-950",
];

export function MoviesApp() {
  const [active, setActive] = useState<OmdbMovie | null>(null);
  const [launched, setLaunched] = useState(false);
  const [phase, setPhase] = useState<"idle" | "boot" | "live">("idle");

  const [featured, setFeatured] = useState<OmdbMovie | null>(null);
  const [rows, setRows] = useState<{ label: string; items: OmdbMovie[] }[]>(
    CATEGORIES.map((c) => ({ label: c.label, items: [] }))
  );

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<OmdbMovie[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const f = await fetchMovie(FEATURED_ID);
      if (alive && f) setFeatured(f);
      // Load rows in parallel
      const loaded = await Promise.all(
        CATEGORIES.map(async (c) => ({ label: c.label, items: await fetchMovies(c.ids) }))
      );
      if (alive) setRows(loaded);
    })();
    return () => { alive = false; };
  }, []);

  // Debounced search
  useEffect(() => {
    if (!showSearch) return;
    const q = query.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const hits = await searchMovies(q);
      // hydrate first 12 with full details (so we get rating/plot/genre)
      const full = await fetchMovies(hits.slice(0, 12).map((h) => h.imdbID));
      setSearchResults(full);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, showSearch]);

  const open = (m: OmdbMovie) => {
    if (!isValidImdbId(m.imdbID)) return;
    setActive(m);
    setLaunched(true);
    setPhase("boot");
    setTimeout(() => setPhase("live"), 1600);
  };

  if (launched && active) {
    return (
      <GhostFlixPlayer
        movie={active}
        phase={phase}
        onExit={() => { setLaunched(false); setPhase("idle"); setActive(null); }}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-black text-white relative">
      {/* GhostFlix banner */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-950" />
        {featured?.Poster && featured.Poster !== "N/A" && (
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: `url(${featured.Poster})`,
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
              filter: "blur(2px)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,80,80,.45),transparent_55%)]" />
        <motion.div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "linear-gradient(rgba(255,80,80,.4) 1px, transparent 1px)", backgroundSize: "100% 4px" }}
          animate={{ backgroundPositionY: ["0px", "200px"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        <div className="absolute top-4 left-6 flex items-center gap-3">
          <div className="text-2xl font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent">GHOSTFLIX</div>
          <span className="text-[9px] tracking-[0.4em] font-mono text-white/40">// NET22 STREAM CORE</span>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button onClick={() => setShowSearch((s) => !s)} className="px-3 py-1.5 rounded-full glass text-xs flex items-center gap-1.5">
            <Search className="h-3 w-3" /> Search
          </button>
        </div>

        <div className="absolute bottom-6 left-6 max-w-lg">
          <span className="text-[10px] tracking-[0.3em] text-red-400 font-mono">GHOSTFLIX FEATURED</span>
          <h1 className="text-5xl font-black mt-2 leading-none drop-shadow-[0_0_20px_rgba(220,38,38,.4)]">
            {featured?.Title ?? "LOADING…"}
          </h1>
          <p className="text-sm text-white/70 mt-3 line-clamp-2">
            {featured?.Plot ?? "Routing through NET22 relay…"}
          </p>
          <div className="flex items-center gap-2 mt-5">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => featured && open(featured)}
              disabled={!featured || !isValidImdbId(featured.imdbID)}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-white text-black font-bold text-sm shadow-[0_0_30px_rgba(255,255,255,.3)] disabled:opacity-50">
              <Play className="h-4 w-4 fill-black" /> Watch on GhostFlix
            </motion.button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-white text-sm">
              <Plus className="h-4 w-4" /> My List
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-white text-sm">
              <Info className="h-4 w-4" /> Info
            </button>
          </div>
        </div>
      </div>

      {/* Search panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="px-6 py-4 border-b border-white/5 bg-black/60 backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/40" />
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies on GhostFlix…"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30"
              />
              <button onClick={() => { setShowSearch(false); setQuery(""); }} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {query.trim().length >= 2 && (
              <div className="mt-4">
                {searching && <div className="text-[10px] font-mono text-white/40 tracking-widest">SEARCHING NET22…</div>}
                {!searching && searchResults.length === 0 && (
                  <div className="text-[10px] font-mono text-white/40 tracking-widest">NO RESULTS</div>
                )}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {searchResults.map((m, i) => <MovieCard key={m.imdbID} movie={m} idx={i} onClick={() => open(m)} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {rows.map((row, ri) => (
        <div key={ri} className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/85 tracking-wider">{row.label}</h2>
            <span className="text-[10px] font-mono text-white/30 tracking-widest">EXPLORE →</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {row.items.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} idx={i} />)
              : row.items.map((m, i) => <MovieCard key={m.imdbID} movie={m} idx={i} onClick={() => open(m)} />)}
          </div>
        </div>
      ))}

      <div className="px-6 py-8 text-center">
        <div className="text-[10px] tracking-[0.4em] text-white/30 font-mono">GHOSTFLIX · ENCRYPTED STREAM · NET22 RELAY</div>
      </div>
    </div>
  );
}

function MovieCard({ movie, idx, onClick }: { movie: OmdbMovie; idx: number; onClick: () => void }) {
  const hasPoster = movie.Poster && movie.Poster !== "N/A";
  const playable = isValidImdbId(movie.imdbID);
  return (
    <motion.button
      whileHover={{ scale: 1.08, y: -4, zIndex: 10 }} transition={{ duration: 0.2 }}
      onClick={onClick}
      disabled={!playable}
      className="relative shrink-0 w-44 aspect-[2/3] rounded-lg overflow-hidden cursor-pointer ring-1 ring-white/10 group disabled:cursor-not-allowed"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${COLORS[idx % COLORS.length]}`} />
      {hasPoster && (
        <img src={movie.Poster} alt={movie.Title} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="text-xs font-bold tracking-wide line-clamp-1">{movie.Title}</div>
        <div className="text-[10px] text-white/50 font-mono flex items-center gap-1.5">
          <span>{movie.Year}</span>
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <span className="flex items-center gap-0.5 text-amber-300/90"><Star className="h-2.5 w-2.5 fill-amber-300" /> {movie.imdbRating}</span>
          )}
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center bg-black/50">
        {playable ? <Play className="h-8 w-8 fill-white" /> : <span className="text-[10px] tracking-widest font-mono text-white/70">UNAVAILABLE</span>}
      </div>
    </motion.button>
  );
}

function SkeletonCard({ idx }: { idx: number }) {
  return (
    <div className="relative shrink-0 w-44 aspect-[2/3] rounded-lg overflow-hidden ring-1 ring-white/10">
      <div className={`absolute inset-0 bg-gradient-to-br ${COLORS[idx % COLORS.length]} opacity-40`} />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function GhostFlixPlayer({ movie, phase, onExit }: { movie: OmdbMovie; phase: "idle" | "boot" | "live"; onExit: () => void }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showDiag, setShowDiag] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("loading");

  const playable = isValidImdbId(movie.imdbID);
  const streamUrl = useMemo(
    () => (playable ? buildVidsrcUrl(movie.imdbID, sourceIdx) : null),
    [movie.imdbID, playable, sourceIdx]
  );

  useEffect(() => {
    if (streamUrl) {
      // eslint-disable-next-line no-console
      console.info("[GhostFlix] Playback URL:", {
        title: movie.Title, imdbID: movie.imdbID,
        source: STREAM_SOURCES[sourceIdx]?.label, url: streamUrl,
      });
      setStatus("loading");
    }
  }, [streamUrl, movie.Title, movie.imdbID, sourceIdx]);

  const cycleSource = () => {
    setSourceIdx((i) => (i + 1) % STREAM_SOURCES.length);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-[9999]" : "h-full"} bg-black text-white flex flex-col`}>
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-red-950/60 via-black to-purple-950/60 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onExit} className="p-1.5 rounded hover:bg-white/10 text-white/70"><ArrowLeft className="h-3.5 w-3.5" /></button>
          <div className="text-sm font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent">GHOSTFLIX</div>
          <span className="text-[9px] font-mono text-white/40 tracking-widest hidden sm:inline">·</span>
          <span className="text-xs font-bold text-white/85 truncate max-w-[40vw]">{movie.Title}</span>
          <span className="text-[10px] font-mono text-white/40">{movie.Year}</span>
          <span className="ml-2 flex items-center gap-1 text-[10px] text-emerald-300 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,.9)]" /> SECURE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={cycleSource} title={`Source: ${STREAM_SOURCES[sourceIdx]?.label}`} className="px-2 py-1 rounded hover:bg-white/10 text-[10px] font-mono text-white/60 tracking-widest">
            SRC {sourceIdx + 1}/{STREAM_SOURCES.length}
          </button>
          <button onClick={() => setShowDiag((s) => !s)} title="Diagnostics" className={`p-1.5 rounded hover:bg-white/10 ${showDiag ? "text-emerald-300" : "text-white/70"}`}><Activity className="h-3.5 w-3.5" /></button>
          <button onClick={() => setReloadKey((k) => k + 1)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setFullscreen((f) => !f)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><Maximize2 className="h-3.5 w-3.5" /></button>
          <button onClick={onExit} className="p-1.5 rounded hover:bg-red-500/20 text-red-300"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {showDiag && (
        <div className="px-3 py-2 bg-black/80 border-b border-emerald-500/20 text-[10px] font-mono text-white/70 space-y-0.5">
          <div><span className="text-emerald-300">TITLE</span> <span className="text-white">{movie.Title}</span></div>
          <div><span className="text-emerald-300">IMDB </span> <span className="text-white">{movie.imdbID || "—"}</span> <span className="text-white/40">· valid: {String(playable)}</span></div>
          <div><span className="text-emerald-300">SRC  </span> <span className="text-white">{STREAM_SOURCES[sourceIdx]?.label}</span> <span className="text-white/40">(#{sourceIdx + 1}/{STREAM_SOURCES.length})</span></div>
          <div className="break-all"><span className="text-emerald-300">URL  </span> {streamUrl ? <a href={streamUrl} target="_blank" rel="noreferrer" className="text-sky-300 underline">{streamUrl}</a> : <span className="text-rose-300">none</span>}</div>
          <div><span className="text-emerald-300">STAT </span> <span className={status === "error" ? "text-rose-300" : status === "ready" ? "text-emerald-300" : "text-amber-300"}>{status.toUpperCase()}</span></div>
        </div>
      )}

      <div className="flex-1 relative bg-black">
        <AnimatePresence>
          {phase === "boot" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black tracking-widest bg-gradient-to-r from-red-500 to-rose-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(220,38,38,.6)]">
                GHOSTFLIX
              </motion.div>
              <div className="mt-3 text-xs text-white/60">{movie.Title} <span className="text-white/30">· {movie.Year}</span></div>
              <motion.div className="mt-6 h-0.5 w-64 bg-white/10 overflow-hidden rounded-full">
                <motion.div className="h-full bg-gradient-to-r from-red-500 to-rose-300"
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.4, ease: "easeInOut" }} />
              </motion.div>
              <div className="mt-3 text-[10px] tracking-[0.45em] font-mono text-white/40 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> ROUTING THROUGH NET22 RELAY
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "live" && streamUrl && (
          <SafeEmbed
            key={`${movie.imdbID}-${reloadKey}`}
            url={streamUrl}
            title={`${movie.Title} (${movie.Year})`}
            accent="red"
            loadingLabel={`STREAMING ${movie.Title.toUpperCase()}…`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox allow-orientation-lock allow-pointer-lock allow-top-navigation-by-user-activation allow-downloads allow-modals"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; gamepad; accelerometer; gyroscope"
            onBack={onExit}
          />
        )}


        {phase === "live" && !streamUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="max-w-sm text-center px-6">
              <div className="text-[10px] tracking-[0.5em] font-mono text-rose-300">MOVIE UNAVAILABLE</div>
              <h3 className="mt-2 text-2xl font-black">{movie.Title}</h3>
              <p className="mt-3 text-sm text-white/60">This title has no valid IMDb identifier and cannot be streamed through the NET22 relay.</p>
              <button onClick={onExit} className="mt-5 px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-xs font-bold tracking-widest">
                BACK TO LIBRARY
              </button>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-red-500/10" />
      </div>
    </div>
  );
}
