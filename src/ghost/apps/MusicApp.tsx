import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2,
  Search, Home, Compass, Library, Radio, ListMusic, Mic2, Music2, Plus, MoreHorizontal,
} from "lucide-react";

interface Track { id: string; t: string; a: string; album: string; d: string; c: string; }

const TRACKS: Track[] = [
  { id: "1", t: "Spectral Dawn",   a: "VOID//KIN",      album: "Ghost Signals",  d: "3:42", c: "from-fuchsia-600 to-violet-900" },
  { id: "2", t: "Neon Veins",      a: "Kuroshio",       album: "Deep Current",   d: "4:11", c: "from-cyan-500 to-blue-900" },
  { id: "3", t: "Hollow Circuit",  a: "Ghost Atlas",    album: "Static Empire",  d: "5:02", c: "from-emerald-500 to-teal-900" },
  { id: "4", t: "Midnight Matrix", a: "Static Empress", album: "Static Empire",  d: "3:28", c: "from-rose-500 to-fuchsia-900" },
  { id: "5", t: "Echo Garden",     a: "Pale Signal",    album: "Chapel of Air",  d: "6:14", c: "from-amber-500 to-orange-900" },
  { id: "6", t: "Pulse 808",       a: "DJ Specter",     album: "Nightclub Ghosts", d: "2:55", c: "from-indigo-500 to-purple-900" },
  { id: "7", t: "Cassette Dream",  a: "Halo Machine",   album: "Analog Youth",   d: "4:33", c: "from-pink-500 to-fuchsia-800" },
  { id: "8", t: "Lonely Satellite",a: "VOID//KIN",      album: "Ghost Signals",  d: "3:19", c: "from-violet-500 to-indigo-800" },
];

const ALBUMS = [
  { id: "a1", name: "Ghost Signals",  artist: "VOID//KIN",     year: 2025, c: "from-fuchsia-500 to-violet-900" },
  { id: "a2", name: "Deep Current",   artist: "Kuroshio",      year: 2024, c: "from-cyan-500 to-blue-900" },
  { id: "a3", name: "Static Empire",  artist: "Ghost Atlas",   year: 2024, c: "from-emerald-500 to-teal-900" },
  { id: "a4", name: "Chapel of Air",  artist: "Pale Signal",   year: 2023, c: "from-amber-500 to-orange-900" },
  { id: "a5", name: "Analog Youth",   artist: "Halo Machine",  year: 2025, c: "from-pink-500 to-fuchsia-800" },
  { id: "a6", name: "Nightclub Ghosts", artist: "DJ Specter",  year: 2022, c: "from-indigo-500 to-purple-900" },
];

const PLAYLISTS = ["Late Night Drive", "Cyber Lo-Fi", "Neon Workouts", "Study Ghosts", "Rain & Static"];

type Tab = "home" | "browse" | "library" | "search" | "radio";

