import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useGhost } from "./store";
import { APPS } from "./apps";
import { AppIcon } from "./AppIcon";
import { Search, Power, Lock, ChevronRight } from "lucide-react";
import { GhostLogo } from "./GhostLogo";

const LS_RECENT = "ghost.recentApps.v1";

export function AppLauncher() {
  const { showLauncher, toggleLauncher, openApp, setLocked, installedApps } = useGhost();
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sel, setSel] = useState(0);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(LS_RECENT) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    if (!showLauncher) { setQ(""); setShowAll(false); setSel(0); }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showLauncher) toggleLauncher();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLauncher, toggleLauncher]);

  const launch = (id: string, name: string) => {
    setRecent((prev) => {
      const next = [id, ...prev.filter((r) => r !== id)].slice(0, 6);
      try { localStorage.setItem(LS_RECENT, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    openApp(id as never, name);
  };

  const searching = q.trim().length > 0;
  const filtered = useMemo(() => {
    const list = APPS
      .filter((a) => !a.installable || installedApps[a.id])
      .filter((a) => a.name.toLowerCase().includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase()));
    // Recently opened apps come first.
    const rank = (id: string) => {
      const i = recent.indexOf(id);
      return i === -1 ? 999 : i;
    };
    return [...list].sort((a, b) => rank(a.id) - rank(b.id));
  }, [q, installedApps, recent]);
  const pinned = showAll || searching ? filtered : filtered.slice(0, 12);
  const recentApps = recent.map((id) => APPS.find((a) => a.id === id)).filter(Boolean).slice(0, 4) as typeof APPS;

  useEffect(() => { setSel(0); }, [q, showAll]);

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    const n = pinned.length;
    if (!n) return;
    if (e.key === "ArrowRight") { e.preventDefault(); setSel((s) => (s + 1) % n); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setSel((s) => (s - 1 + n) % n); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(n - 1, s + 6)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 6)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const app = pinned[Math.min(sel, n - 1)];
      if (app) { launch(app.id, app.name); toggleLauncher(); }
    }
  };


  return (
    <AnimatePresence>
      {showLauncher && (
        <motion.div
          key="launcher-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[800] flex items-end justify-center pb-24"
          style={{ background: "rgba(6,6,8,.45)", backdropFilter: "blur(2px)" }}
          onClick={toggleLauncher}
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-[660px] rounded-[20px] overflow-hidden"
          >
            {/* Search */}
            <div className="p-5 pb-3">
              <div className="flex items-center gap-2.5 rounded-full px-4 h-11 bg-white/[0.045] border border-white/10 focus-within:border-[#66d9ff]/50 transition-colors">
                <Search className="h-4 w-4 text-white/40" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onSearchKeyDown}
                  placeholder="Search apps and settings"
                  className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/35"
                />
              </div>
            </div>

            {/* Pinned */}
            <div className="px-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-medium text-white/70">{searching ? "Results" : "Pinned"}</span>
                {!searching && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="flex items-center gap-1 text-[11px] text-white/55 hover:text-white px-2.5 py-1 rounded-md hover:bg-white/[0.06] transition"
                  >
                    {showAll ? "Less" : "All apps"} <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1 pb-2 max-h-[290px] overflow-y-auto scrollbar-hide">
                {pinned.map((app, i) => (
                  <motion.button
                    key={app.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.018, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => launch(app.id, app.name)}
                    className="group flex flex-col items-center gap-2 px-1 py-3 rounded-xl hover:bg-white/[0.06] transition"
                  >
                    <AppIcon id={app.id} size={46} />
                    <span className="text-[11px] text-white/80 text-center leading-tight truncate w-full px-0.5">{app.name}</span>
                  </motion.button>
                ))}
                {!pinned.length && (
                  <div className="col-span-6 text-center py-10 text-white/40 text-sm">No results for “{q}”</div>
                )}
              </div>
            </div>

            {/* Recent */}
            {!searching && recentApps.length > 0 && (
              <div className="px-6 pt-2 pb-4">
                <div className="text-[12px] font-medium text-white/70 mb-2">Recent</div>
                <div className="grid grid-cols-2 gap-1">
                  {recentApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => launch(app.id, app.name)}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.06] transition text-left"
                    >
                      <AppIcon id={app.id} size={30} />
                      <div className="min-w-0">
                        <div className="text-[12.5px] text-white/85 truncate">{app.name}</div>
                        <div className="text-[10.5px] text-white/40 truncate">{app.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: profile + power */}
            <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-t border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full grid place-items-center bg-white/[0.06] border border-white/10">
                  <GhostLogo size={18} glow={false} />
                </span>
                <span className="text-[13px] text-white/80">Ghost User</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { toggleLauncher(); setLocked(true); }}
                  title="Lock"
                  className="h-8 w-8 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition"
                >
                  <Lock className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { toggleLauncher(); setLocked(true); }}
                  title="Power"
                  className="h-8 w-8 grid place-items-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.08] transition"
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
