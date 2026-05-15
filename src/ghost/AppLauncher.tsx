import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useGhost } from "./store";
import { APPS } from "./apps";
import { Search, X } from "lucide-react";

export function AppLauncher() {
  const { showLauncher, toggleLauncher, openApp } = useGhost();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!showLauncher) setQ("");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLauncher) toggleLauncher();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLauncher, toggleLauncher]);

  const filtered = APPS.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase()));

  return (
    <AnimatePresence>
      {showLauncher && (
        <motion.div
          key="launcher"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(28px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[800] flex flex-col items-center pt-24 px-6"
          style={{ background: "rgba(5,3,12,.55)" }}
          onClick={toggleLauncher}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
            className="flex items-center gap-3 w-full max-w-xl rounded-2xl px-4 py-3 ring-1 ring-fuchsia-400/30 bg-black/60 backdrop-blur-xl shadow-[0_0_40px_rgba(232,121,249,.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="h-4 w-4 text-fuchsia-300" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search apps · ghost protocols · tools…"
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 font-mono text-sm" />
            <button onClick={toggleLauncher} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="mt-10 w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4">
              {filtered.map((app, i) => (
                <motion.button
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => openApp(app.id, app.name)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition"
                >
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${app.accent} flex items-center justify-center text-white text-3xl shadow-xl shadow-black/60 ring-1 ring-white/15 group-hover:ring-fuchsia-400/40 transition`}>
                    <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,.6)]">{app.icon}</span>
                  </div>
                  <div className="text-[11px] font-mono tracking-wider text-white/85 text-center leading-tight">{app.name}</div>
                  <div className="text-[9px] font-mono tracking-widest text-white/35 text-center">{app.description}</div>
                </motion.button>
              ))}
              {!filtered.length && (
                <div className="col-span-full text-center py-12 text-white/40 font-mono text-sm">No protocols match "{q}"</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
