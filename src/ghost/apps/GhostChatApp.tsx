import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import {
  Search, Send, Phone, Video, Info, ChevronLeft, Plus, UserPlus, Check, CheckCheck, X,
  Sparkles, Settings as SettingsIcon, Eye, EyeOff, Copy, RefreshCw, ShieldAlert,
  LogOut, Trash2, MessageCircle, PhoneOff, Smile,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGhost } from "@/ghost/store";
import { CallOverlay } from "@/ghost/CallOverlay";

// ============ Types ============
interface Profile {
  id: string;
  ghost_id: string;
  username: string | null;
  display_name: string;
  avatar_emoji: string;
  avatar_gradient: string;
}
interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
}
interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  reaction: string | null;
  created_at: string;
  read_at: string | null;
}
interface IncomingCall {
  callId: string;
  fromId: string;
  video: boolean;
}
interface ActiveCall extends IncomingCall {
  withId: string;
  direction: "outgoing" | "incoming";
}

// ============ Constants ============
const GRADIENTS = [
  "from-emerald-500 to-emerald-700",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-emerald-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-indigo-500 to-emerald-700",
  "from-red-500 to-rose-700",
  "from-sky-400 to-blue-700",
];
const EMOJIS = ["👻", "🌙", "⚡", "✨", "🔮", "🌌", "🪐", "🌠", "🎭", "🖤", "🦇", "🗝️"];
const REACTIONS = ["❤️", "👍", "👎", "😂", "‼️", "❓"];

function newGhostId() {
  return `GH-${Math.floor(100000 + Math.random() * 900000)}`;
}
function newRecoveryCode() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) => Array.from({ length: n }, () => A[Math.floor(Math.random() * A.length)]).join("");
  return `GS-${seg(4)}-${seg(4)}-${seg(4)}`;
}
function usernameToEmail(u: string) {
  return `${u.trim().toLowerCase()}@ghost.local`;
}
const RECOVERY_LS = (uid: string) => `ghostchat.recovery.${uid}`;
function storeRecovery(uid: string, code: string) {
  try { localStorage.setItem(RECOVERY_LS(uid), code); } catch { /* ignore */ }
}
function loadRecovery(uid: string): string | null {
  try { return localStorage.getItem(RECOVERY_LS(uid)); } catch { return null; }
}
function fmtTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function fmtDay(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today ${fmtTime(ts)}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + " " + fmtTime(ts);
}

// ============ Root ============
export function GhostChatApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setProfile((data as Profile | null) ?? null));
  }, [session]);

  if (checking) {
    return <div className="h-full flex items-center justify-center bg-gradient-to-br from-black to-emerald-950/30 text-white/50 text-xs font-mono">Loading GhostChat…</div>;
  }
  if (!session) return <AuthShell />;
  if (!profile) return <div className="h-full flex items-center justify-center bg-black text-white/40 text-xs font-mono">Preparing account…</div>;
  return <Messenger me={profile} />;
}

// ============ Auth Shell (Login vs Create) ============
function AuthShell() {
  const [mode, setMode] = useState<"login" | "create">("login");
  return mode === "create"
    ? <Onboarding onSwitchToLogin={() => setMode("login")} />
    : <LoginScreen onSwitchToCreate={() => setMode("create")} />;
}

