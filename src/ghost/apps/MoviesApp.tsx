import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Plus, Info, Search, Maximize2, X, Loader2, ArrowLeft, RotateCw, Star,
  Activity, Settings as SettingsIcon,
  ChevronUp, ChevronDown, AlertTriangle, CheckCircle2, RefreshCw,
} from "lucide-react";

import {
  CATEGORIES, FEATURED_ID, type OmdbMovie, fetchMovie, fetchMovies,
  searchMovies, isValidImdbId,
} from "../omdb";
import {
  ALL_PROVIDERS, orderedProviders, loadProviderPrefs, saveProviderPrefs,
  type PlaybackProvider, type ProviderPrefs,
} from "../providers/playback";

import { ProfileGate } from "./FlixProfiles";
import {
  loadProfiles, saveProfiles, saveActiveProfileId,
  type FlixProfile,
} from "../profiles";

/** Neutral Obsidian poster placeholders — no per-card random colours. */
const CARD_BG = "from-white/[0.07] to-white/[0.02]";

/** Titles hidden when the active profile has Kids Mode enabled. */
const KID_UNSAFE_RATINGS = ["R", "NC-17", "TV-MA", "X"];
function allowedForProfile(m: OmdbMovie, profile: FlixProfile | null) {
  if (!profile?.kids) return true;
  const rated = (m.Rated ?? "").toUpperCase();
  if (KID_UNSAFE_RATINGS.includes(rated)) return false;
  const genre = (m.Genre ?? "").toLowerCase();
  return !/horror|thriller/.test(genre);
}


