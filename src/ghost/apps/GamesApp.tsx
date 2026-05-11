import { motion } from "framer-motion";
import { Play, Star, Flame, Trophy, Gamepad2 } from "lucide-react";

const featured = {
  title: "NEON DRIFT 2099",
  tagline: "Race through the chrome veins of Neo-Tokyo.",
  rating: 4.9,
};

const games = [
  { name: "Cyber Reign", cat: "RPG", color: "from-fuchsia-600 to-purple-900", players: "2.1M" },
  { name: "Void Runner", cat: "Action", color: "from-cyan-500 to-blue-900", players: "892K" },
  { name: "Ghost Protocol", cat: "Stealth", color: "from-emerald-500 to-teal-900", players: "1.4M" },
  { name: "Quantum Strike", cat: "Shooter", color: "from-rose-500 to-red-900", players: "3.2M" },
  { name: "Stellar Forge", cat: "Sandbox", color: "from-amber-500 to-orange-900", players: "624K" },
  { name: "Hex Tactics", cat: "Strategy", color: "from-indigo-500 to-violet-900", players: "412K" },
];

const cats = ["All", "Action", "RPG", "Strategy", "Shooter", "Sandbox", "Stealth"];

export function GamesApp() {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-gradient-to-br from-black via-purple-950/30 to-black text-white">
      {/* Featured */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-700 via-purple-900 to-black" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,.5), transparent 50%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6">
          <span className="text-[10px] tracking-[0.3em] text-fuchsia-300 font-mono mb-2">FEATURED · EDITORS CHOICE</span>
          <h2 className="text-4xl font-bold neon-text">{featured.title}</h2>
          <p className="text-sm text-white/70 mt-1 max-w-md">{featured.tagline}</p>
          <div className="flex items-center gap-3 mt-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-2 rounded-full gradient-neon text-white font-bold text-sm shadow-lg shadow-fuchsia-500/40">
              <Play className="h-4 w-4 fill-current" /> Play Now
            </motion.button>
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {featured.rating}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {cats.map((c, i) => (
            <button key={c} className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition ${i === 0 ? "gradient-neon text-white" : "glass text-white/60 hover:text-white"}`}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-white/60">
          <Flame className="h-3 w-3 text-orange-400" /> TRENDING
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {games.map((g, i) => (
            <motion.div key={g.name}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.04, y: -4 }}
              className="relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer group ring-1 ring-white/10"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`} />
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
              <Gamepad2 className="absolute top-3 right-3 h-4 w-4 text-white/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="text-[10px] text-fuchsia-300 font-mono">{g.cat.toUpperCase()}</div>
                <div className="text-sm font-bold">{g.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-white/50 font-mono">{g.players} online</span>
                  <Trophy className="h-3 w-3 text-amber-300/70" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                <div className="h-12 w-12 rounded-full gradient-neon flex items-center justify-center shadow-xl">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
