import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";

/**
 * Ghost Music engine — a single source of truth for playback shared by the
 * Ghost Music app and the desktop Now Playing widget.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** duration in seconds */
  duration: number;
  /** artwork gradient (Obsidian-tinted) */
  art: string;
}

export const TRACKS: Track[] = [
  { id: "1", title: "Spectral Dawn",    artist: "VOID//KIN",      album: "Ghost Signals",    duration: 222, art: "from-[#66d9ff] to-[#123244]" },
  { id: "2", title: "Neon Veins",       artist: "Kuroshio",       album: "Deep Current",     duration: 251, art: "from-[#8fd7ff] to-[#101b2c]" },
  { id: "3", title: "Hollow Circuit",   artist: "Ghost Atlas",    album: "Static Empire",    duration: 302, art: "from-[#9de6d6] to-[#0f2320]" },
  { id: "4", title: "Midnight Matrix",  artist: "Static Empress", album: "Static Empire",    duration: 208, art: "from-[#c9d4ff] to-[#141428]" },
  { id: "5", title: "Echo Garden",      artist: "Pale Signal",    album: "Chapel of Air",    duration: 374, art: "from-[#ffd9a8] to-[#2a1d10]" },
  { id: "6", title: "Pulse 808",        artist: "DJ Specter",     album: "Nightclub Ghosts", duration: 175, art: "from-[#b9a8ff] to-[#171130]" },
  { id: "7", title: "Cassette Dream",   artist: "Halo Machine",   album: "Analog Youth",     duration: 273, art: "from-[#ffb8d0] to-[#2a1220]" },
  { id: "8", title: "Lonely Satellite", artist: "VOID//KIN",      album: "Ghost Signals",    duration: 199, art: "from-[#7fe0ff] to-[#0e1c26]" },
];

export const ALBUMS = [
  { id: "a1", name: "Ghost Signals",    artist: "VOID//KIN",     year: 2025, art: "from-[#66d9ff] to-[#0f2634]" },
  { id: "a2", name: "Deep Current",     artist: "Kuroshio",      year: 2024, art: "from-[#8fd7ff] to-[#101b2c]" },
  { id: "a3", name: "Static Empire",    artist: "Ghost Atlas",   year: 2024, art: "from-[#9de6d6] to-[#0f2320]" },
  { id: "a4", name: "Chapel of Air",    artist: "Pale Signal",   year: 2023, art: "from-[#ffd9a8] to-[#2a1d10]" },
  { id: "a5", name: "Analog Youth",     artist: "Halo Machine",  year: 2025, art: "from-[#ffb8d0] to-[#2a1220]" },
  { id: "a6", name: "Nightclub Ghosts", artist: "DJ Specter",    year: 2022, art: "from-[#b9a8ff] to-[#171130]" },
];

export const PLAYLISTS = ["Late Night Drive", "Cyber Lo-Fi", "Neon Workouts", "Study Ghosts", "Rain & Static"];

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface MusicCtx {
  track: Track | null;
  index: number;
  playing: boolean;
  position: number;
  volume: number;
  liked: Record<string, boolean>;
  shuffle: boolean;
  repeat: boolean;
  playIndex: (i: number) => void;
  playTrack: (id: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleLike: (id: string) => void;
  setShuffle: (b: boolean) => void;
  setRepeat: (b: boolean) => void;
  stop: () => void;
}

const Ctx = createContext<MusicCtx | null>(null);
const LS_LIKED = "ghost.music.liked";

export function MusicProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const posRef = useRef(0);

  useEffect(() => {
    try { setLiked(JSON.parse(window.localStorage.getItem(LS_LIKED) || "{}")); } catch { /* noop */ }
  }, []);

  const track = index >= 0 ? TRACKS[index] ?? null : null;

  const next = useCallback(() => {
    setIndex((i) => {
      if (shuffle) {
        let n = i;
        while (TRACKS.length > 1 && n === i) n = Math.floor(Math.random() * TRACKS.length);
        return n;
      }
      return (i + 1) % TRACKS.length;
    });
    setPosition(0);
    posRef.current = 0;
    setPlaying(true);
  }, [shuffle]);

  const prev = useCallback(() => {
    if (posRef.current > 4) { setPosition(0); posRef.current = 0; return; }
    setIndex((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    setPosition(0);
    posRef.current = 0;
    setPlaying(true);
  }, []);

  // Playback clock
  useEffect(() => {
    if (!playing || !track) return;
    const id = window.setInterval(() => {
      posRef.current += 1;
      if (posRef.current >= track.duration) {
        if (repeat) { posRef.current = 0; setPosition(0); return; }
        next();
        return;
      }
      setPosition(posRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, track, repeat, next]);

  const playIndex = useCallback((i: number) => {
    setIndex(i);
    setPosition(0);
    posRef.current = 0;
    setPlaying(true);
  }, []);

  const value = useMemo<MusicCtx>(() => ({
    track, index, playing, position, volume, liked, shuffle, repeat,
    playIndex,
    playTrack: (id) => { const i = TRACKS.findIndex((t) => t.id === id); if (i >= 0) playIndex(i); },
    toggle: () => setPlaying((p) => (track ? !p : p)),
    next, prev,
    seek: (sec) => { posRef.current = sec; setPosition(sec); },
    setVolume,
    toggleLike: (id) => setLiked((s) => {
      const nextState = { ...s, [id]: !s[id] };
      try { window.localStorage.setItem(LS_LIKED, JSON.stringify(nextState)); } catch { /* noop */ }
      return nextState;
    }),
    setShuffle, setRepeat,
    stop: () => { setPlaying(false); setIndex(-1); setPosition(0); posRef.current = 0; },
  }), [track, index, playing, position, volume, liked, shuffle, repeat, playIndex, next, prev]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMusic() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMusic outside MusicProvider");
  return v;
}