export function MusicApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [q, setQ] = useState("");
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [volume, setVolume] = useState(70);

  const cur = TRACKS[active];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TRACKS;
    return TRACKS.filter((t) => t.t.toLowerCase().includes(s) || t.a.toLowerCase().includes(s) || t.album.toLowerCase().includes(s));
  }, [q]);

  const play = (i: number) => { setActive(i); setPlaying(true); };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div className="w-56 border-r border-white/5 flex flex-col">
          <div className="p-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-neon flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Music2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold">Monochrome</div>
              <div className="text-[9px] font-mono tracking-widest text-fuchsia-300/70">GHOSTOS · MUSIC</div>
            </div>
          </div>

          <nav className="px-2 space-y-0.5">
            {[
              { k: "home",    l: "Home",       i: <Home className="h-3.5 w-3.5" /> },
              { k: "browse",  l: "Browse",     i: <Compass className="h-3.5 w-3.5" /> },
              { k: "library", l: "Library",    i: <Library className="h-3.5 w-3.5" /> },
              { k: "radio",   l: "Radio",      i: <Radio className="h-3.5 w-3.5" /> },
              { k: "search",  l: "Search",     i: <Search className="h-3.5 w-3.5" /> },
            ].map((it) => (
              <button key={it.k} onClick={() => setTab(it.k as Tab)}
                className={`w-full flex items-center gap-2 text-left px-3 py-1.5 rounded-lg text-xs transition ${
                  tab === it.k ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}>
                {it.i}{it.l}
              </button>
            ))}
          </nav>

          <div className="px-4 mt-5">
            <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1 flex items-center justify-between">
              PLAYLISTS <button className="text-white/40 hover:text-white"><Plus className="h-3 w-3" /></button>
            </div>
            <div className="space-y-0.5">
              {PLAYLISTS.map((p) => (
                <button key={p} className="w-full flex items-center gap-2 text-left px-2 py-1 rounded text-[11px] text-white/60 hover:bg-white/5 hover:text-white transition">
                  <ListMusic className="h-3 w-3 opacity-60" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">
          {/* Ambient hue derived from current track */}
          <div className={`absolute inset-0 opacity-40 pointer-events-none bg-gradient-to-br ${cur.c}`} style={{ filter: "blur(90px)" }} />
          <div className="relative flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            {tab === "search" && (
              <div className="p-6">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 ring-1 ring-white/10 max-w-md">
                  <Search className="h-3.5 w-3.5 text-white/50" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
                    placeholder="Search tracks, artists, albums"
                    className="bg-transparent outline-none text-xs flex-1 placeholder:text-white/30" />
                </div>
                <TrackList tracks={filtered} activeId={cur.id} playing={playing} liked={liked} onToggleLike={(id) => setLiked((s) => ({ ...s, [id]: !s[id] }))} onPlay={(i) => play(TRACKS.findIndex((t) => t.id === filtered[i].id))} />
              </div>
            )}

            {tab !== "search" && (
              <div className="p-6">
                <div className="text-[10px] tracking-[0.4em] text-emerald-300/70 font-mono">
                  {tab === "library" ? "YOUR LIBRARY" : tab === "radio" ? "GHOST RADIO" : tab === "browse" ? "BROWSE" : "FEATURED · TONIGHT"}
                </div>
                <h1 className="text-3xl font-bold mt-1">
                  {tab === "library" ? "Everything you love"
                    : tab === "radio" ? "Stations for the mood"
                    : tab === "browse" ? "New this week"
                    : "Tonight's Frequency"}
                </h1>

                {/* Recently Played */}
                <div className="mt-6">
                  <SectionTitle title="Recently Played" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TRACKS.slice(0, 6).map((t, i) => (
                      <motion.button key={t.id} whileHover={{ y: -2 }} onClick={() => play(i)}
                        className="flex items-center gap-3 rounded-xl bg-white/5 ring-1 ring-white/10 p-2 hover:bg-white/10 transition text-left">
                        <div className={`h-11 w-11 rounded-md bg-gradient-to-br ${t.c} shadow-lg`} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate">{t.t}</div>
                          <div className="text-[10px] font-mono text-white/50 truncate">{t.a}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); play(i); }}
                          className="h-8 w-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center hover:scale-105 transition shadow-lg shadow-fuchsia-500/40">
                          <Play className="h-3.5 w-3.5 fill-white" />
                        </button>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Albums */}
                <div className="mt-8">
                  <SectionTitle title="Albums" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {ALBUMS.map((a) => (
                      <motion.div key={a.id} whileHover={{ y: -4, scale: 1.02 }}
                        className="rounded-xl overflow-hidden ring-1 ring-white/10 bg-black/30 group">
                        <div className={`aspect-square bg-gradient-to-br ${a.c} relative`}>
                          <div className="absolute inset-0 opacity-30 mix-blend-overlay"
                               style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
                          <button className="absolute bottom-3 right-3 h-11 w-11 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-emerald-500/40 opacity-0 group-hover:opacity-100 transition">
                            <Play className="h-5 w-5 fill-black" />
                          </button>
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-bold truncate">{a.name}</div>
                          <div className="text-[10px] font-mono text-white/50 truncate">{a.artist} · {a.year}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Artists */}
                <div className="mt-8">
                  <SectionTitle title="Artists" />
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {Array.from(new Set(TRACKS.map((t) => t.a))).map((name, i) => (
                      <div key={name} className="flex-shrink-0 w-28 text-center">
                        <div className={`h-28 w-28 rounded-full bg-gradient-to-br ${TRACKS[i % TRACKS.length].c} shadow-xl ring-1 ring-white/10`} />
                        <div className="text-xs font-bold mt-2 truncate">{name}</div>
                        <div className="text-[10px] font-mono text-white/40">Artist</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Track list */}
                <div className="mt-8">
                  <SectionTitle title="Library" />
                  <TrackList tracks={TRACKS} activeId={cur.id} playing={playing} liked={liked} onToggleLike={(id) => setLiked((s) => ({ ...s, [id]: !s[id] }))} onPlay={play} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: queue / lyrics */}
        <AnimatePresence>
          {(showQueue || showLyrics) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 288, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="border-l border-white/5 overflow-hidden flex-shrink-0">
              <div className="w-72 h-full flex flex-col">
                <div className="flex border-b border-white/5">
                  <button onClick={() => { setShowQueue(true); setShowLyrics(false); }}
                    className={`flex-1 py-2 text-[10px] font-mono tracking-widest ${showQueue ? "text-white bg-white/5" : "text-white/50"}`}>QUEUE</button>
                  <button onClick={() => { setShowLyrics(true); setShowQueue(false); }}
                    className={`flex-1 py-2 text-[10px] font-mono tracking-widest ${showLyrics ? "text-white bg-white/5" : "text-white/50"}`}>LYRICS</button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
                  {showQueue && (
                    <div className="space-y-1.5">
                      {TRACKS.map((t, i) => (
                        <button key={t.id} onClick={() => play(i)}
                          className={`w-full flex items-center gap-2 rounded-lg p-2 text-left transition ${
                            i === active ? "bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30" : "hover:bg-white/5"
                          }`}>
                          <div className={`h-8 w-8 rounded bg-gradient-to-br ${t.c}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{t.t}</div>
                            <div className="text-[10px] font-mono text-white/50 truncate">{t.a}</div>
                          </div>
                          <div className="text-[10px] font-mono text-white/40">{t.d}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showLyrics && (
                    <div className="text-sm font-mono text-white/70 leading-relaxed space-y-3">
                      <p className="text-white text-base font-bold">{cur.t}</p>
                      <p className="text-white/40 italic">— lyrics soon —</p>
                      <p>Static in the sky tonight,</p>
                      <p>City breathing neon light.</p>
                      <p>Chase the pulse, we never sleep,</p>
                      <p>Ghosts we made, ours to keep.</p>
                      <p className="text-white/40 italic mt-4">Lyric sync will arrive in a future GhostOS update.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Now Playing bar */}
      <div className="border-t border-white/5 relative"
           style={{
             background: "linear-gradient(180deg, rgba(0,0,0,.5), rgba(0,0,0,.85))",
             backdropFilter: "blur(30px)",
             WebkitBackdropFilter: "blur(30px)",
           }}>
        <div className="flex items-center gap-4 px-4 py-3">
          {/* Now playing */}
          <div className="flex items-center gap-3 w-64 min-w-0">
            <motion.div layout className={`h-12 w-12 rounded-md bg-gradient-to-br ${cur.c} ring-1 ring-white/15 shadow-lg`} />
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{cur.t}</div>
              <div className="text-[10px] text-white/50 font-mono truncate">{cur.a} · {cur.album}</div>
            </div>
            <button onClick={() => setLiked((s) => ({ ...s, [cur.id]: !s[cur.id] }))}
              className={`transition ${liked[cur.id] ? "text-rose-400" : "text-white/50 hover:text-rose-400"}`}>
              <Heart className={`h-4 w-4 ${liked[cur.id] ? "fill-rose-400" : ""}`} />
            </button>
          </div>

          {/* Transport */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-4 text-white/70">
              <Shuffle className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
              <button onClick={() => play((active - 1 + TRACKS.length) % TRACKS.length)}><SkipBack className="h-4 w-4 hover:text-white" /></button>
              <button onClick={() => setPlaying((p) => !p)}
                className="h-9 w-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-lg shadow-white/20">
                {playing ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black" />}
              </button>
              <button onClick={() => play((active + 1) % TRACKS.length)}><SkipForward className="h-4 w-4 hover:text-white" /></button>
              <Repeat className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
            </div>
            <div className="w-full max-w-md flex items-center gap-2 text-[10px] font-mono text-white/40">
              <span className="tabular-nums">1:24</span>
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div animate={{ width: playing ? ["33%", "100%"] : "33%" }}
                  transition={{ duration: 180, ease: "linear", repeat: playing ? Infinity : 0 }}
                  className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500" />
              </div>
              <span className="tabular-nums">{cur.d}</span>
            </div>
          </div>

          {/* Right */}
          <div className="w-64 flex items-center justify-end gap-3 text-white/60">
            <button onClick={() => { setShowLyrics(false); setShowQueue((s) => !s); }}
              className={`h-8 w-8 rounded-md flex items-center justify-center transition ${showQueue ? "bg-white/10 text-white" : "hover:text-white"}`}>
              <ListMusic className="h-4 w-4" />
            </button>
            <button onClick={() => { setShowQueue(false); setShowLyrics((s) => !s); }}
              className={`h-8 w-8 rounded-md flex items-center justify-center transition ${showLyrics ? "bg-white/10 text-white" : "hover:text-white"}`}>
              <Mic2 className="h-4 w-4" />
            </button>
            <Volume2 className="h-4 w-4" />
            <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-fuchsia-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <button className="text-[10px] font-mono tracking-widest text-white/40 hover:text-white">SEE ALL</button>
    </div>
  );
}

function TrackList({ tracks, activeId, playing, liked, onToggleLike, onPlay }: {
  tracks: Track[]; activeId: string; playing: boolean; liked: Record<string, boolean>;
  onToggleLike: (id: string) => void; onPlay: (i: number) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-white/5">
      {tracks.map((t, i) => {
        const isActive = t.id === activeId;
        return (
          <div key={t.id}
            className={`group flex items-center gap-3 px-3 py-2 border-b border-white/5 last:border-0 transition ${
              isActive ? "bg-fuchsia-500/10" : "hover:bg-white/5"
            }`}>
            <button onClick={() => onPlay(i)}
              className="h-8 w-8 rounded-md flex items-center justify-center text-white/70 group-hover:text-white">
              {isActive && playing
                ? <Pause className="h-3.5 w-3.5" />
                : <Play className="h-3.5 w-3.5 fill-current" />}
            </button>
            <div className={`h-8 w-8 rounded bg-gradient-to-br ${t.c} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className={`text-xs font-bold truncate ${isActive ? "text-fuchsia-200" : ""}`}>{t.t}</div>
              <div className="text-[10px] font-mono text-white/50 truncate">{t.a}</div>
            </div>
            <div className="hidden md:block text-[10px] font-mono text-white/40 w-32 truncate">{t.album}</div>
            <button onClick={() => onToggleLike(t.id)}
              className={`opacity-0 group-hover:opacity-100 transition ${liked[t.id] ? "text-rose-400 opacity-100" : "text-white/50 hover:text-rose-400"}`}>
              <Heart className={`h-3.5 w-3.5 ${liked[t.id] ? "fill-rose-400" : ""}`} />
            </button>
            <div className="text-[10px] font-mono text-white/40 tabular-nums w-10 text-right">{t.d}</div>
            <button className="text-white/40 opacity-0 group-hover:opacity-100 transition hover:text-white">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