function LoginScreen({ onSwitchToCreate }: { onSwitchToCreate: () => void }) {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [reveal, setReveal] = useState(false);

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const u = username.trim().toLowerCase();
      const c = code.trim().toUpperCase();
      if (!u) throw new Error("Enter your username");
      if (!c) throw new Error("Enter your recovery code");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(u), password: c,
      });
      if (error) throw new Error("Username or recovery code is incorrect");
      if (data.user) storeRecovery(data.user.id, c);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-black via-emerald-950/40 to-black text-white p-8 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-[26px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center text-4xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.35)] ring-1 ring-white/10">
            👻
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">GhostChat</h1>
          <p className="text-white/50 text-sm">Sign in to your Ghost identity</p>
        </div>

        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1.5">USERNAME</div>
            <input autoFocus value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 24))}
              placeholder="ghost_user"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/50 text-sm font-mono" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1.5">RECOVERY CODE</div>
            <div className="relative">
              <input type={reveal ? "text" : "password"} value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 32))}
                placeholder="GS-XXXX-XXXX-XXXX"
                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/50 text-sm font-mono tracking-wider" />
              <button type="button" onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50">
                {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {err && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</div>}
          <button onClick={submit} disabled={busy || !username || !code}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm disabled:opacity-40 transition">
            {busy ? "Signing in…" : "Sign In"}
          </button>
          <button onClick={onSwitchToCreate}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/80 transition">
            Create new Ghost account
          </button>
          <div className="text-[10px] text-white/40 text-center leading-relaxed pt-1">
            No email required. Your recovery code is the only way to sign in on another device — keep it safe.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============ Onboarding ============
function Onboarding({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [usernameErr, setUsernameErr] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [ghostId, setGhostId] = useState(newGhostId());
  const [recovery, setRecovery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);
  const totalSteps = 6;

  const validateUsername = async () => {
    setUsernameErr("");
    const u = username.trim().toLowerCase();
    if (u.length < 3) return setUsernameErr("At least 3 characters"), false;
    if (!/^[a-z0-9_.-]+$/.test(u)) return setUsernameErr("Letters, numbers, . _ - only"), false;
    const { data } = await supabase.from("profiles").select("id").ilike("username", u).maybeSingle();
    if (data) return setUsernameErr("That username is taken"), false;
    return true;
  };

  const createAccount = async () => {
    setBusy(true); setErr("");
    try {
      const u = username.trim().toLowerCase();
      const code = newRecoveryCode();
      let gid = ghostId;

      const { data: signUp, error: suErr } = await supabase.auth.signUp({
        email: usernameToEmail(u), password: code,
      });
      if (suErr) throw suErr;
      let userId = signUp.user?.id;

      // If email confirmation is disabled we get a session; otherwise sign in explicitly.
      if (!signUp.session) {
        const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
          email: usernameToEmail(u), password: code,
        });
        if (siErr) throw siErr;
        userId = si.user?.id;
      }
      if (!userId) throw new Error("Could not create account");

      // Insert profile with a few retries to avoid ghost_id collision.
      let inserted = false;
      for (let i = 0; i < 5; i++) {
        const { error } = await supabase.from("profiles").insert({
          id: userId, ghost_id: gid, username: u,
          display_name: name.trim(), avatar_emoji: emoji, avatar_gradient: gradient,
        });
        if (!error) { inserted = true; break; }
        if (error.code === "23505" && error.message.toLowerCase().includes("ghost")) {
          gid = newGhostId(); continue;
        }
        throw error;
      }
      if (!inserted) throw new Error("Could not reserve a Ghost ID");

      storeRecovery(userId, code);
      setGhostId(gid);
      setRecovery(code);
      setStep(5);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };

  const copyCode = async () => {
    if (!recovery) return;
    try { await navigator.clipboard.writeText(recovery); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-black via-emerald-950/40 to-black text-white p-6 overflow-y-auto">
      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-[10px] font-mono tracking-[0.4em] text-emerald-300/80">STEP {Math.min(step + 1, totalSteps)} OF {totalSteps}</div>
          <div className="mt-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" style={{ width: `${((Math.min(step + 1, totalSteps)) / totalSteps) * 100}%` }} />
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 space-y-5">
          {step === 0 && (
            <>
              <div className="text-center space-y-2">
                <div className="text-5xl">👻</div>
                <h2 className="text-2xl font-bold">Welcome to GhostChat</h2>
                <p className="text-white/60 text-sm leading-relaxed">The private messaging layer of GhostOS. No email. No phone. Just a username and your Ghost identity.</p>
              </div>
              <button onClick={() => setStep(1)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold">Get Started</button>
              <button onClick={onSwitchToLogin} className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-white/70">I already have an account</button>
            </>
          )}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Choose a username</h2>
                <p className="text-white/50 text-sm">Used to sign in on other devices. Lowercase letters, numbers, . _ -</p>
              </div>
              <input autoFocus value={username}
                onChange={(e) => { setUsernameErr(""); setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase().slice(0, 24)); }}
                placeholder="ghost_user"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/50 text-lg font-mono" />
              {usernameErr && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{usernameErr}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={username.trim().length < 3}
                  onClick={async () => { if (await validateUsername()) setStep(2); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm disabled:opacity-40">Continue</button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold">What's your name?</h2>
                <p className="text-white/50 text-sm">This is how you'll appear to friends.</p>
              </div>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 32))} placeholder="Your display name"
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/50 text-lg" />
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={name.trim().length < 2} onClick={() => setStep(3)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm disabled:opacity-40">Continue</button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Choose an avatar</h2>
                <p className="text-white/50 text-sm">Pick a symbol and a color.</p>
              </div>
              <div className="flex justify-center">
                <div className={`h-24 w-24 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-5xl ring-1 ring-white/15 shadow-2xl`}>{emoji}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest text-white/40 mb-2">SYMBOL</div>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className={`aspect-square rounded-xl text-xl transition ${emoji === e ? "bg-emerald-500/20 ring-1 ring-emerald-400/60" : "bg-white/5 hover:bg-white/10"}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest text-white/40 mb-2">COLOR</div>
                <div className="grid grid-cols-8 gap-2">
                  {GRADIENTS.map((g) => (
                    <button key={g} onClick={() => setGradient(g)}
                      className={`aspect-square rounded-full bg-gradient-to-br ${g} ring-1 transition ${gradient === g ? "ring-2 ring-white" : "ring-white/15"}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm">Continue</button>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div>
                <h2 className="text-xl font-bold">Your Ghost ID</h2>
                <p className="text-white/50 text-sm">Friends add you with this. It's shown publicly on your profile.</p>
              </div>
              <div className="flex flex-col items-center gap-3 py-3">
                <div className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl ring-1 ring-white/15`}>{emoji}</div>
                <div className="text-sm text-white/70">{name}</div>
                <div className="text-[11px] font-mono text-white/40">@{username}</div>
                <div className="font-mono text-2xl tracking-widest bg-white/5 rounded-2xl px-6 py-3 border border-white/10">
                  {ghostId}
                </div>
                <button onClick={() => setGhostId(newGhostId())} className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Regenerate
                </button>
              </div>
              {err && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={busy} onClick={createAccount}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm disabled:opacity-40">
                  {busy ? "Creating…" : "Create Account"}
                </button>
              </div>
            </>
          )}
          {step === 5 && recovery && (
            <>
              <div className="text-center space-y-1">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/40 flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-amber-300" />
                </div>
                <h2 className="text-xl font-bold">Your Secret Recovery Code</h2>
                <p className="text-white/60 text-xs leading-relaxed">Write this down. It is the <b>only</b> way to sign in on another device. GhostOS cannot recover it for you.</p>
              </div>
              <div className="font-mono text-lg tracking-widest bg-black/60 rounded-2xl px-4 py-4 border border-amber-400/20 text-center select-all">
                {recovery}
              </div>
              <button onClick={copyCode} className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2">
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy code"}
              </button>
              <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-emerald-500" />
                <span>I've saved my recovery code somewhere safe.</span>
              </label>
              <button disabled={!ack} onClick={() => { /* session already set — root will render Messenger */ }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold text-sm disabled:opacity-40">
                Enter GhostChat
              </button>
              <div className="text-[10px] text-white/40 text-center">You can view this code again in Settings → Account.</div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============ Account Settings Panel ============
function AccountPanel({ me, onClose }: { me: Profile; onClose: () => void }) {
  const [code, setCode] = useState<string | null>(() => loadRecovery(me.id));
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const copy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const regenerate = async () => {
    setBusy(true); setErr("");
    try {
      const next = newRecoveryCode();
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      storeRecovery(me.id, next);
      setCode(next);
      setReveal(true);
      setConfirm(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wiping, setWiping] = useState(false);
  const devWipe = async () => {
    setWiping(true);
    try {
      await supabase.from("messages").delete().or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`);
      await supabase.from("friendships").delete().or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`);
      await supabase.from("profiles").update({
        username: null,
        display_name: "(deleted)",
        ghost_id: `DEL-${Math.floor(100000 + Math.random() * 900000)}`,
        avatar_emoji: "👻",
        avatar_gradient: "from-zinc-600 to-zinc-800",
      }).eq("id", me.id);
      try { localStorage.removeItem(RECOVERY_LS(me.id)); } catch { /* ignore */ }
      await supabase.auth.signOut();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setWiping(false); }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-6" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-strong rounded-3xl p-6 space-y-5 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Account</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-3">
          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${me.avatar_gradient} flex items-center justify-center text-2xl ring-1 ring-white/15`}>{me.avatar_emoji}</div>
          <div className="min-w-0">
            <div className="text-base font-semibold truncate">{me.display_name}</div>
            <div className="text-[11px] font-mono text-white/50">@{me.username ?? "—"}</div>
            <div className="text-[11px] font-mono text-emerald-300/70">{me.ghost_id}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-300" />
            <div className="text-sm font-semibold">Secret Recovery Code</div>
          </div>
          <div className="text-[11px] text-white/60 leading-relaxed">
            Keep this code safe. It is required to sign in on another device. Anyone with this code can access your account.
          </div>
          {code ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm tracking-widest bg-black/50 rounded-xl px-3 py-2.5 border border-white/10 select-all">
                  {reveal ? code : "•••• •••• •••• ••••"}
                </div>
                <button onClick={() => setReveal((r) => !r)} className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={copy} className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <div className="text-[10px] text-emerald-300">Copied to clipboard</div>}
            </>
          ) : (
            <div className="text-[11px] text-white/50 italic">
              Your recovery code isn't stored on this device. Regenerate a new one to view and save it.
            </div>
          )}

          {!confirm ? (
            <button onClick={() => setConfirm(true)}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate Recovery Code
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-amber-200 bg-amber-500/10 rounded-lg px-3 py-2">
                Regenerating will invalidate your old code. Any device signed out will need the new code to sign in.
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs">Cancel</button>
                <button disabled={busy} onClick={regenerate}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-xs font-semibold disabled:opacity-40">
                  {busy ? "…" : "Regenerate"}
                </button>
              </div>
            </div>
          )}
          {err && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</div>}
        </div>

        <button onClick={signOut}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm flex items-center justify-center gap-2 text-white/80">
          <LogOut className="h-4 w-4" /> Sign out
        </button>

        {/* Dev-only account reset (remove before public release) */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
          <div className="text-[10px] font-mono tracking-widest text-rose-300/80">DEV · DANGER ZONE</div>
          <div className="text-[11px] text-white/60 leading-relaxed">
            Permanently delete this account's data (messages, contacts, requests, profile, recovery code) and free your username for reuse.
          </div>
          {!wipeConfirm ? (
            <button onClick={() => setWipeConfirm(true)}
              className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-200 flex items-center justify-center gap-2">
              <Trash2 className="h-3.5 w-3.5" /> Delete my account & reset
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setWipeConfirm(false)} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs">Cancel</button>
              <button disabled={wiping} onClick={devWipe}
                className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-semibold disabled:opacity-40">
                {wiping ? "Deleting…" : "Yes, delete everything"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


// ============ Messenger ============
function Avatar({ p, size = 40 }: { p: Pick<Profile, "avatar_emoji" | "avatar_gradient">; size?: number }) {
  return (
    <div className={`rounded-full bg-gradient-to-br ${p.avatar_gradient} flex items-center justify-center ring-1 ring-white/10 shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {p.avatar_emoji}
    </div>
  );
}

type ChatKey = string;
function chatKey(a: string, b: string): ChatKey { return [a, b].sort().join("|"); }

function Messenger({ me }: { me: Profile }) {
  const { pushNotification } = useGhost();
  const [tab, setTab] = useState<"chats" | "contacts" | "requests">("chats");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null); // other user id
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  // Initial load
  const loadAll = useCallback(async () => {
    const [{ data: fs }, { data: ms }] = await Promise.all([
      supabase.from("friendships").select("*"),
      supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(500),
    ]);
    const fRows = (fs ?? []) as Friendship[];
    const mRows = (ms ?? []) as Message[];
    setFriendships(fRows);
    setMessages(mRows);
    const ids = new Set<string>();
    fRows.forEach((f) => { ids.add(f.requester_id); ids.add(f.addressee_id); });
    mRows.forEach((m) => { ids.add(m.sender_id); ids.add(m.recipient_id); });
    ids.delete(me.id);
    if (ids.size) {
      const { data: ps } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
      const map: Record<string, Profile> = {};
      (ps ?? []).forEach((p) => { map[(p as Profile).id] = p as Profile; });
      setProfiles(map);
    }
  }, [me.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 680));
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  // Incoming calls use the same authenticated realtime channel rules as messages.
  useEffect(() => {
    const ch = supabase.channel(`ghostcall-inbox-${me.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "call_signals", filter: `recipient_id=eq.${me.id}`,
      }, async (payload) => {
        const signal = payload.new as { id: string; kind: string; sender_id: string; call_id: string; payload: { video?: boolean } };
        if (signal.kind !== "invite") return;
        const next = { callId: signal.call_id, fromId: signal.sender_id, video: Boolean(signal.payload?.video) };
        setIncomingCall((current) => current ?? next);
        const existing = profiles[signal.sender_id];
        if (!existing) {
          const { data: p } = await supabase.from("profiles").select("*").eq("id", signal.sender_id).maybeSingle();
          if (p) setProfiles((all) => ({ ...all, [p.id]: p as Profile }));
        }
        pushNotification({
          title: `Incoming ${next.video ? "video" : "voice"} call`,
          body: existing ? `${existing.display_name} is calling you` : "A GhostChat contact is calling you",
          app: "chat",
        });
        await supabase.from("call_signals").delete().eq("id", signal.id);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [me.id, profiles, pushNotification]);

  useEffect(() => {
    if (!incomingCall) return;
    const timer = window.setTimeout(() => setIncomingCall(null), 45_000);
    return () => window.clearTimeout(timer);
  }, [incomingCall]);

  // Realtime
  useEffect(() => {
    const ch: RealtimeChannel = supabase.channel("ghostchat-" + me.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, async (payload) => {
        if (payload.eventType === "INSERT") {
          const m = payload.new as Message;
          setMessages((arr) => (arr.some((x) => x.id === m.id) ? arr : [...arr, m]));
          if (m.recipient_id === me.id && m.sender_id !== me.id) {
            const other = profiles[m.sender_id];
            if (other) {
              pushNotification({ title: `${other.display_name}`, body: m.content });
            } else {
              const { data: p } = await supabase.from("profiles").select("*").eq("id", m.sender_id).maybeSingle();
              if (p) {
                setProfiles((pp) => ({ ...pp, [p.id]: p as Profile }));
                pushNotification({ title: (p as Profile).display_name, body: m.content });
              }
            }
          }
        } else if (payload.eventType === "UPDATE") {
          const m = payload.new as Message;
          setMessages((arr) => arr.map((x) => (x.id === m.id ? m : x)));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, async (payload) => {
        if (payload.eventType === "INSERT") {
          const f = payload.new as Friendship;
          if (f.requester_id === me.id || f.addressee_id === me.id) {
            setFriendships((arr) => (arr.some((x) => x.id === f.id) ? arr : [...arr, f]));
            const other = f.requester_id === me.id ? f.addressee_id : f.requester_id;
            if (!profiles[other]) {
              const { data: p } = await supabase.from("profiles").select("*").eq("id", other).maybeSingle();
              if (p) setProfiles((pp) => ({ ...pp, [(p as Profile).id]: p as Profile }));
            }
            if (f.addressee_id === me.id) {
              pushNotification({ title: "New friend request", body: "Someone wants to connect on GhostChat" });
            }
          }
        } else if (payload.eventType === "UPDATE") {
          const f = payload.new as Friendship;
          setFriendships((arr) => arr.map((x) => (x.id === f.id ? f : x)));
        } else if (payload.eventType === "DELETE") {
          const f = payload.old as Friendship;
          setFriendships((arr) => arr.filter((x) => x.id !== f.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, profiles, pushNotification]);

  // Derived
  const accepted = useMemo(() => friendships.filter((f) => f.status === "accepted"), [friendships]);
  const incoming = useMemo(() => friendships.filter((f) => f.status === "pending" && f.addressee_id === me.id), [friendships, me.id]);
  const outgoing = useMemo(() => friendships.filter((f) => f.status === "pending" && f.requester_id === me.id), [friendships, me.id]);

  const conversations = useMemo(() => {
    return accepted.map((f) => {
      const otherId = f.requester_id === me.id ? f.addressee_id : f.requester_id;
      const msgs = messages.filter((m) => (m.sender_id === otherId && m.recipient_id === me.id) || (m.sender_id === me.id && m.recipient_id === otherId));
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.recipient_id === me.id && !m.read_at).length;
      return { friendship: f, otherId, last, unread, count: msgs.length };
    }).sort((a, b) => {
      const at = a.last ? new Date(a.last.created_at).getTime() : 0;
      const bt = b.last ? new Date(b.last.created_at).getTime() : 0;
      return bt - at;
    });
  }, [accepted, messages, me.id]);

  const activeConv = activeId ? conversations.find((c) => c.otherId === activeId) : null;
  const activeMsgs = useMemo(() => {
    if (!activeId) return [];
    return messages.filter((m) => (m.sender_id === activeId && m.recipient_id === me.id) || (m.sender_id === me.id && m.recipient_id === activeId));
  }, [activeId, messages, me.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeMsgs.length, activeId]);

  // Mark read
  useEffect(() => {
    if (!activeId) return;
    const unread = activeMsgs.filter((m) => m.recipient_id === me.id && !m.read_at);
    if (!unread.length) return;
    const now = new Date().toISOString();
    supabase.from("messages").update({ read_at: now }).in("id", unread.map((m) => m.id)).then(() => {
      setMessages((arr) => arr.map((m) => (unread.some((u) => u.id === m.id) ? { ...m, read_at: now } : m)));
    });
  }, [activeId, activeMsgs, me.id]);

  const send = async () => {
    if (!draft.trim() || !activeId) return;
    const content = draft.trim();
    setDraft("");
    const { data, error } = await supabase.from("messages").insert({
      sender_id: me.id, recipient_id: activeId, content,
    }).select().single();
    if (error) { setDraft(content); return; }
    setMessages((arr) => (arr.some((x) => x.id === data.id) ? arr : [...arr, data as Message]));
  };

  const react = async (m: Message, r: string) => {
    const next = m.reaction === r ? null : r;
    await supabase.from("messages").update({ reaction: next }).eq("id", m.id);
    setMessages((arr) => arr.map((x) => (x.id === m.id ? { ...x, reaction: next } : x)));
  };

  const sendRequest = async (ghost_id: string): Promise<string | null> => {
    const gid = ghost_id.trim().toUpperCase();
    if (!gid) return "Enter a Ghost ID";
    if (gid === me.ghost_id) return "That's your own Ghost ID";
    const { data: p } = await supabase.from("profiles").select("*").eq("ghost_id", gid).maybeSingle();
    if (!p) return "No user with that Ghost ID";
    const other = p as Profile;
    if (friendships.some((f) => (f.requester_id === other.id || f.addressee_id === other.id))) return "Already connected or pending";
    const { data: f, error } = await supabase.from("friendships").insert({
      requester_id: me.id, addressee_id: other.id, status: "pending",
    }).select().single();
    if (error) return error.message;
    setFriendships((arr) => [...arr, f as Friendship]);
    setProfiles((pp) => ({ ...pp, [other.id]: other }));
    return null;
  };

  const respond = async (f: Friendship, accept: boolean) => {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", f.id);
      setFriendships((arr) => arr.map((x) => (x.id === f.id ? { ...x, status: "accepted" } : x)));
    } else {
      await supabase.from("friendships").delete().eq("id", f.id);
      setFriendships((arr) => arr.filter((x) => x.id !== f.id));
    }
  };

  const startCall = (withId: string, video: boolean) => {
    const callId = crypto.randomUUID();
    setIncomingCall(null);
    setCall({ callId, fromId: me.id, withId, video, direction: "outgoing" });
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    setActiveId(incomingCall.fromId);
    setCall({ ...incomingCall, withId: incomingCall.fromId, direction: "incoming" });
    setIncomingCall(null);
  };

  const declineCall = async () => {
    if (!incomingCall) return;
    await supabase.from("call_signals").insert({
      sender_id: me.id,
      recipient_id: incomingCall.fromId,
      call_id: incomingCall.callId,
      kind: "decline",
      payload: {},
    });
    setIncomingCall(null);
  };

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const p = profiles[c.otherId];
    return p?.display_name.toLowerCase().includes(search.toLowerCase()) || p?.ghost_id.toLowerCase().includes(search.toLowerCase());
  });

  const other = activeId ? profiles[activeId] : null;

  return (
    <div ref={shellRef} className="relative flex h-full min-h-0 overflow-hidden bg-chat-bg text-chat-text">
      <aside className={`${narrow && activeId ? "hidden" : "flex"} ${narrow ? "w-full" : "w-[310px] shrink-0"} min-h-0 flex-col border-r border-border bg-chat-sidebar`}>
        <div className="flex h-[60px] shrink-0 items-center gap-2 bg-chat-panel px-3">
          <button onClick={() => setShowAccount(true)} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left transition hover:bg-white/5" title="Account">
            <Avatar p={me} size={38} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{me.display_name}</div>
              <div className="text-[11px] text-chat-muted">@{me.username ?? me.ghost_id}</div>
            </div>
          </button>
          <button onClick={() => setShowAccount(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-chat-muted transition hover:bg-white/5 hover:text-chat-text" title="Account settings" aria-label="Account settings">
            <SettingsIcon className="h-[18px] w-[18px]" />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-chat-muted transition hover:bg-white/5 hover:text-chat-text" title="Add friend" aria-label="Add friend">
            <Plus className="h-5 w-5" />
          </button>
        </div>


        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-chat-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or start a new chat" aria-label="Search chats"
              className="w-full rounded-lg border border-transparent bg-chat-panel py-2 pl-9 pr-3 text-sm text-chat-text outline-none placeholder:text-chat-muted focus:border-chat-muted/30" />
          </div>
        </div>

        <div className="flex shrink-0 gap-1 px-3 pb-2 text-xs">
          {(["chats", "contacts", "requests"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-1.5 font-medium capitalize transition ${tab === t ? "bg-chat-accent/15 text-chat-accent" : "text-chat-muted hover:bg-chat-panel hover:text-chat-text"}`}>
              {t}{t === "requests" && incoming.length > 0 && <span className="ml-1 text-[10px]">({incoming.length})</span>}
            </button>
          ))}
        </div>

        <div className="chat-scroll mt-1 flex-1 overflow-y-auto pb-2">
          {tab === "chats" && (
            filtered.length === 0 ? (
              <EmptyPanel icon="💬" title="No conversations" body="Tap + to add a friend by Ghost ID and start messaging." />
            ) : (
              filtered.map((c) => {
                const p = profiles[c.otherId];
                if (!p) return null;
                const active = activeId === c.otherId;
                return (
                  <button key={c.friendship.id} onClick={() => setActiveId(c.otherId)}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${active ? "bg-chat-input" : "hover:bg-chat-panel"}`}>
                    <Avatar p={p} size={48} />
                    <div className="min-w-0 flex-1 border-b border-border pb-3">
                      <div className="flex items-baseline gap-2">
                        <div className="flex-1 truncate text-[15px] font-normal">{p.display_name}</div>
                        {c.last && <div className={`text-[11px] ${c.unread ? "text-chat-accent" : "text-chat-muted"}`}>{fmtTime(c.last.created_at)}</div>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <div className="flex-1 truncate text-[13px] text-chat-muted">
                          {c.last ? (c.last.sender_id === me.id ? "You: " : "") + c.last.content : "Start a conversation"}
                        </div>
                        {c.unread > 0 && <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-chat-accent px-1.5 text-[10px] font-semibold text-chat-bg">{c.unread}</div>}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          )}
          {tab === "contacts" && (
            accepted.length === 0 ? (
              <EmptyPanel icon="👥" title="No contacts" body="Add friends using their Ghost ID." />
            ) : accepted.map((f) => {
              const oid = f.requester_id === me.id ? f.addressee_id : f.requester_id;
              const p = profiles[oid]; if (!p) return null;
              return (
                <button key={f.id} onClick={() => { setActiveId(oid); setTab("chats"); }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 text-left">
                  <Avatar p={p} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.display_name}</div>
                    <div className="text-[10px] font-mono text-white/40">{p.ghost_id}</div>
                  </div>
                </button>
              );
            })
          )}
          {tab === "requests" && (
            (incoming.length + outgoing.length === 0) ? (
              <EmptyPanel icon="✉️" title="No pending requests" body="Friend requests you send or receive appear here." />
            ) : (
              <>
                {incoming.length > 0 && <div className="text-[10px] tracking-widest font-mono text-white/40 px-2 pt-2 pb-1">INCOMING</div>}
                {incoming.map((f) => {
                  const p = profiles[f.requester_id]; if (!p) return null;
                  return (
                    <div key={f.id} className="p-2 rounded-xl bg-white/5 mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar p={p} size={38} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{p.display_name}</div>
                          <div className="text-[10px] font-mono text-white/40">{p.ghost_id}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => respond(f, false)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1"><X className="h-3 w-3" />Decline</button>
                        <button onClick={() => respond(f, true)} className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-xs font-semibold flex items-center justify-center gap-1"><Check className="h-3 w-3" />Accept</button>
                      </div>
                    </div>
                  );
                })}
                {outgoing.length > 0 && <div className="text-[10px] tracking-widest font-mono text-white/40 px-2 pt-2 pb-1">SENT</div>}
                {outgoing.map((f) => {
                  const p = profiles[f.addressee_id]; if (!p) return null;
                  return (
                    <div key={f.id} className="p-2 rounded-xl bg-white/5 mb-2 flex items-center gap-3">
                      <Avatar p={p} size={38} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.display_name}</div>
                        <div className="text-[10px] font-mono text-white/40">{p.ghost_id}</div>
                      </div>
                      <div className="text-[10px] text-amber-300">pending</div>
                    </div>
                  );
                })}
              </>
            )
          )}
        </div>

      </aside>

      {/* CENTER */}
      <main className={`${narrow && !activeId ? "hidden" : "flex"} min-w-0 flex-1 flex-col`}>
        {!activeConv || !other ? (
          <div className="chat-wallpaper flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-chat-panel text-chat-accent">
              <MessageCircle className="h-9 w-9" strokeWidth={1.5} />
            </div>
            <div className="text-2xl font-light">GhostChat for GhostOS</div>
            <div className="mt-2 max-w-xs text-sm leading-relaxed text-chat-muted">Choose a conversation, or add a friend with their Ghost ID. Messages and calls stay synced to your account.</div>
            <button onClick={() => setShowAdd(true)} className="mt-5 flex items-center gap-2 rounded-full bg-chat-accent px-5 py-2.5 text-sm font-medium text-chat-bg transition hover:opacity-90">
              <UserPlus className="h-4 w-4" />Add friend
            </button>
          </div>
        ) : (
          <>
            <div className="flex h-[60px] shrink-0 items-center gap-3 bg-chat-panel px-3">
              {narrow && <button className="text-chat-muted" onClick={() => setActiveId(null)} aria-label="Back to chats"><ChevronLeft className="h-6 w-6" /></button>}
              <Avatar p={other} size={38} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">{other.display_name}</div>
                <div className="truncate text-[11px] text-chat-muted">{other.ghost_id}</div>
              </div>
              <button onClick={() => startCall(other.id, false)} className="flex h-9 w-9 items-center justify-center rounded-full text-chat-muted transition hover:bg-white/5 hover:text-chat-text" title="Voice call" aria-label={`Voice call ${other.display_name}`}><Phone className="h-[18px] w-[18px]" /></button>
              <button onClick={() => startCall(other.id, true)} className="flex h-9 w-9 items-center justify-center rounded-full text-chat-muted transition hover:bg-white/5 hover:text-chat-text" title="Video call" aria-label={`Video call ${other.display_name}`}><Video className="h-5 w-5" /></button>
              {!narrow && <button onClick={() => setShowInfo((s) => !s)} className={`flex h-9 w-9 items-center justify-center rounded-full transition ${showInfo ? "bg-chat-input text-chat-text" : "text-chat-muted hover:bg-white/5 hover:text-chat-text"}`} title="Contact info" aria-label="Contact info"><Info className="h-[18px] w-[18px]" /></button>}
            </div>

            <div className="chat-wallpaper chat-scroll flex-1 overflow-y-auto px-3 py-4 sm:px-8">
              {activeMsgs.length === 0 && (
                <div className="mx-auto mt-8 w-fit rounded-lg bg-chat-panel px-4 py-2 text-center text-xs text-chat-muted">Send a message to start the conversation.</div>
              )}
              {activeMsgs.map((m, i) => {
                const mine = m.sender_id === me.id;
                const prev = activeMsgs[i - 1];
                const showDay = !prev || new Date(m.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                return (
                  <div key={m.id}>
                    {showDay && <div className="my-4 text-center"><span className="rounded-lg bg-chat-panel px-3 py-1.5 text-[11px] text-chat-muted shadow-sm">{new Date(m.created_at).toDateString() === new Date().toDateString() ? "Today" : new Date(m.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span></div>}
                    <MessageBubble m={m} mine={mine} onReact={(r) => react(m, r)} />
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            <div className="shrink-0 bg-chat-panel px-3 py-2">
              <div className="flex items-end gap-2">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                  placeholder="Type a message" aria-label="Message"
                  className="max-h-24 min-h-[42px] flex-1 resize-none rounded-lg border border-transparent bg-chat-input px-4 py-3 text-[15px] text-chat-text outline-none placeholder:text-chat-muted focus:border-chat-muted/30" />
                <button onClick={() => void send()} disabled={!draft.trim()} aria-label="Send message" title="Send"
                  className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-chat-accent text-chat-bg transition hover:opacity-90 disabled:opacity-30">
                  <Send className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showInfo && other && !narrow && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 270, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden border-l border-border bg-chat-sidebar">
            <div className="flex h-full w-[270px] flex-col">
              <div className="flex h-[60px] shrink-0 items-center gap-5 bg-chat-panel px-5">
                <button onClick={() => setShowInfo(false)} className="text-chat-muted" aria-label="Close contact info"><X className="h-5 w-5" /></button>
                <span className="text-sm">Contact info</span>
              </div>
              <div className="flex flex-col items-center bg-chat-panel px-6 py-7 text-center">
                <Avatar p={other} size={110} />
                <div className="mt-4 text-xl font-normal">{other.display_name}</div>
                <div className="mt-1 text-sm text-chat-muted">@{other.username ?? "ghost"}</div>
              </div>
              <div className="mt-3 bg-chat-panel p-5">
                <div className="text-xs text-chat-accent">Ghost ID</div>
                <div className="mt-2 font-mono text-sm text-chat-text">{other.ghost_id}</div>
              </div>
              <div className="mt-3 flex justify-around bg-chat-panel p-5">
                <RoundBtn icon={<Phone className="h-4 w-4" />} label="Voice" onClick={() => startCall(other.id, false)} />
                <RoundBtn icon={<Video className="h-4 w-4" />} label="Video" onClick={() => startCall(other.id, true)} />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <AddFriendSheet me={me} onClose={() => setShowAdd(false)} onAdd={sendRequest} />}
      </AnimatePresence>

      <AnimatePresence>
        {incomingCall && profiles[incomingCall.fromId] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[65] flex items-center justify-center bg-chat-bg/85 p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xs rounded-2xl bg-chat-panel p-6 text-center shadow-2xl">
              <div className="flex justify-center"><Avatar p={profiles[incomingCall.fromId]} size={82} /></div>
              <div className="mt-4 text-xl font-medium">{profiles[incomingCall.fromId].display_name}</div>
              <div className="mt-1 text-sm text-chat-muted">Incoming {incomingCall.video ? "video" : "voice"} call</div>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="text-center">
                  <button onClick={() => void declineCall()} className="flex h-13 w-13 items-center justify-center rounded-full bg-destructive p-4 text-destructive-foreground" aria-label="Decline call"><PhoneOff className="h-5 w-5" /></button>
                  <div className="mt-2 text-xs text-chat-muted">Decline</div>
                </div>
                <div className="text-center">
                  <button onClick={acceptCall} className="flex h-13 w-13 items-center justify-center rounded-full bg-chat-accent p-4 text-chat-bg" aria-label="Accept call"><Phone className="h-5 w-5" /></button>
                  <div className="mt-2 text-xs text-chat-muted">Accept</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {call && profiles[call.withId] && (
          <CallOverlay me={me} peer={profiles[call.withId]} video={call.video} callId={call.callId} direction={call.direction} onEnd={() => setCall(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccount && <AccountPanel me={me} onClose={() => setShowAccount(false)} />}
      </AnimatePresence>
    </div>
  );
}

function EmptyPanel({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mb-3 text-3xl">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-chat-muted">{body}</div>
    </div>
  );
}

function RoundBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-chat-input text-chat-accent transition group-hover:opacity-80">{icon}</div>
      <div className="text-[11px] text-chat-muted">{label}</div>
    </button>
  );
}

function MessageBubble({ m, mine, onReact }: { m: Message; mine: boolean; onReact: (r: string) => void }) {
  const [showR, setShowR] = useState(false);
  return (
    <div className={`group mb-1 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-[82%] sm:max-w-[70%]">
        <motion.div initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-lg px-2.5 py-1.5 text-[14px] leading-relaxed break-words shadow-sm ${mine ? "rounded-tr-none bg-chat-outgoing" : "rounded-tl-none bg-chat-incoming"}`}>
          <span className="whitespace-pre-wrap">{m.content}</span>
          <span className="float-right ml-3 mt-2 flex items-center gap-1 text-[10px] leading-none text-chat-muted">
            {fmtTime(m.created_at)}
            {mine && (m.read_at ? <CheckCheck className="h-3.5 w-3.5 text-chat-check" /> : <Check className="h-3.5 w-3.5" />)}
          </span>
        </motion.div>
        <button onClick={() => setShowR((s) => !s)} aria-label="React to message"
          className={`absolute top-1 ${mine ? "-left-7" : "-right-7"} flex h-6 w-6 items-center justify-center rounded-full text-chat-muted opacity-0 transition hover:bg-chat-panel group-hover:opacity-100 focus:opacity-100`}>
          <Smile className="h-3.5 w-3.5" />
        </button>
        {m.reaction && (
          <div className={`absolute -bottom-3 ${mine ? "right-1" : "left-1"} flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-chat-panel px-1 text-xs shadow-sm`}>
            {m.reaction}
          </div>
        )}
        <AnimatePresence>
          {showR && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute -top-10 ${mine ? "right-0" : "left-0"} z-10 flex gap-0.5 rounded-full border border-border bg-chat-panel px-1.5 py-1 shadow-xl`}>
              {REACTIONS.map((r) => (
                <button key={r} onClick={() => { onReact(r); setShowR(false); }} className="h-7 w-7 rounded-full text-sm transition hover:bg-chat-input" aria-label={`React ${r}`}>{r}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ Add Friend ============
function AddFriendSheet({ me, onClose, onAdd }: { me: Profile; onClose: () => void; onAdd: (g: string) => Promise<string | null> }) {
  const [gid, setGid] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const submit = async () => {
    setMsg(""); setOk(false);
    const err = await onAdd(gid);
    if (err) setMsg(err);
    else { setOk(true); setGid(""); setTimeout(onClose, 900); }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm glass-strong rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold">Add a friend</div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="text-xs text-white/60 mb-3">Enter your friend's Ghost ID. Share yours: <span className="font-mono text-emerald-300">{me.ghost_id}</span></div>
        <input autoFocus value={gid} onChange={(e) => setGid(e.target.value.toUpperCase())} placeholder="GH-XXXXXX"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-emerald-400/50 text-lg font-mono tracking-widest text-center" />
        {msg && <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2 text-center">{msg}</div>}
        {ok && <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2 text-center">Request sent ✓</div>}
        <button onClick={submit} disabled={!gid.trim()} className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-semibold disabled:opacity-40">Send request</button>
      </motion.div>
    </motion.div>
  );
}