export function MoviesApp() {
  const [active, setActive] = useState<OmdbMovie | null>(null);
  const [launched, setLaunched] = useState(false);

  const [featured, setFeatured] = useState<OmdbMovie | null>(null);
  const [rows, setRows] = useState<{ label: string; items: OmdbMovie[] }[]>(
    CATEGORIES.map((c) => ({ label: c.label, items: [] }))
  );

  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<OmdbMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Viewing profiles ("Who's watching?")
  const [profiles, setProfiles] = useState<FlixProfile[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profilesReady, setProfilesReady] = useState(false);
  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId) ?? null,
    [profiles, profileId]
  );

  useEffect(() => {
    const list = loadProfiles();
    setProfiles(list);
    // Always start on "Who's watching?" — never resume the last profile.
    setProfileId(null);
    setProfilesReady(true);
  }, []);

  const persistProfiles = (list: FlixProfile[]) => {
    setProfiles(list);
    saveProfiles(list);
    if (profileId && !list.some((p) => p.id === profileId)) {
      setProfileId(null);
      saveActiveProfileId(null);
    }
  };

  const chooseProfile = (p: FlixProfile) => {
    setProfileId(p.id);
    saveActiveProfileId(p.id);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const f = await fetchMovie(FEATURED_ID);
      if (alive && f) setFeatured(f);
      const loaded = await Promise.all(
        CATEGORIES.map(async (c) => ({ label: c.label, items: await fetchMovies(c.ids) }))
      );
      if (alive) setRows(loaded);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!showSearch) return;
    const q = query.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const hits = await searchMovies(q);
      const full = await fetchMovies(hits.slice(0, 12).map((h) => h.imdbID));
      setSearchResults(full);
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, showSearch]);

  const visibleRows = useMemo(
    () => rows
      .map((r) => ({ ...r, items: r.items.filter((m) => allowedForProfile(m, profile)) }))
      .filter((r) => !profile?.kids || r.items.length > 0),
    [rows, profile]
  );
  const visibleSearch = useMemo(
    () => searchResults.filter((m) => allowedForProfile(m, profile)),
    [searchResults, profile]
  );

  const open = (m: OmdbMovie) => {
    if (!isValidImdbId(m.imdbID)) return;
    setActive(m);
    setLaunched(true);
  };

  if (!profilesReady) {
    return <div className="h-full bg-background" />;
  }

  if (!profile) {
    return (
      <ProfileGate
        profiles={profiles}
        onSelect={chooseProfile}
        onSave={persistProfiles}
      />
    );
  }

  if (launched && active) {
    return (
      <GhostFlixPlayer
        movie={active}
        onExit={() => { setLaunched(false); setActive(null); }}
      />
    );
  }


  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground relative">
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#15171a] via-background to-black" />
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(102,217,255,.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <div className="absolute top-4 left-6 flex items-center gap-3">
          <div className="text-2xl font-black tracking-widest text-foreground">GHOSTFLIX</div>
          <span className="text-[9px] tracking-[0.4em] font-mono text-muted-foreground">// STREAM CORE</span>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button onClick={() => setShowSearch((s) => !s)} className="px-3 py-1.5 rounded-full glass text-xs flex items-center gap-1.5">
            <Search className="h-3 w-3" /> Search
          </button>
          <button onClick={() => setShowSettings(true)} className="px-3 py-1.5 rounded-full glass text-xs flex items-center gap-1.5">
            <SettingsIcon className="h-3 w-3" /> Settings
          </button>
          <button
            onClick={() => { setProfileId(null); saveActiveProfileId(null); }}
            title={`${profile.name} — switch profile`}
            className="flex h-8 items-center gap-2 rounded-full glass px-2.5 text-xs"
          >
            <span className="text-base leading-none">{profile.avatar}</span>
            <span className="max-w-[7rem] truncate text-foreground/80">{profile.name}</span>
          </button>
        </div>

        <div className="absolute bottom-6 left-6 max-w-lg">
          <span className="text-[10px] tracking-[0.3em] text-[var(--ice)] font-mono">GHOSTFLIX FEATURED</span>
          <h1 className="text-5xl font-black mt-2 leading-none">
            {featured?.Title ?? "LOADING…"}
          </h1>
          <p className="text-sm text-foreground/70 mt-3 line-clamp-2">
            {featured?.Plot ?? "Preparing stream relay…"}
          </p>
          <div className="flex items-center gap-2 mt-5">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
              onClick={() => featured && open(featured)}
              disabled={!featured || !isValidImdbId(featured.imdbID)}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-foreground text-background font-bold text-sm disabled:opacity-50">
              <Play className="h-4 w-4 fill-current" /> Watch on GhostFlix
            </motion.button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-foreground text-sm">
              <Plus className="h-4 w-4" /> My List
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded glass text-foreground text-sm">
              <Info className="h-4 w-4" /> Info
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="px-6 py-4 border-b border-border bg-background/60 backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies on GhostFlix…"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => { setShowSearch(false); setQuery(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {query.trim().length >= 2 && (
              <div className="mt-4">
                {searching && <div className="text-[10px] font-mono text-muted-foreground tracking-widest">SEARCHING…</div>}
                {!searching && visibleSearch.length === 0 && (
                  <div className="text-[10px] font-mono text-muted-foreground tracking-widest">NO RESULTS</div>
                )}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {visibleSearch.map((m, i) => <MovieCard key={m.imdbID} movie={m} idx={i} onClick={() => open(m)} />)}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {visibleRows.map((row, ri) => (
        <div key={ri} className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground/85 tracking-wider">{row.label}</h2>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">EXPLORE →</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {row.items.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} idx={i} />)
              : row.items.map((m, i) => <MovieCard key={m.imdbID} movie={m} idx={i} onClick={() => open(m)} />)}
          </div>
        </div>
      ))}


      <div className="px-6 py-8 text-center">
        <div className="text-[10px] tracking-[0.4em] text-muted-foreground font-mono">GHOSTFLIX · ENCRYPTED STREAM</div>
      </div>

      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
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
      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_BG}`} />
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
      <div className={`absolute inset-0 bg-gradient-to-br ${CARD_BG} opacity-40`} />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PLAYER — modular provider engine with graceful failover.
// ---------------------------------------------------------------------------

type Stage =
  | "loading-movie"
  | "checking-provider"
  | "preparing-stream"
  | "starting-playback"
  | "playing"
  | "error";

const STAGE_LABELS: Record<Exclude<Stage, "playing" | "error">, string> = {
  "loading-movie": "Loading Movie…",
  "checking-provider": "Checking Playback Provider…",
  "preparing-stream": "Preparing Stream…",
  "starting-playback": "Starting Playback…",
};

interface ResolvedStream {
  provider: PlaybackProvider;
  url: string;
  sandbox?: string;
  unsandboxed?: boolean;
  allow?: string;
  timeoutMs: number;
}

function GhostFlixPlayer({ movie, onExit }: { movie: OmdbMovie; onExit: () => void }) {
  const [providers, setProviders] = useState<PlaybackProvider[]>(() => orderedProviders());
  const [providerIdx, setProviderIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("loading-movie");
  const [stream, setStream] = useState<ResolvedStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);


  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAttemptRef = useRef(0);
  const cancelRef = useRef(false);

  const currentProvider = providers[providerIdx];

  // Refresh provider order when settings change.
  useEffect(() => {
    const onStorage = () => setProviders(orderedProviders());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const clearTimer = () => {
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
  };

  const attemptProvider = useCallback(
    async (idx: number) => {
      cancelRef.current = false;
      activeAttemptRef.current += 1;
      const myAttempt = activeAttemptRef.current;

      if (idx >= providers.length) {
        setStage("error");
        setErrorMsg("All playback providers are unavailable. Please try again later.");
        return;
      }

      const provider = providers[idx];
      setStream(null);
      setErrorMsg(null);
      setStage("loading-movie");
      await wait(450);
      if (cancelRef.current || myAttempt !== activeAttemptRef.current) return;

      setStage("checking-provider");
      await wait(500);
      if (cancelRef.current || myAttempt !== activeAttemptRef.current) return;

      let result;
      try {
        result = await provider.resolve({
          imdbID: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
        });
      } catch (err) {
        result = {
          ok: false as const,
          fallback: true,
          message: `Provider ${provider.label} threw an error.`,
        };
      }

      if (cancelRef.current || myAttempt !== activeAttemptRef.current) return;

      if (!result.ok) {
        if (result.fallback) {
          setProviderIdx(idx + 1);
          return;
        }
        setStage("error");
        setErrorMsg(result.message || "Playback provider unavailable.");
        return;
      }

      setStage("preparing-stream");
      await wait(500);
      if (cancelRef.current || myAttempt !== activeAttemptRef.current) return;

      setStream({
        provider,
        url: result.url,
        sandbox: result.sandbox,
        unsandboxed: result.unsandboxed,
        allow: result.allow,
        timeoutMs: result.timeoutMs ?? 15_000,
      });

      setStage("starting-playback");
    },
    [providers, movie.imdbID, movie.Title, movie.Year],
  );

  // Kick off / restart when provider index changes.
  useEffect(() => {
    attemptProvider(providerIdx);
    return () => {
      cancelRef.current = true;
      clearTimer();
    };
  }, [providerIdx, attemptProvider, reloadKey]);

  // Iframe watchdog — if the stream never loads, mark provider as failed.
  useEffect(() => {
    if (!stream || stage !== "starting-playback") return;
    clearTimer();
    iframeTimeoutRef.current = setTimeout(() => {
      // Provider didn't fire onLoad in time — fall through.
      setProviderIdx((i) => i + 1);
    }, stream.timeoutMs);
    return clearTimer;
  }, [stream, stage]);

  const handleIframeLoad = () => {
    clearTimer();
    setStage("playing");
  };
  const handleIframeError = () => {
    clearTimer();
    setProviderIdx((i) => i + 1);
  };

  const retryFromStart = () => {
    activeAttemptRef.current += 1;
    setErrorMsg(null);
    setProviderIdx(0);
    setReloadKey((k) => k + 1);
  };

  const reloadCurrent = () => {
    activeAttemptRef.current += 1;
    setReloadKey((k) => k + 1);
    setStream(null);
    // Re-run current provider from stages.
    attemptProvider(providerIdx);
  };

  // NOTE: transport controls (play/pause/seek/volume) live inside the provider's
  // own cross-origin player. GhostOS cannot drive them, so no simulated
  // controls or progress bars are rendered here.



  // Fullscreen — real browser fullscreen on the host node.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stageLabel = stage in STAGE_LABELS ? STAGE_LABELS[stage as keyof typeof STAGE_LABELS] : "";

  return (
    <div
      ref={hostRef}
      className={`${fullscreen ? "fixed inset-0 z-[9999]" : "h-full"} bg-black text-white flex flex-col`}
    >
      {/* Top chrome */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#141416] via-background to-[#141416] border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onExit} className="p-1.5 rounded hover:bg-white/10 text-white/70"><ArrowLeft className="h-3.5 w-3.5" /></button>
          <div className="text-sm font-black tracking-widest text-foreground">GHOSTFLIX</div>
          <span className="text-[9px] font-mono text-white/40 tracking-widest hidden sm:inline">·</span>
          <span className="text-xs font-bold text-white/85 truncate max-w-[40vw]">{movie.Title}</span>
          <span className="text-[10px] font-mono text-white/40">{movie.Year}</span>
          <span className="ml-2 flex items-center gap-1 text-[10px] text-emerald-300 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,.9)]" /> SECURE
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => currentProvider && setProviderIdx((i) => (i + 1) % Math.max(providers.length, 1))}
            title="Switch stream source"
            className="px-2 py-1 rounded hover:bg-white/10 text-[10px] font-mono text-white/60 tracking-widest"
          >
            SWITCH SOURCE
          </button>

          <button onClick={() => setShowSettings(true)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><SettingsIcon className="h-3.5 w-3.5" /></button>
          <button onClick={() => setShowDiag((s) => !s)} className={`p-1.5 rounded hover:bg-white/10 ${showDiag ? "text-emerald-300" : "text-white/70"}`}><Activity className="h-3.5 w-3.5" /></button>
          <button onClick={reloadCurrent} className="p-1.5 rounded hover:bg-white/10 text-white/70"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => setFullscreen((f) => !f)} className="p-1.5 rounded hover:bg-white/10 text-white/70"><Maximize2 className="h-3.5 w-3.5" /></button>
          <button onClick={onExit} className="p-1.5 rounded hover:bg-destructive/20 text-destructive"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {showDiag && (
        <div className="px-3 py-2 bg-black/80 border-b border-emerald-500/20 text-[10px] font-mono text-white/70 space-y-0.5">
          <div><span className="text-emerald-300">TITLE</span> <span className="text-white">{movie.Title}</span></div>
          <div><span className="text-emerald-300">IMDB </span> <span className="text-white">{movie.imdbID}</span></div>
          <div><span className="text-emerald-300">PROV </span> <span className="text-white">{currentProvider?.label ?? "—"}</span> <span className="text-white/40">(#{providerIdx + 1}/{providers.length})</span></div>
          <div><span className="text-emerald-300">STAG </span> <span className="text-amber-300">{stage.toUpperCase()}</span></div>
          <div className="break-all"><span className="text-emerald-300">URL  </span> {stream ? <span className="text-sky-300">{stream.url}</span> : <span className="text-white/40">—</span>}</div>
        </div>
      )}

      {/* Playback surface */}
      <div className="flex-1 relative bg-black">
        {stream && stage !== "error" && (
          <iframe
            key={`${stream.provider.id}-${reloadKey}`}
            src={stream.url}
            title={`${movie.Title} (${movie.Year})`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="absolute inset-0 w-full h-full bg-black"
            {...(stream.unsandboxed
              ? {}
              : {
                  sandbox:
                    stream.sandbox ??
                    "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox allow-orientation-lock allow-pointer-lock allow-downloads allow-modals",
                })}
            allow={stream.allow ?? "autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; accelerometer; gyroscope"}
            allowFullScreen
            referrerPolicy="origin"
          />
        )}


        <AnimatePresence>
          {stage !== "playing" && stage !== "error" && (
            <StageOverlay
              key="stage"
              stage={stage}
              label={stageLabel}
              provider={currentProvider}
              attempt={providerIdx + 1}
              total={providers.length}
              title={movie.Title}
            />
          )}
          {stage === "error" && (
            <ErrorOverlay
              key="err"
              title={movie.Title}
              message={errorMsg ?? "Movie temporarily unavailable."}
              onRetry={retryFromStart}
              onBack={onExit}
              onSettings={() => setShowSettings(true)}
              onReload={reloadCurrent}
              url={stream?.url}

            />
          )}
        </AnimatePresence>

        {/* Provider badge — the player's own controls handle transport. */}
        {stage === "playing" && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-mono tracking-widest text-white/50 backdrop-blur">
            {currentProvider?.label ?? "STREAM"}
          </div>
        )}


        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
      </div>

      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => { setShowSettings(false); setProviders(orderedProviders()); }} />}
      </AnimatePresence>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// UI PIECES
// ---------------------------------------------------------------------------

function StageOverlay({
  stage, label, provider, attempt, total, title,
}: {
  stage: Stage; label: string; provider?: PlaybackProvider;
  attempt: number; total: number; title: string;
}) {
  const stageOrder: Stage[] = [
    "loading-movie", "checking-provider", "preparing-stream", "starting-playback",
  ];
  const idx = Math.max(0, stageOrder.indexOf(stage));
  const pct = ((idx + 1) / stageOrder.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-5xl sm:text-6xl font-black tracking-widest text-foreground "
      >
        GHOSTFLIX
      </motion.div>
      <div className="mt-2 text-xs text-white/60">{title}</div>

      <div className="mt-8 h-0.5 w-72 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[var(--ice)] to-[#a8ecff]"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] tracking-[0.4em] font-mono text-white/70">
        <Loader2 className="h-3 w-3 animate-spin text-[var(--ice)]" />
        {label}
      </div>

      <div className="mt-6 text-[10px] font-mono text-white/40 tracking-widest">
        PROVIDER {attempt}/{total} · {provider?.label ?? "—"}
      </div>

      <ul className="mt-3 space-y-1 text-[10px] font-mono text-white/50">
        {stageOrder.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            {i < idx ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            ) : i === idx ? (
              <Loader2 className="h-3 w-3 animate-spin text-[var(--ice)]" />
            ) : (
              <span className="h-3 w-3 rounded-full border border-white/20" />
            )}
            <span className={i === idx ? "text-white/80" : ""}>{STAGE_LABELS[s as keyof typeof STAGE_LABELS]}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ErrorOverlay({
  title, message, onRetry, onBack, onSettings, onReload, url,
}: {
  title: string; message: string;
  onRetry: () => void; onBack: () => void; onSettings: () => void;
  onReload: () => void; url?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
    >
      <div className="relative max-w-md w-full rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-black ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,.6)] p-7 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--ice)] to-[#2b8fbd] flex items-center justify-center ring-1 ring-white/15">
          <AlertTriangle className="h-7 w-7 text-white" />
        </div>
        <div className="mt-5 text-[10px] tracking-[0.5em] font-mono text-[var(--ice)]">MOVIE UNAVAILABLE</div>
        <h3 className="mt-1 text-xl font-black tracking-wide text-white">{title}</h3>
        <p className="mt-3 text-sm text-white/70 leading-relaxed">{message}</p>
        <p className="mt-2 text-xs text-white/40">Please try again later, or switch playback provider in Settings.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onRetry} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[var(--ice)] to-[#2b8fbd] text-white text-xs font-bold tracking-wider hover:brightness-110 transition">
            <RefreshCw className="h-3.5 w-3.5" /> RETRY
          </button>
          <button onClick={onReload} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white text-xs font-bold tracking-wider hover:bg-white/10 transition">
            <RotateCw className="h-3.5 w-3.5" /> RELOAD SOURCE
          </button>
          {url && (
            <button onClick={() => window.open(url, "_blank", "noopener,noreferrer")} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white text-xs font-bold tracking-wider hover:bg-white/10 transition">
              <Maximize2 className="h-3.5 w-3.5" /> NEW TAB
            </button>
          )}
          <button onClick={onSettings} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white text-xs font-bold tracking-wider hover:bg-white/10 transition">
            <SettingsIcon className="h-3.5 w-3.5" /> PROVIDERS
          </button>
          <button onClick={onBack} className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white/80 text-xs font-bold tracking-wider hover:bg-white/10 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> BACK TO DESKTOP
          </button>
        </div>
      </div>
    </motion.div>

  );
}

// (Removed the simulated control bar: transport lives in the provider player.)


// ---------------------------------------------------------------------------
// SETTINGS — provider preferences
// ---------------------------------------------------------------------------

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<ProviderPrefs>(() => loadProviderPrefs());
  const ordered = useMemo(() => orderedProviders(prefs), [prefs]);

  const commit = (next: ProviderPrefs) => {
    setPrefs(next);
    saveProviderPrefs(next);
  };

  const move = (id: string, dir: -1 | 1) => {
    const list = ordered.map((p) => p.id);
    const i = list.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    // Append any providers not in `list` at the end (defensive).
    for (const p of ALL_PROVIDERS) if (!list.includes(p.id)) list.push(p.id);
    commit({ ...prefs, order: list });
  };

  const toggle = (id: string) => {
    const disabled = new Set(prefs.disabled);
    if (disabled.has(id)) disabled.delete(id);
    else disabled.add(id);
    commit({ ...prefs, disabled: Array.from(disabled) });
  };

  const reset = () => commit({ order: [], disabled: [] });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-gradient-to-br from-zinc-950 via-black to-zinc-950 ring-1 ring-white/10 shadow-[0_0_40px_rgba(0,0,0,.7)] p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.4em] font-mono text-[var(--ice)]">GHOSTFLIX SETTINGS</div>
            <h3 className="mt-1 text-lg font-black tracking-wide">Playback Provider</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <p className="mt-2 text-xs text-white/50 leading-relaxed">
          GhostFlix will try providers in order. If one fails, it automatically switches to the next. Reorder or disable providers to match your preference.
        </p>

        <ul className="mt-5 space-y-2">
          {orderedProviders({ order: prefs.order, disabled: [] }).map((p, i, arr) => {
            const disabled = prefs.disabled.includes(p.id);
            return (
              <li key={p.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-white/10 ${disabled ? "opacity-40 bg-white/[0.02]" : "bg-white/[0.04]"}`}>
                <div className="text-[10px] font-mono text-white/40 w-6">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{p.label}</div>
                  <div className="text-[11px] text-white/50 truncate">{p.description}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(p.id, -1)} disabled={i === 0} className="h-7 w-7 rounded hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button onClick={() => move(p.id, 1)} disabled={i === arr.length - 1} className="h-7 w-7 rounded hover:bg-white/10 disabled:opacity-30 flex items-center justify-center"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => toggle(p.id)}
                    className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest ${disabled ? "bg-white/5 text-white/50" : "bg-[var(--ice-soft)] text-[var(--ice)] ring-1 ring-[var(--ice)]/40"}`}
                  >
                    {disabled ? "OFF" : "ON"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between">
          <button onClick={reset} className="text-[11px] font-mono text-white/50 hover:text-white/80 tracking-widest">RESET TO DEFAULTS</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--ice)] to-[#2b8fbd] text-white text-xs font-bold tracking-widest hover:brightness-110">DONE</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
