import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Activity, X, Wifi, WifiOff, Monitor } from "lucide-react";

// Real local-presence counter using BroadcastChannel: counts how many GhostOS
// tabs/windows are currently open in this browser. Falls back to 1.
const CH_NAME = "ghostos.presence.v1";

export function OnlineStatus() {
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string>(Math.random().toString(36).slice(2));
  const peersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel(CH_NAME); } catch { bc = null; }
    const myId = idRef.current;
    const peers = peersRef.current;
    peers.set(myId, Date.now());

    const recompute = () => {
      const now = Date.now();
      // expire peers older than 8s
      for (const [k, v] of peers) if (now - v > 8000) peers.delete(k);
      setCount(peers.size || 1);
    };

    const announce = () => {
      bc?.postMessage({ t: "ping", id: myId });
      peers.set(myId, Date.now());
      recompute();
    };

    if (bc) {
      bc.onmessage = (ev) => {
        const { t, id } = ev.data || {};
        if (!id || id === myId) return;
        peers.set(id, Date.now());
        if (t === "ping") bc?.postMessage({ t: "pong", id: myId });
        recompute();
      };
    }
    announce();
    const interval = setInterval(announce, 3000);
    const sweep = setInterval(recompute, 2000);

    const goingOff = () => { bc?.postMessage({ t: "bye", id: myId }); };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("beforeunload", goingOff);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearInterval(interval); clearInterval(sweep);
      window.removeEventListener("beforeunload", goingOff);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      bc?.postMessage({ t: "bye", id: myId });
      bc?.close();
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const dotColor = online ? "bg-emerald-400" : "bg-rose-500";
  const ringColor = online ? "ring-emerald-400/25" : "ring-rose-400/25";

  return (
    <div ref={ref} className="fixed top-12 right-3 z-[450]">
      <motion.button
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        whileHover={{ y: -2 }}
        onClick={() => setOpen((s) => !s)}
        className={`glass-strong rounded-full pl-2.5 pr-3 py-1.5 ring-1 ${ringColor} flex items-center gap-2 shadow-[0_0_18px_rgba(16,185,129,.12)] transition`}
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(10,20,15,.55))" }}
      >
        <span className="relative flex h-2 w-2">
          {online && <span className={`absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-70 animate-ping`} />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotColor} shadow-[0_0_8px_rgba(74,222,128,.9)]`} />
        </span>
        <span className="font-mono text-xs text-white tracking-wider">{count}</span>
        <span className={`text-[9px] font-mono tracking-[0.3em] ${online ? "text-emerald-300/80" : "text-rose-300/80"}`}>
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-72 glass-strong rounded-2xl ring-1 ring-emerald-400/20 p-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)]"
            style={{ background: "linear-gradient(180deg, rgba(20,25,30,.85), rgba(8,10,15,.85))" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-[0.4em] font-mono text-emerald-300/80">LOCAL PRESENCE</div>
                <div className="text-2xl font-black text-white">{count}<span className="text-[10px] font-mono text-white/40 tracking-widest ml-1">{count === 1 ? "SESSION" : "SESSIONS"}</span></div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white"><X className="h-3.5 w-3.5" /></button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <Row icon={online ? <Wifi className="h-3 w-3 text-emerald-300" /> : <WifiOff className="h-3 w-3 text-rose-400" />}
                label="Network" value={online ? "Connected" : "Offline"} accent={online ? "text-emerald-200" : "text-rose-300"} />
              <Row icon={<Monitor className="h-3 w-3 text-violet-300" />} label="This device" value={navigator.platform || "Unknown"} accent="text-violet-200" />
              <Row icon={<Users className="h-3 w-3 text-fuchsia-300" />} label="GhostOS tabs" value={`${count}`} accent="text-fuchsia-200" />
              <div className="h-px bg-white/5 my-2" />
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-300 font-mono">
                  <Activity className="h-3 w-3" /> LIVE · LOCAL BROADCAST
                </div>
              </div>
              <div className="text-[9px] text-white/35 font-mono">Open GhostOS in another tab to see live presence sync.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/65">{icon}{label}</div>
      <span className={`font-mono ${accent}`}>{value}</span>
    </div>
  );
}
