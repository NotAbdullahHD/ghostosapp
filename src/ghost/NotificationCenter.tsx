import { motion, AnimatePresence } from "framer-motion";
import { useGhost } from "./store";
import { X } from "lucide-react";

export function NotificationCenter() {
  const { showNotifCenter, notifications, dismissNotification, toggleNotifCenter } = useGhost();
  return (
    <AnimatePresence>
      {showNotifCenter && (
        <>
          <motion.div className="fixed inset-0 z-[700]" onClick={toggleNotifCenter}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="fixed right-3 top-12 w-80 z-[750] glass-strong rounded-2xl p-3 window-shadow"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-mono tracking-widest text-white/60">NOTIFICATIONS</span>
              <span className="text-[10px] text-white/40">{notifications.length}</span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
              {notifications.length === 0 && (
                <div className="text-center text-xs text-white/40 py-8 font-mono">All quiet.</div>
              )}
              {notifications.map((n) => (
                <motion.div key={n.id} layout
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }}
                  className="glass rounded-xl p-3 group relative"
                >
                  <button onClick={() => dismissNotification(n.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3 w-3 text-white/60" />
                  </button>
                  <div className="text-xs font-bold text-fuchsia-200">{n.title}</div>
                  <div className="text-xs text-white/70 mt-1">{n.body}</div>
                  <div className="text-[10px] text-white/30 mt-1 font-mono">{new Date(n.time).toLocaleTimeString()}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
