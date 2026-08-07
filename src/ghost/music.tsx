import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";

/**
 * Ghost Music engine — REAL audio playback.
 *
 * Catalogue + streams come from the Audius public API (free, no key, CORS
 * enabled, full-length tracks). Playback is driven by a single shared
 * HTMLAudioElement, so position/duration/volume are the browser's real values
 * — there are no simulated timers anywhere in this file.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** real duration in seconds (from the provider, refined by the audio element) */
  duration: number;
  /** artwork gradient fallback */
  art: string;
  /** real cover artwork URL (may be undefined) */
  cover?: string;
  /** direct audio stream URL */
  streamUrl: string;
}

const GRADIENTS = [
  "from-[#66d9ff] to-[#123244]",
  "from-[#8fd7ff] to-[#101b2c]",
  "from-[#9de6d6] to-[#0f2320]",
  "from-[#c9d4ff] to-[#141428]",
  "from-[#ffd9a8] to-[#2a1d10]",
  "from-[#b9a8ff] to-[#171130]",
  "from-[#ffb8d0] to-[#2a1220]",
  "from-[#7fe0ff] to-[#0e1c26]",
];

export const PLAYLISTS = ["Trending Now", "Electronic", "Hip-Hop/Rap", "Lo-Fi", "Ambient"];

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Audius API
// ---------------------------------------------------------------------------
const APP = "GhostOS";
const FALLBACK_HOST = "https://discoveryprovider.audius.co";
let hostPromise: Promise<string> | null = null;

async function audiusHost(): Promise<string> {
  if (!hostPromise) {
    hostPromise = (async () => {
      try {
        const res = await fetch("https://api.audius.co");
        const json = (await res.json()) as { data?: string[] };
        const host = json.data?.[0];
        return (host || FALLBACK_HOST).replace(/\/+$/, "");
      } catch {
        return FALLBACK_HOST;
      }
    })();
  }
  return hostPromise;
}

interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  genre?: string;
  user?: { name?: string; handle?: string };
  artwork?: Record<string, string> | null;
  is_streamable?: boolean;
}

