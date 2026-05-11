import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Heart, Shuffle, Repeat, Volume2 } from "lucide-react";
import { useState } from "react";

const tracks = [
  { t: "Spectral Dawn",   a: "VOID//KIN",      d: "3:42", c: "from-fuchsia-600 to-violet-900" },
  { t: "Neon Veins",      a: "Kuroshio",       d: "4:11", c: "from-cyan-500 to-blue-900" },
  { t: "Hollow Circuit",  a: "Ghost Atlas",    d: "5:02", c: "from-emerald-500 to-teal-900" },
  { t: "Midnight Matrix", a: "Static Empress", d: "3:28", c: "from-rose-500 to-fuchsia-900" },
  { t: "Echo Garden",     a: "Pale Signal",    d: "6:14", c: "from-amber-500 to-orange-900" },
  { t: "Pulse 808",       a: "DJ Specter",     d: "2:55", c: "from-indigo-500 to-purple-900" },
];

export function MusicApp() {
  const [playing, setPlaying] = useState(true);
  const [active, setActive] = useState(0);
  const cur = tracks[active];
  return (
    <div className="h-full flex bg-gradient-to-br from-black via-emerald-950/20 to-black text-white">
      {/* Sidebar */}
      <div className="w-52 border-r border-white/5 p-4 flex flex-col gap-1 text-xs">
        <div className="text-[10px] tracking-[0.4em] text-emerald-300/70 font-mono mb-3">PULSE</div>
        {["Home", "Discover", "Library", "Radio", "Liked", "Playlists"].map((s, i) => (
          <button key={s} className={`text-left px-3 py-2 rounded-lg transition ${i === 0 ? "bg-white/8 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>{s}</button>
        ))}
        <div className="mt-6 text-[10px] tracking-widest text-white/40 font-mono">YOUR PLAYLISTS</div>
        {["Late Night Drive", "Cyber Lo-Fi", "Neon Workouts", "Study Ghosts"].map((p) => (
          <button key={p} className="text-left px-3 py-1.5 text-white/50 hover:text-white truncate">{p}</button>
        ))}
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <div className="text-[10px] tracking-[0.4em] text-emerald-300/70 font-mono">FEATURED · NEW THIS WEEK</div>
          <h1 className="text-3xl font-bold mt-1">Tonight's Frequency</h1>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
            {tracks.map((t, i) => (
              <motion.button key={t.t} whileHover={{ y: -4, scale: 1.02 }} onClick={() => { setActive(i); setPlaying(true); }}
                className="text-left rounded-xl overflow-hidden ring-1 ring-white/10 group">
                <div className={`aspect-square bg-gradient-to-br ${t.c} relative`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                    <div className="h-12 w-12 rounded-full bg-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                      <Play className="h-5 w-5 fill-black text-black" />
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-black/40">
                  <div className="text-sm font-bold truncate">{t.t}</div>
                  <div className="text-[11px] text-white/50 font-mono truncate">{t.a}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        {/* Player */}
        <div className="border-t border-white/5 bg-black/60 backdrop-blur p-3 flex items-center gap-4">
          <div className={`h-12 w-12 rounded-md bg-gradient-to-br ${cur.c} ring-1 ring-white/15`} />
          <div className="min-w-0 w-44">
            <div className="text-xs font-bold truncate">{cur.t}</div>
            <div className="text-[10px] text-white/50 font-mono truncate">{cur.a}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 text-white/70">
              <Shuffle className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
              <SkipBack className="h-4 w-4 hover:text-white cursor-pointer" />
              <button onClick={() => setPlaying((p) => !p)} className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition">
                {playing ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black" />}
              </button>
              <SkipForward className="h-4 w-4 hover:text-white cursor-pointer" />
              <Repeat className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
            </div>
            <div className="w-full max-w-md flex items-center gap-2 text-[10px] font-mono text-white/40">
              <span>1:24</span>
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div animate={{ width: playing ? ["33%", "100%"] : "33%" }} transition={{ duration: 180, ease: "linear", repeat: playing ? Infinity : 0 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
              </div>
              <span>{cur.d}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/60">
            <Heart className="h-4 w-4 hover:text-rose-400 cursor-pointer" />
            <Volume2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
