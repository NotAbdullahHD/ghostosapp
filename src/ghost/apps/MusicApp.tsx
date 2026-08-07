import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2,
  Search, Home, Compass, Library, Radio, ListMusic, Plus, MoreHorizontal, Music2,
  Loader2, AlertTriangle, RotateCw,
} from "lucide-react";
import { PLAYLISTS, fmtTime, searchTracks, useMusic, type Track } from "../music";

type Tab = "home" | "browse" | "library" | "search" | "radio";

function Cover({ track, className }: { track: Track; className: string }) {
  if (track.cover) {
    return (
      <img
        src={track.cover}
        alt={`${track.title} cover art`}
        loading="lazy"
        className={`${className} object-cover`}
      />
    );
  }
  return <div className={`${className} bg-gradient-to-br ${track.art}`} />;
}

/** Ghost Music — native GhostOS music client (Obsidian design language). */
export function MusicApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [q, setQ] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const [results, setResults] = useState<Track[] | null>(null);
  const [searching, setSearching] = useState(false);
  const m = useMusic();

  // Real remote search (debounced).
  useEffect(() => {
    const s = q.trim();
    if (!s) { setResults(null); setSearching(false); return; }
    setSearching(true);
    const id = window.setTimeout(() => {
      searchTracks(s)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => window.clearTimeout(id);
  }, [q]);

  const artists = useMemo(() => {
    const seen = new Map<string, Track>();
    for (const t of m.tracks) if (!seen.has(t.artist)) seen.set(t.artist, t);
    return [...seen.values()].slice(0, 12);
  }, [m.tracks]);

  const albums = useMemo(() => m.tracks.slice(0, 8), [m.tracks]);

  return (
    <div className="flex h-full flex-col bg-[#0b0b0d] text-white/90">
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="flex w-52 flex-col border-r border-white/[0.07] bg-[#101012]">
          <div className="flex items-center gap-2.5 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ice)]/15 ring-1 ring-[var(--ice)]/30">
              <Music2 className="h-4 w-4 text-[var(--ice)]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold tracking-tight">Ghost Music</div>
              <div className="text-[10px] text-white/35">Library</div>
            </div>
          </div>

          <nav className="space-y-0.5 px-2">
            {([
              { k: "home", l: "Home", i: <Home className="h-3.5 w-3.5" /> },
              { k: "browse", l: "Browse", i: <Compass className="h-3.5 w-3.5" /> },
              { k: "library", l: "Library", i: <Library className="h-3.5 w-3.5" /> },
              { k: "radio", l: "Radio", i: <Radio className="h-3.5 w-3.5" /> },
              { k: "search", l: "Search", i: <Search className="h-3.5 w-3.5" /> },
            ] as const).map((it) => (
              <button
                key={it.k}
                onClick={() => setTab(it.k)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[12px] transition ${
                  tab === it.k
                    ? "bg-white/[0.07] text-white ring-1 ring-white/10"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/90"
                }`}
              >
                {it.i}{it.l}
              </button>
            ))}
          </nav>

          <div className="mt-6 px-4">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/30">
              Playlists
              <button className="text-white/30 transition hover:text-white/70"><Plus className="h-3 w-3" /></button>
            </div>
            <div className="space-y-0.5">
              {PLAYLISTS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setTab("search"); setQ(p === "Trending Now" ? "" : p); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11.5px] text-white/45 transition hover:bg-white/[0.04] hover:text-white/90"
                >
                  <ListMusic className="h-3 w-3 opacity-60" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            {tab === "search" ? (
              <div className="p-6">
                <div className="flex max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5">
                  <Search className="h-3.5 w-3.5 text-white/40" />
                  <input
                    value={q} onChange={(e) => setQ(e.target.value)} autoFocus
                    placeholder="Search tracks, artists, albums"
                    className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-white/25"
                  />
                  {searching && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
                </div>
                <div className="mt-5">
                  {results && results.length === 0 && !searching ? (
                    <div className="rounded-xl border border-white/[0.07] p-6 text-center text-[12px] text-white/40">
                      No results for “{q}”.
                    </div>
                  ) : (
                    <TrackList tracks={results ?? m.tracks} />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-[10px] uppercase tracking-[0.24em] text-[var(--ice)]/70">
                  {tab === "library" ? "Your library" : tab === "radio" ? "Ghost radio" : tab === "browse" ? "Browse" : "Featured"}
                </div>
                <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-white">
                  {tab === "library" ? "Everything you love"
                    : tab === "radio" ? "Stations for the mood"
                    : tab === "browse" ? "New this week"
                    : "Tonight's frequency"}
                </h1>

                {m.loading && (
                  <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-white/40">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading catalogue…
                  </div>
                )}

                {!m.loading && m.error && (
                  <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-white/[0.07] p-8 text-center">
                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                    <div className="text-[12.5px] text-white/70">{m.error}</div>
                    <button
                      onClick={m.reload}
                      className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-[11.5px] transition hover:bg-white/20"
                    >
                      <RotateCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                )}

                {!m.loading && !m.error && (
                  <>
                    <Section title="Recently played">
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {m.tracks.slice(0, 6).map((t, i) => (
                          <button
                            key={t.id} onClick={() => m.playIndex(i)}
                            className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-2 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
                          >
                            <Cover track={t} className="h-11 w-11 rounded-lg" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-medium">{t.title}</div>
                              <div className="truncate text-[10.5px] text-white/40">{t.artist}</div>
                            </div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black opacity-0 transition group-hover:opacity-100">
                              <Play className="h-3.5 w-3.5 fill-black" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </Section>

                    <Section title="Albums">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                        {albums.map((a) => (
                          <motion.button
                            key={a.id} whileHover={{ y: -3 }}
                            onClick={() => m.playTrack(a.id)}
                            className="group overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] text-left"
                          >
                            <div className="relative aspect-square">
                              <Cover track={a} className="h-full w-full" />
                              <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-black opacity-0 shadow-lg transition group-hover:opacity-100">
                                <Play className="h-4 w-4 fill-black" />
                              </span>
                            </div>
                            <div className="p-3">
                              <div className="truncate text-[12.5px] font-medium">{a.title}</div>
                              <div className="truncate text-[10.5px] text-white/40">{a.artist} · {a.album}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </Section>

                    <Section title="Artists">
                      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                        {artists.map((t) => (
                          <div key={t.artist} className="w-24 flex-shrink-0 text-center">
                            <Cover track={t} className="h-24 w-24 rounded-full ring-1 ring-white/10" />
                            <div className="mt-2 truncate text-[12px] font-medium">{t.artist}</div>
                            <div className="text-[10px] text-white/30">Artist</div>
                          </div>
                        ))}
                      </div>
                    </Section>

                    <Section title="All tracks">
                      <TrackList tracks={m.tracks} />
                    </Section>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Queue */}
        {showQueue && (
          <aside className="w-64 flex-shrink-0 overflow-y-auto scrollbar-hide border-l border-white/[0.07] bg-[#101012] p-3">
            <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.18em] text-white/30">Queue</div>
            <div className="space-y-1">
              {m.tracks.map((t, i) => (
                <button
                  key={t.id} onClick={() => m.playIndex(i)}
                  className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition ${
                    i === m.index ? "bg-[var(--ice)]/10 ring-1 ring-[var(--ice)]/25" : "hover:bg-white/[0.05]"
                  }`}
                >
                  <Cover track={t} className="h-8 w-8 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] font-medium">{t.title}</div>
                    <div className="truncate text-[10px] text-white/40">{t.artist}</div>
                  </div>
                  <div className="text-[10px] tabular-nums text-white/30">{fmtTime(t.duration)}</div>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      {/* Transport bar */}
      <div className="border-t border-white/[0.07] bg-[#0e0e10]">
        {m.playbackError && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-400/[0.06] px-4 py-1.5 text-[11px] text-amber-200">
            <AlertTriangle className="h-3 w-3" /> {m.playbackError}
          </div>
        )}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex w-60 min-w-0 items-center gap-3">
            {m.track ? (
              <>
                <Cover track={m.track} className="h-11 w-11 rounded-lg ring-1 ring-white/10" />
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium">{m.track.title}</div>
                  <div className="truncate text-[10.5px] text-white/40">{m.track.artist} · {m.track.album}</div>
                </div>
                <button
                  onClick={() => m.toggleLike(m.track!.id)}
                  className={`transition ${m.liked[m.track.id] ? "text-[var(--ice)]" : "text-white/35 hover:text-white/80"}`}
                >
                  <Heart className={`h-4 w-4 ${m.liked[m.track.id] ? "fill-current" : ""}`} />
                </button>
              </>
            ) : (
              <div className="text-[11.5px] text-white/30">Nothing playing</div>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex items-center gap-5 text-white/55">
              <button onClick={() => m.setShuffle(!m.shuffle)} className={m.shuffle ? "text-[var(--ice)]" : "hover:text-white"}>
                <Shuffle className="h-3.5 w-3.5" />
              </button>
              <button onClick={m.prev} className="hover:text-white"><SkipBack className="h-4 w-4" /></button>
              <button
                onClick={() => (m.track ? m.toggle() : m.playIndex(0))}
                disabled={!m.tracks.length}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-black transition hover:scale-105 disabled:opacity-40"
              >
                {m.buffering
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : m.playing ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black" />}
              </button>
              <button onClick={m.next} className="hover:text-white"><SkipForward className="h-4 w-4" /></button>
              <button onClick={() => m.setRepeat(!m.repeat)} className={m.repeat ? "text-[var(--ice)]" : "hover:text-white"}>
                <Repeat className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex w-full max-w-md items-center gap-2 text-[10px] tabular-nums text-white/35">
              <span>{fmtTime(m.position)}</span>
              <input
                type="range" min={0} max={Math.max(1, m.duration)} step={0.5} value={Math.min(m.position, m.duration || 0)}
                onChange={(e) => m.seek(Number(e.target.value))}
                className="h-1 flex-1 accent-[var(--ice)]"
              />
              <span>{fmtTime(m.duration)}</span>
            </div>
          </div>

          <div className="flex w-60 items-center justify-end gap-3 text-white/50">
            <button
              onClick={() => setShowQueue((s) => !s)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${showQueue ? "bg-white/10 text-white" : "hover:text-white"}`}
            >
              <ListMusic className="h-4 w-4" />
            </button>
            <Volume2 className="h-4 w-4" />
            <input
              type="range" min={0} max={100} value={m.volume}
              onChange={(e) => m.setVolume(Number(e.target.value))}
              className="h-1 w-24 accent-[var(--ice)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{title}</h2>
        <button className="text-[10px] uppercase tracking-[0.18em] text-white/30 transition hover:text-white/70">See all</button>
      </div>
      {children}
    </section>
  );
}

function TrackList({ tracks }: { tracks: Track[] }) {
  const m = useMusic();
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07]">
      {tracks.map((t) => {
        const isActive = m.track?.id === t.id;
        return (
          <div
            key={t.id}
            className={`group flex items-center gap-3 border-b border-white/[0.05] px-3 py-2 transition last:border-0 ${
              isActive ? "bg-[var(--ice)]/[0.07]" : "hover:bg-white/[0.04]"
            }`}
          >
            <button
              onClick={() => {
                if (m.tracks.some((x) => x.id === t.id)) m.playTrack(t.id);
                else m.setQueue(tracks, tracks.findIndex((x) => x.id === t.id));
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-white/55 transition group-hover:text-white"
            >
              {isActive && m.buffering
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : isActive && m.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
            </button>
            <Cover track={t} className="h-8 w-8 flex-shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className={`truncate text-[12px] font-medium ${isActive ? "text-[var(--ice)]" : ""}`}>{t.title}</div>
              <div className="truncate text-[10.5px] text-white/40">{t.artist}</div>
            </div>
            <div className="hidden w-32 truncate text-[10.5px] text-white/30 md:block">{t.album}</div>
            <button
              onClick={() => m.toggleLike(t.id)}
              className={`transition ${m.liked[t.id] ? "text-[var(--ice)]" : "text-white/30 opacity-0 hover:text-white group-hover:opacity-100"}`}
            >
              <Heart className={`h-3.5 w-3.5 ${m.liked[t.id] ? "fill-current" : ""}`} />
            </button>
            <div className="w-10 text-right text-[10.5px] tabular-nums text-white/30">{fmtTime(t.duration)}</div>
            <button className="text-white/30 opacity-0 transition hover:text-white group-hover:opacity-100">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
