import { motion } from "framer-motion";
import { Download, Star, Sparkles } from "lucide-react";

const featured = [
  { n: "Phantom Pro",       cat: "Productivity", c: "from-fuchsia-600 to-purple-900", price: "Free" },
  { n: "Spectre VPN",       cat: "Network",      c: "from-cyan-500 to-blue-900",       price: "Free" },
  { n: "Hex Editor X",      cat: "Developer",    c: "from-emerald-500 to-teal-900",    price: "$4.99" },
  { n: "Lumen Studio",      cat: "Design",       c: "from-rose-500 to-pink-900",       price: "$12.00" },
  { n: "VoidNotes",         cat: "Notes",        c: "from-amber-500 to-orange-900",    price: "Free" },
  { n: "Orbit Mail",        cat: "Mail",         c: "from-indigo-500 to-violet-900",   price: "Free" },
  { n: "PulseDeck",         cat: "Audio",        c: "from-lime-400 to-emerald-900",    price: "$8.00" },
  { n: "Atlas Maps",        cat: "Travel",       c: "from-sky-500 to-blue-900",        price: "Free" },
  { n: "Reaper IDE",        cat: "Developer",    c: "from-slate-400 to-slate-800",     price: "$24.00" },
];

export function StoreApp() {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-gradient-to-br from-black via-amber-950/10 to-black text-white">
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-700 via-orange-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,80,.4),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6">
          <span className="text-[10px] tracking-[0.3em] text-amber-300 font-mono mb-2">BAZAAR · APP OF THE WEEK</span>
          <h2 className="text-4xl font-bold neon-text">PHANTOM PRO</h2>
          <p className="text-sm text-white/70 mt-1 max-w-md">The all-in-one workspace for ghosts who ship. Now with neural sync.</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="mt-3 self-start flex items-center gap-2 px-4 py-2 rounded-full gradient-neon text-white font-bold text-sm shadow-lg shadow-amber-500/30">
            <Download className="h-4 w-4" /> Get
          </motion.button>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-white/60">
          <Sparkles className="h-3 w-3 text-amber-300" /> CURATED FOR YOU
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {featured.map((a, i) => (
            <motion.div key={a.n} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4 }} className="glass rounded-xl p-3 flex items-center gap-3 ring-1 ring-white/5">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${a.c} ring-1 ring-white/15 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{a.n}</div>
                <div className="text-[10px] text-white/50 font-mono">{a.cat}</div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300">
                  <Star className="h-2.5 w-2.5 fill-amber-300" /> 4.{(i % 9) + 1} · {a.price}
                </div>
              </div>
              <button className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">GET</button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
