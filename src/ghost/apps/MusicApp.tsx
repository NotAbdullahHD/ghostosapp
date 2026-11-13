import { useEffect, useState, type ReactNode } from "react";
import { Home, Search, Library, Plus, Heart, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ListMusic, Loader2, Music2, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtTime, searchTracks, useMusic, type Track } from "../music";

type Playlist = { name: string; tracks: Track[] };
function Cover({ track, className }: { track: Track; className: string }) {
  const [failed, setFailed] = useState(false);
  return track.cover && !failed ? <img src={track.cover} onError={() => setFailed(true)} alt={track.title} loading="lazy" className={`${className} object-cover`} /> : <div className={`${className} grid place-items-center bg-music-hover`}><Music2 /></div>;
}
function IconButton({ label, children, onClick, active = false, disabled = false }: { label: string; children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <Button variant="ghost" size="icon" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick} className={active ? "text-music-accent hover:text-music-accent" : "text-music-muted hover:text-music-text"}>{children}</Button>;
}
export function MusicApp() {
  const m = useMusic();
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [queue, setQueue] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  useEffect(() => { try { setPlaylists(JSON.parse(localStorage.getItem("ghost.music.playlists.v1") || "[]")); } catch { /* empty library */ } }, []);
  const save = (next: Playlist[]) => { setPlaylists(next); try { localStorage.setItem("ghost.music.playlists.v1", JSON.stringify(next)); } catch { /* storage unavailable */ } };
  useEffect(() => {
    let cancelled = false;
    setSearchError(false);
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const timer = window.setTimeout(() => { searchTracks(query).then(list => { if (!cancelled) setResults(list); }).catch(() => { if (!cancelled) { setResults([]); setSearchError(true); } }).finally(() => { if (!cancelled) setSearching(false); }); }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);
  const selected = view.startsWith("playlist:") ? playlists[Number(view.slice(9))] : undefined;
  const tracks = view === "liked" ? m.tracks.filter(t => m.liked[t.id]) : selected ? selected.tracks : view === "search" && query.trim() ? results : m.tracks;
  const play = (t: Track) => { if (m.track?.id === t.id) m.toggle(); else m.setQueue(tracks, tracks.findIndex(x => x.id === t.id)); };
  return <div className="music-app flex h-full min-h-0 flex-col bg-music-base text-music-text">
    <div className="flex min-h-0 flex-1 gap-2 p-2 pb-0">
      <aside className="flex w-52 shrink-0 flex-col gap-2 max-[600px]:w-14">
        <nav className="rounded-lg bg-music-panel p-2">
          {([{ id: "home", label: "Home", icon: Home }, { id: "search", label: "Search", icon: Search }] as const).map(item => <Button key={item.id} variant="ghost" onClick={() => setView(item.id)} title={item.label} className={`w-full justify-start gap-4 px-3 ${view === item.id ? "text-music-text" : "text-music-muted"}`}><item.icon /><span className="max-[600px]:hidden">{item.label}</span></Button>)}
        </nav>
        <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-music-panel p-2">
          <div className="flex items-center justify-between"><Button variant="ghost" onClick={() => setView("liked")} title="Your library" className="min-w-0 justify-start gap-3 px-3 text-music-muted"><Library /><span className="truncate max-[600px]:hidden">Your library</span></Button><div className="max-[600px]:hidden"><IconButton label="Create playlist" onClick={() => setCreating(true)}><Plus /></IconButton></div></div>
          <Button variant="ghost" onClick={() => setView("liked")} title="Liked songs" className="mt-3 justify-start gap-3 px-3"><Heart className="text-music-accent" /><span className="max-[600px]:hidden">Liked songs</span></Button>
          <div className="min-h-0 overflow-y-auto">{playlists.map((p, i) => <Button key={`${p.name}-${i}`} variant="ghost" onClick={() => setView(`playlist:${i}`)} title={p.name} className="w-full justify-start gap-3 px-3"><ListMusic /><span className="truncate max-[600px]:hidden">{p.name}</span></Button>)}</div>
        </div>
      </aside>
      <main className="relative min-w-0 flex-1 overflow-y-auto rounded-lg bg-music-panel p-5 @container">
        <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          {view === "search" ? <label className="flex min-w-0 max-w-md items-center gap-2 rounded-full bg-music-hover px-4 py-2.5"><Search className="size-4 shrink-0" /><input aria-label="Search music" autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="What do you want to listen to?" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label> : <h1 className="truncate text-xl font-bold">{selected?.name ?? (view === "liked" ? "Liked songs" : "Ghost Music")}</h1>}
          <IconButton label="Show queue" active={queue} onClick={() => setQueue(!queue)}><ListMusic /></IconButton>
        </header>
        {creating && <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; const next = [...playlists, { name: name.trim(), tracks: [] }]; save(next); setView(`playlist:${next.length - 1}`); setCreating(false); setName(""); }} className="mb-5 flex gap-2"><input aria-label="Playlist name" value={name} onChange={e => setName(e.target.value)} placeholder="Playlist name" className="min-w-0 flex-1 rounded bg-music-hover px-3 text-sm" /><Button type="submit" className="bg-music-accent text-music-base hover:bg-music-accent/90">Create</Button><IconButton label="Cancel" onClick={() => setCreating(false)}><X /></IconButton></form>}
        {(m.loading || searching) && <div role="status" className="flex items-center gap-2 py-8 text-music-muted"><Loader2 className="size-5 animate-spin" />Loading music…</div>}
        {m.error && !m.loading && <div role="alert" className="py-8"><p className="mb-3 text-music-muted">Music is unavailable right now.</p><Button variant="secondary" onClick={m.reload}><RotateCw />Retry</Button></div>}
        {searchError && <p role="alert" className="text-music-muted">Search couldn’t connect. Try another search.</p>}
        {!m.loading && !searching && !m.error && <>
          <h2 className="mb-4 text-xl font-bold">{view === "home" ? "Trending now" : view === "search" ? "Songs" : `${tracks.length} songs`}</h2>
          {view === "home" ? <div className="grid grid-cols-2 gap-4 @lg:grid-cols-3 @2xl:grid-cols-4">{tracks.slice(0, 16).map(t => <div key={t.id} className="group min-w-0 rounded-md bg-music-card p-3 transition-colors hover:bg-music-hover"><Button variant="ghost" onClick={() => play(t)} aria-label={`Play ${t.title}`} className="relative block h-auto w-full overflow-hidden p-0 hover:bg-transparent"><Cover track={t} className="aspect-square w-full rounded-md" /><span className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-music-accent text-music-base opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"><Play className="fill-current" /></span></Button><p className="mt-3 truncate text-sm font-semibold">{t.title}</p><p className="mt-1 truncate text-xs text-music-muted">{t.artist}</p></div>)}</div> : <div>{tracks.map((t, i) => <div key={t.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded px-2 py-2 hover:bg-music-hover"><IconButton label={`Play ${t.title}`} onClick={() => play(t)}>{m.track?.id === t.id && m.playing ? <Pause /> : <Play />}</IconButton><div className="flex min-w-0 items-center gap-3"><Cover track={t} className="size-10 shrink-0 rounded" /><div className="min-w-0"><p className={`truncate text-sm ${m.track?.id === t.id ? "text-music-accent" : ""}`}>{t.title}</p><p className="truncate text-xs text-music-muted">{t.artist}</p></div></div><div className="flex items-center"><IconButton label={`Like ${t.title}`} active={!!m.liked[t.id]} onClick={() => m.toggleLike(t.id)}><Heart className={m.liked[t.id] ? "fill-current" : ""} /></IconButton><span className="w-10 text-right text-xs text-music-muted">{fmtTime(t.duration)}</span></div></div>)}{tracks.length === 0 && <p className="py-6 text-sm text-music-muted">{selected ? "Play a song, then add it to this playlist below." : "No songs yet."}</p>}</div>}
          {selected && m.track && <Button variant="secondary" className="mt-4" disabled={selected.tracks.some(t => t.id === m.track?.id)} onClick={() => { const t = m.track; if (!t) return; save(playlists.map(p => p === selected ? { ...p, tracks: [...p.tracks, t] } : p)); }}><Plus />Add current song</Button>}
        </>}
        {queue && <div className="absolute inset-0 z-10 overflow-y-auto bg-music-panel p-5"><div className="mb-4 flex justify-between"><h2 className="text-xl font-bold">Queue</h2><IconButton label="Close queue" onClick={() => setQueue(false)}><X /></IconButton></div>{m.tracks.map((t, i) => <Button key={t.id} variant="ghost" className="h-auto w-full justify-start gap-3 py-2" onClick={() => m.playIndex(i)}><Cover track={t} className="size-10 rounded" /><span className="min-w-0 truncate">{t.title}</span></Button>)}</div>}
      </main>
    </div>
    {m.playbackError && <div role="alert" className="px-4 pt-2 text-xs text-destructive">{m.playbackError}<Button variant="ghost" size="sm" onClick={m.toggle}>Retry</Button></div>}
    <footer className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(160px,1.4fr)_minmax(0,1fr)] items-center gap-3 px-4 py-3 max-[600px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex min-w-0 items-center gap-3">{m.track && <Cover track={m.track} className="size-12 shrink-0 rounded" />}<div className="min-w-0"><p className="truncate text-xs font-medium">{m.track?.title ?? "Nothing playing"}</p><p className="truncate text-xs text-music-muted">{m.track?.artist}</p></div>{m.track && <div className="max-[750px]:hidden"><IconButton label="Like current song" active={!!m.liked[m.track.id]} onClick={() => { if (m.track) m.toggleLike(m.track.id); }}><Heart /></IconButton></div>}</div>
      <div className="min-w-0"><div className="flex items-center justify-center gap-1"><span className="max-[600px]:hidden"><IconButton label="Shuffle" active={m.shuffle} onClick={() => m.setShuffle(!m.shuffle)}><Shuffle /></IconButton></span><IconButton label="Previous" disabled={!m.track} onClick={m.prev}><SkipBack /></IconButton><Button variant="ghost" size="icon" aria-label={m.playing ? "Pause" : "Play"} onClick={() => m.track ? m.toggle() : m.playIndex(0)} disabled={!m.tracks.length} className="rounded-full bg-music-text text-music-base hover:bg-music-text/90">{m.buffering ? <Loader2 className="animate-spin" /> : m.playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}</Button><IconButton label="Next" disabled={!m.track} onClick={m.next}><SkipForward /></IconButton><span className="max-[600px]:hidden"><IconButton label="Repeat" active={m.repeat} onClick={() => m.setRepeat(!m.repeat)}><Repeat /></IconButton></span></div><div className="mt-1 flex items-center gap-2 text-[10px] tabular-nums text-music-muted max-[600px]:hidden"><span>{fmtTime(m.position)}</span><input aria-label="Seek" type="range" min={0} max={Math.max(1, m.duration)} value={Math.min(m.position, m.duration)} onChange={e => m.seek(+e.target.value)} className="min-w-0 flex-1 accent-music-accent" /><span>{fmtTime(m.duration)}</span></div></div>
      <div className="flex min-w-0 items-center justify-end gap-2 max-[600px]:hidden"><IconButton label="Queue" active={queue} onClick={() => setQueue(!queue)}><ListMusic /></IconButton><Volume2 className="size-4 shrink-0 text-music-muted" /><input aria-label="Volume" type="range" min={0} max={100} value={m.volume} onChange={e => m.setVolume(+e.target.value)} className="w-20 min-w-0 accent-music-accent" /></div>
    </footer>
  </div>;
}