function mapTrack(t: AudiusTrack, host: string, i: number): Track {
  const art = t.artwork || {};
  return {
    id: t.id,
    title: t.title,
    artist: t.user?.name || t.user?.handle || "Unknown artist",
    album: t.genre || "Audius",
    duration: t.duration || 0,
    art: GRADIENTS[i % GRADIENTS.length],
    cover: art["480x480"] || art["150x150"] || art["1000x1000"] || undefined,
    streamUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${APP}`,
  };
}

async function audiusJson<T>(path: string): Promise<T> {
  const host = await audiusHost();
  const url = `${host}${path}${path.includes("?") ? "&" : "?"}app_name=${APP}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Audius ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchTrending(limit = 40): Promise<Track[]> {
  const host = await audiusHost();
  const json = await audiusJson<{ data?: AudiusTrack[] }>(`/v1/tracks/trending?limit=${limit}`);
  return (json.data ?? []).filter((t) => t.is_streamable !== false).map((t, i) => mapTrack(t, host, i));
}

export async function searchTracks(query: string, limit = 30): Promise<Track[]> {
  const host = await audiusHost();
  const json = await audiusJson<{ data?: AudiusTrack[] }>(
    `/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return (json.data ?? []).filter((t) => t.is_streamable !== false).map((t, i) => mapTrack(t, host, i));
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------
interface MusicCtx {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  track: Track | null;
  index: number;
  playing: boolean;
  buffering: boolean;
  /** real playback position in seconds */
  position: number;
  /** real media duration in seconds */
  duration: number;
  volume: number;
  liked: Record<string, boolean>;
  shuffle: boolean;
  repeat: boolean;
  playbackError: string | null;
  setQueue: (tracks: Track[], startIndex?: number) => void;
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
const LS_VOL = "ghost.music.volume";

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const tracksRef = useRef<Track[]>([]);
  tracksRef.current = tracks;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const track = index >= 0 ? tracks[index] ?? null : null;

  // --- persisted prefs -----------------------------------------------------
  useEffect(() => {
    try { setLiked(JSON.parse(window.localStorage.getItem(LS_LIKED) || "{}")); } catch { /* noop */ }
    const v = Number(window.localStorage.getItem(LS_VOL));
    if (Number.isFinite(v) && v >= 0 && v <= 100) setVolumeState(v);
  }, []);

  // --- catalogue -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTrending()
      .then((list) => {
        if (cancelled) return;
        if (!list.length) setError("No tracks returned by the music service.");
        setTracks(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Music service unreachable.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  // --- the single real audio element --------------------------------------
  const getAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== "undefined") {
      const el = new Audio();
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      el.volume = volume / 100;
      audioRef.current = el;
    }
    return audioRef.current;
  }, [volume]);

  const advance = useCallback((dir: 1 | -1) => {
    const list = tracksRef.current;
    if (!list.length) return;
    setIndex((i) => {
      if (dir === 1 && shuffleRef.current && list.length > 1) {
        let n = i;
        while (n === i) n = Math.floor(Math.random() * list.length);
        return n;
      }
      if (i < 0) return 0;
      return (i + dir + list.length) % list.length;
    });
    setPlaying(true);
  }, []);

  // Wire audio element events once.
  useEffect(() => {
    const el = getAudio();
    if (!el) return;
    const onTime = () => setPosition(el.currentTime);
    const onDur = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { setBuffering(false); setPlaying(true); setPlaybackError(null); };
    const onPause = () => setPlaying(false);
    const onErr = () => {
      setBuffering(false);
      setPlaying(false);
      setPlaybackError("This track could not be streamed.");
    };
    const onEnded = () => {
      if (repeatRef.current) { el.currentTime = 0; void el.play(); return; }
      advance(1);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", onDur);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("pause", onPause);
    el.addEventListener("error", onErr);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", onDur);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("error", onErr);
      el.removeEventListener("ended", onEnded);
    };
  }, [getAudio, advance]);

  // Load the selected track's real stream.
  useEffect(() => {
    const el = getAudio();
    if (!el) return;
    if (!track) { el.pause(); el.removeAttribute("src"); el.load(); return; }
    if (el.src !== track.streamUrl) {
      setPlaybackError(null);
      setBuffering(true);
      setPosition(0);
      setDuration(track.duration || 0);
      el.src = track.streamUrl;
      el.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, getAudio]);

  // Reflect the desired play/pause state onto the element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (playing) {
      void el.play().catch((e) => {
        setPlaying(false);
        setBuffering(false);
        setPlaybackError(
          e?.name === "NotAllowedError"
            ? "Playback needs a click first (browser autoplay policy)."
            : "This track could not be streamed.",
        );
      });
    } else {
      el.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, track?.id]);

  // Volume.
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.volume = Math.min(1, Math.max(0, volume / 100));
    try { window.localStorage.setItem(LS_VOL, String(volume)); } catch { /* noop */ }
  }, [volume]);

  // Media Session (system / OS-level controls).
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !track) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.cover ? [{ src: track.cover, sizes: "480x480", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => setPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => setPlaying(false));
    navigator.mediaSession.setActionHandler("previoustrack", () => advance(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => advance(1));
  }, [track, advance]);

  const playIndex = useCallback((i: number) => {
    setIndex(i);
    setPosition(0);
    setPlaying(true);
  }, []);

  const value = useMemo<MusicCtx>(() => ({
    tracks, loading, error,
    reload: () => setReloadKey((k) => k + 1),
    track, index, playing, buffering, position,
    duration: duration || track?.duration || 0,
    volume, liked, shuffle, repeat, playbackError,
    setQueue: (list, startIndex = 0) => {
      setTracks(list);
      tracksRef.current = list;
      if (list.length) playIndex(startIndex);
    },
    playIndex,
    playTrack: (id) => {
      const i = tracksRef.current.findIndex((t) => t.id === id);
      if (i >= 0) {
        if (i === index) setPlaying((p) => !p);
        else playIndex(i);
      }
    },
    toggle: () => setPlaying((p) => (track ? !p : p)),
    next: () => advance(1),
    prev: () => {
      const el = audioRef.current;
      if (el && el.currentTime > 4) { el.currentTime = 0; setPosition(0); return; }
      advance(-1);
    },
    seek: (sec) => {
      const el = audioRef.current;
      if (el && Number.isFinite(sec)) { el.currentTime = sec; setPosition(sec); }
    },
    setVolume: setVolumeState,
    toggleLike: (id) => setLiked((s) => {
      const nextState = { ...s, [id]: !s[id] };
      try { window.localStorage.setItem(LS_LIKED, JSON.stringify(nextState)); } catch { /* noop */ }
      return nextState;
    }),
    setShuffle, setRepeat,
    stop: () => {
      const el = audioRef.current;
      if (el) { el.pause(); el.removeAttribute("src"); el.load(); }
      setPlaying(false); setIndex(-1); setPosition(0); setDuration(0);
    },
  }), [tracks, loading, error, track, index, playing, buffering, position, duration, volume, liked, shuffle, repeat, playbackError, playIndex, advance]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMusic() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMusic outside MusicProvider");
  return v;
}
