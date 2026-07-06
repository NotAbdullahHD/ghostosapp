import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { useGhost, type Notification, type NotifApp } from "./store";
import {
  X, MessageCircle, Radio, Film, Gamepad2, Settings as SettingsIcon,
  Download, Bell,
} from "lucide-react";

const APP_META: Record<NotifApp, { label: string; icon: React.ReactNode; tint: string }> = {
  system:    { label: "GhostOS",    icon: <Bell className="h-3.5 w-3.5" />,           tint: "from-fuchsia-500 to-violet-600" },
  chat:      { label: "GhostChat",  icon: <MessageCircle className="h-3.5 w-3.5" />,  tint: "from-cyan-400 to-blue-600" },
  ghostdrop: { label: "GhostDrop",  icon: <Radio className="h-3.5 w-3.5" />,          tint: "from-fuchsia-400 to-pink-600" },
  movies:    { label: "GhostFlix",  icon: <Film className="h-3.5 w-3.5" />,           tint: "from-rose-500 to-red-700" },
  games:     { label: "Games Hub",  icon: <Gamepad2 className="h-3.5 w-3.5" />,       tint: "from-emerald-500 to-teal-700" },
  downloads: { label: "Downloads",  icon: <Download className="h-3.5 w-3.5" />,       tint: "from-amber-400 to-orange-600" },
  settings:  { label: "Settings",   icon: <SettingsIcon className="h-3.5 w-3.5" />,   tint: "from-zinc-400 to-zinc-600" },
};

function timeAgo(t: number) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationCenter() {
  const { showNotifCenter, notifications, dismissNotification, toggleNotifCenter,
          clearAllNotifications, markAllNotificationsRead } = useGhost();

  const grouped = useMemo(() => {
    const map = new Map<NotifApp, Notification[]>();
    for (const n of notifications) {
      const app = (n.app || "system") as NotifApp;
      if (!map.has(app)) map.set(app, []);
      map.get(app)!.push(n);
    }
    return Array.from(map.entries());
  }, [notifications]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {showNotifCenter && (
        <>
          <motion.div className="fixed inset-0 z-[780]" onClick={toggleNotifCenter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            role="dialog" aria-label="Notification Center"
            className="fixed right-3 top-11 w-[360px] z-[800] rounded-3xl p-3 window-shadow"
            style={{
              background: "linear-gradient(155deg, rgba(30,15,45,0.85), rgba(10,5,20,0.75))",
              backdropFilter: "blur(40px) saturate(180%)",
              WebkitBackdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(168,85,247,.15), inset 0 1px 0 rgba(255,255,255,.08)",
            }}
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="flex items-center justify-between px-2 py-2">
              <div>
                <div className="text-sm font-bold text-white">Notifications</div>
                <div className="text-[10px] font-mono tracking-widest text-white/40">
                  {unread > 0 ? `${unread} UNREAD · ${notifications.length} TOTAL` : `${notifications.length} TOTAL`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button onClick={markAllNotificationsRead}
                      className="text-[10px] font-mono tracking-widest text-white/50 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition">
                      READ
                    </button>
                    <button onClick={clearAllNotifications}
                      className="text-[10px] font-mono tracking-widest text-fuchsia-300 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition">
                      CLEAR
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto scrollbar-hide space-y-3 pr-1">
              {notifications.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-white/40" />
                  </div>
                  <div className="text-sm text-white/60">All caught up.</div>
                  <div className="text-[10px] font-mono tracking-widest text-white/30 mt-1">NO NEW ALERTS</div>
                </div>
              )}

              {grouped.map(([app, items]) => {
                const meta = APP_META[app] || APP_META.system;
                return (
                  <div key={app}>
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-white/60">
                        {meta.icon}<span>{meta.label.toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/30">{items.length}</span>
                    </div>
                    <div className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {items.map((n) => (
                          <motion.div key={n.id} layout
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", stiffness: 320, damping: 30 }}
                            className="rounded-2xl p-3 group relative"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          >
                            <button onClick={() => dismissNotification(n.id)}
                              className="absolute top-2 right-2 h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/10 flex items-center justify-center transition">
                              <X className="h-3 w-3 text-white/60" />
                            </button>
                            <div className="flex items-start gap-2.5">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${meta.tint} shadow-md shadow-black/50 flex-shrink-0`}>
                                {meta.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="text-xs font-bold text-white truncate flex-1">{n.title}</div>
                                  {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,.9)] flex-shrink-0" />}
                                  <span className="text-[10px] font-mono text-white/40 flex-shrink-0">{timeAgo(n.time)}</span>
                                </div>
                                <div className="text-xs text-white/70 mt-0.5 leading-snug">{n.body}</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
