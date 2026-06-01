import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, Users, Edit2, Check } from "lucide-react";

const CH = "ghostos.globalchat.v1";
const LS_PROFILE = "ghost.chat.profile";
const PRESENCE_CH = "ghostos.chat.presence.v1";

const AVATARS = [
  "from-fuchsia-500 to-violet-700",
  "from-cyan-400 to-blue-700",
  "from-rose-500 to-pink-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-indigo-500 to-purple-700",
];

interface Profile { name: string; color: string; id: string; }
interface Msg { id: string; from: string; color: string; uid: string; t: string; ts: number; }

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { name: `Ghost${Math.floor(Math.random() * 9999)}`, color: AVATARS[Math.floor(Math.random() * AVATARS.length)], id: Math.random().toString(36).slice(2) };
}

export function ChatApp() {
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [thread, setThread] = useState<Msg[]>([
    { id: "sys", from: "GhostOS", color: "from-violet-500 to-fuchsia-700", uid: "sys", t: "Welcome to Global Chat. Sessions across tabs sync live.", ts: Date.now() - 5000 },
  ]);
  const [msg, setMsg] = useState("");
  const [presence, setPresence] = useState(1);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const presenceRef = useRef<Map<string, number>>(new Map());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(LS_PROFILE, JSON.stringify(profile)); }, [profile]);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    let pc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel(CH); pc = new BroadcastChannel(PRESENCE_CH); } catch { /* unsupported */ }
    bcRef.current = bc;
    const peers = presenceRef.current;
    peers.set(profile.id, Date.now());

    if (bc) bc.onmessage = (ev) => {
      const m = ev.data as Msg;
      if (!m || !m.id) return;
      setThread((th) => (th.some((x) => x.id === m.id) ? th : [...th, m].slice(-200)));
    };
    if (pc) pc.onmessage = (ev) => {
      const { id } = ev.data || {};
      if (!id) return;
      peers.set(id, Date.now());
      compute();
    };

    const compute = () => {
      const now = Date.now();
      for (const [k, v] of peers) if (now - v > 8000) peers.delete(k);
      setPresence(peers.size || 1);
    };

    const ping = () => { pc?.postMessage({ id: profile.id }); peers.set(profile.id, Date.now()); compute(); };
    ping();
    const i1 = setInterval(ping, 3000);
    const i2 = setInterval(compute, 2000);
    return () => { clearInterval(i1); clearInterval(i2); bc?.close(); pc?.close(); };
  }, [profile.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    const m: Msg = { id: Math.random().toString(36).slice(2), from: profile.name, color: profile.color, uid: profile.id, t: text, ts: Date.now() };
    setThread((th) => [...th, m].slice(-200));
    bcRef.current?.postMessage(m);
    setMsg("");
  };

  const saveName = () => {
    const next = name.trim().slice(0, 24) || profile.name;
    setProfile((p) => ({ ...p, name: next }));
    setEditing(false);
  };

  return (
    <div className="h-full flex bg-gradient-to-br from-black via-sky-950/20 to-black text-white">
      {/* Profile sidebar */}
      <div className="w-60 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="text-[9px] tracking-[0.4em] font-mono text-fuchsia-300/70">YOUR PROFILE</div>
          <div className="mt-3 flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${profile.color} ring-1 ring-white/15 flex items-center justify-center text-lg font-black`}>
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-1">
                  <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="flex-1 min-w-0 bg-white/5 outline-none text-sm rounded px-2 py-1 border border-fuchsia-400/40" maxLength={24} />
                  <button onClick={saveName} className="p-1 rounded bg-fuchsia-500 hover:bg-fuchsia-400"><Check className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold truncate">{profile.name}</div>
                  <button onClick={() => { setName(profile.name); setEditing(true); }} className="text-white/40 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                </div>
              )}
              <div className="text-[10px] text-emerald-400 font-mono">● online</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[9px] tracking-[0.3em] text-white/40 font-mono mb-1.5">AVATAR COLOR</div>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map((c) => (
                <button key={c} onClick={() => setProfile((p) => ({ ...p, color: c }))}
                  className={`h-6 w-6 rounded-full bg-gradient-to-br ${c} ring-1 ${c === profile.color ? "ring-fuchsia-300 ring-2" : "ring-white/15"} transition`} />
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="flex items-center gap-2 text-[11px] text-white/70 font-mono">
            <Users className="h-3 w-3 text-emerald-400" /> {presence} live
          </div>
          <div className="mt-2 text-[10px] text-white/40 leading-relaxed">
            Global chat broadcasts across your open GhostOS tabs in real time. Open in another tab to test.
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-white/5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-700 ring-1 ring-white/15 flex items-center justify-center text-sm font-black">#</div>
          <div className="flex-1">
            <div className="text-sm font-bold">GhostOS · Global Chat</div>
            <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> local broadcast · ephemeral</div>
          </div>
          <div className="text-[10px] font-mono text-white/40">{presence} online</div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {thread.map((m) => {
              const me = m.uid === profile.id;
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${me ? "self-end flex-row-reverse" : "self-start"} max-w-[75%]`}>
                  <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${m.color} ring-1 ring-white/15 flex items-center justify-center text-[10px] font-black shrink-0`}>
                    {m.from.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={`px-3 py-2 rounded-2xl text-sm ${me
                      ? "bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white rounded-br-md"
                      : "glass text-white/90 rounded-bl-md"}`}>
                    {!me && <div className="text-[10px] font-mono opacity-70 mb-0.5">{m.from}</div>}
                    {m.t}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-white/5 flex items-center gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message as ${profile.name}…`}
            className="flex-1 px-4 py-2 rounded-full bg-white/5 outline-none text-sm border border-white/5 focus:border-fuchsia-400/40" />
          <button onClick={send} className="h-9 w-9 rounded-full gradient-neon flex items-center justify-center hover:scale-105 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
