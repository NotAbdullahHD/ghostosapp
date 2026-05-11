import { motion } from "framer-motion";
import { Play, Plus, Info } from "lucide-react";

const movies = [
  { title: "Spectral", genre: "Sci-Fi", color: "from-purple-700 to-indigo-950" },
  { title: "Midnight Code", genre: "Thriller", color: "from-red-700 to-black" },
  { title: "Neon Vows", genre: "Romance", color: "from-pink-600 to-rose-950" },
  { title: "Last Signal", genre: "Drama", color: "from-blue-700 to-slate-950" },
  { title: "Echo Protocol", genre: "Action", color: "from-orange-600 to-red-950" },
  { title: "Quiet Star", genre: "Indie", color: "from-teal-600 to-emerald-950" },
];

const rows = [
  { label: "Trending Now", items: movies },
  { label: "Continue Watching", items: [...movies].reverse() },
  { label: "Originals", items: movies },
];

export function MoviesApp() {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-black text-white">
      {/* Banner */}
      <div className="relative h-72">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-black to-purple-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,80,80,.4),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 max-w-lg">
          <span className="text-[10px] tracking-[0.3em] text-red-400 font-mono">GHOSTOS ORIGINAL</span>
          <h1 className="text-5xl font-black mt-2 leading-none">SPECTRAL</h1>
          <p className="text-sm text-white/70 mt-3">A renegade AI awakens in a forgotten datacenter, drawn to the last living signal on Earth.</p>
          <div className="flex items-center gap-2 mt-4">
            <motion.button whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-5 py-2 rounded bg-white text-black font-bold text-sm">
              <Play className="h-4 w-4 fill-black" /> Play
            </motion.button>
            <button className="flex items-center gap-2 px-4 py-2 rounded glass text-white text-sm">
              <Plus className="h-4 w-4" /> My List
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded glass text-white text-sm">
              <Info className="h-4 w-4" /> Info
            </button>
          </div>
        </div>
      </div>

      {rows.map((row, ri) => (
        <div key={ri} className="px-6 py-4">
          <h2 className="text-sm font-bold text-white/80 mb-3 tracking-wider">{row.label}</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {row.items.map((m, i) => (
              <motion.div key={i} whileHover={{ scale: 1.08, y: -4 }} transition={{ duration: 0.25 }}
                className="relative shrink-0 w-44 aspect-[2/3] rounded-lg overflow-hidden cursor-pointer ring-1 ring-white/10">
                <div className={`absolute inset-0 bg-gradient-to-br ${m.color}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <div className="text-xs font-bold">{m.title}</div>
                  <div className="text-[10px] text-white/50 font-mono">{m.genre}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
