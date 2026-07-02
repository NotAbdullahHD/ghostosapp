import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import {
  Search, Send, Phone, Video, Info, ChevronLeft, Plus, UserPlus, Check, X,
  Mic, MicOff, VideoOff, PhoneOff, MonitorUp, MoreHorizontal, Sparkles,
  Settings as SettingsIcon, Eye, EyeOff, Copy, RefreshCw, ShieldAlert, LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGhost } from "@/ghost/store";

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

// ============ Constants ============
const GRADIENTS = [
  "from-fuchsia-500 to-violet-700",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-indigo-500 to-purple-700",
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
    return <div className="h-full flex items-center justify-center bg-gradient-to-br from-black to-violet-950/30 text-white/50 text-xs font-mono">Loading GhostChat…</div>;
  }
  if (!session) return <AuthShell />;
  if (!profile) return <div className="h-full flex items-center justify-center bg-black text-white/40 text-xs font-mono">Preparing account…</div>;
  return <Messenger me={profile} onProfile={setProfile} />;
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
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-black via-violet-950/40 to-black text-white p-8 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-[26px] bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-600 flex items-center justify-center text-4xl shadow-[0_20px_60px_-15px_rgba(168,85,247,0.6)] ring-1 ring-white/10">
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
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/50 text-sm font-mono" />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest text-white/40 mb-1.5">RECOVERY CODE</div>
            <div className="relative">
              <input type={reveal ? "text" : "password"} value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 32))}
                placeholder="GS-XXXX-XXXX-XXXX"
                className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/50 text-sm font-mono tracking-wider" />
              <button type="button" onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50">
                {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          {err && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</div>}
          <button onClick={submit} disabled={busy || !username || !code}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm disabled:opacity-40 transition">
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
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-black via-violet-950/40 to-black text-white p-6 overflow-y-auto">
      <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-[10px] font-mono tracking-[0.4em] text-fuchsia-300/80">STEP {Math.min(step + 1, totalSteps)} OF {totalSteps}</div>
          <div className="mt-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500 transition-all" style={{ width: `${((Math.min(step + 1, totalSteps)) / totalSteps) * 100}%` }} />
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
              <button onClick={() => setStep(1)} className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold">Get Started</button>
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
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/50 text-lg font-mono" />
              {usernameErr && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{usernameErr}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={username.trim().length < 3}
                  onClick={async () => { if (await validateUsername()) setStep(2); }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm disabled:opacity-40">Continue</button>
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
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/50 text-lg" />
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={name.trim().length < 2} onClick={() => setStep(3)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm disabled:opacity-40">Continue</button>
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
                      className={`aspect-square rounded-xl text-xl transition ${emoji === e ? "bg-fuchsia-500/20 ring-1 ring-fuchsia-400/60" : "bg-white/5 hover:bg-white/10"}`}>{e}</button>
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
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm">Continue</button>
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
                <button onClick={() => setGhostId(newGhostId())} className="text-xs text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Regenerate
                </button>
              </div>
              {err && <div className="text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2">{err}</div>}
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="px-4 py-2.5 rounded-xl bg-white/5 text-sm">Back</button>
                <button disabled={busy} onClick={createAccount}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm disabled:opacity-40">
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
                  className="mt-0.5 h-4 w-4 rounded accent-fuchsia-500" />
                <span>I've saved my recovery code somewhere safe.</span>
              </label>
              <button disabled={!ack} onClick={() => { /* session already set — root will render Messenger */ }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold text-sm disabled:opacity-40">
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
            <div className="text-[11px] font-mono text-fuchsia-300/70">{me.ghost_id}</div>
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

function Messenger({ me, onProfile }: { me: Profile; onProfile: (p: Profile) => void }) {
  const { pushNotification } = useGhost();
  const [tab, setTab] = useState<"chats" | "contacts" | "requests">("chats");
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null); // other user id
  const [draft, setDraft] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [call, setCall] = useState<{ withId: string; video: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

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

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const p = profiles[c.otherId];
    return p?.display_name.toLowerCase().includes(search.toLowerCase()) || p?.ghost_id.toLowerCase().includes(search.toLowerCase());
  });

  const other = activeId ? profiles[activeId] : null;

  return (
    <div className="h-full flex bg-[#0a0612] text-white">
      {/* LEFT PANEL */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-black/40 backdrop-blur-xl">
        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <Avatar p={me} size={30} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{me.display_name}</div>
              <div className="text-[10px] font-mono text-fuchsia-300/70 tracking-wider">{me.ghost_id}</div>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} className="h-8 w-8 rounded-full bg-fuchsia-500/15 hover:bg-fuchsia-500/25 flex items-center justify-center">
            <Plus className="h-4 w-4 text-fuchsia-200" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/5 outline-none text-sm focus:border-white/20" />
          </div>
        </div>

        <div className="px-3 pt-3 flex gap-1 text-xs">
          {(["chats", "contacts", "requests"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition capitalize ${tab === t ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"}`}>
              {t}{t === "requests" && incoming.length > 0 && <span className="ml-1 text-[10px] text-fuchsia-300">({incoming.length})</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide mt-2 px-2 pb-2">
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
                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition text-left ${active ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-500/10" : "hover:bg-white/5"}`}>
                    <Avatar p={p} size={42} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <div className="text-sm font-semibold truncate flex-1">{p.display_name}</div>
                        {c.last && <div className="text-[10px] text-white/40">{fmtTime(c.last.created_at)}</div>}
                      </div>
                      <div className="text-xs text-white/50 truncate">
                        {c.last ? (c.last.sender_id === me.id ? "You: " : "") + c.last.content : "New conversation"}
                      </div>
                    </div>
                    {c.unread > 0 && <div className="h-5 min-w-5 px-1.5 rounded-full bg-fuchsia-500 text-[10px] font-bold flex items-center justify-center">{c.unread}</div>}
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
                        <button onClick={() => respond(f, true)} className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-600 text-xs font-semibold flex items-center justify-center gap-1"><Check className="h-3 w-3" />Accept</button>
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

        <button onClick={() => supabase.auth.signOut()} className="text-[10px] text-white/30 hover:text-white/60 py-2 border-t border-white/5">Sign out</button>
      </aside>

      {/* CENTER */}
      <main className="flex-1 flex flex-col min-w-0">
        {!activeConv || !other ? (
          <div className="flex-1 flex items-center justify-center flex-col text-center p-8">
            <div className="h-24 w-24 rounded-[28px] bg-gradient-to-br from-fuchsia-500/30 to-violet-700/30 flex items-center justify-center text-5xl ring-1 ring-white/10 mb-4">💬</div>
            <div className="text-lg font-semibold">Your messages</div>
            <div className="text-sm text-white/50 max-w-xs mt-1">Pick a conversation, or add a friend with their Ghost ID to start.</div>
            <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />Add friend
            </button>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="h-14 border-b border-white/5 px-4 flex items-center gap-3 bg-black/30 backdrop-blur-xl">
              <button className="lg:hidden text-white/60" onClick={() => setActiveId(null)}><ChevronLeft className="h-5 w-5" /></button>
              <Avatar p={other} size={34} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{other.display_name}</div>
                <div className="text-[10px] font-mono text-white/40">{other.ghost_id}</div>
              </div>
              <button onClick={() => setCall({ withId: other.id, video: false })} className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-fuchsia-200"><Phone className="h-4 w-4" /></button>
              <button onClick={() => setCall({ withId: other.id, video: true })} className="h-9 w-9 rounded-full hover:bg-white/10 flex items-center justify-center text-fuchsia-200"><Video className="h-4 w-4" /></button>
              <button onClick={() => setShowInfo((s) => !s)} className={`h-9 w-9 rounded-full flex items-center justify-center ${showInfo ? "bg-white/10 text-white" : "hover:bg-white/10 text-white/60"}`}><Info className="h-4 w-4" /></button>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-1">
              {activeMsgs.length === 0 && (
                <div className="text-center text-xs text-white/40 py-8">Say hello 👋</div>
              )}
              {activeMsgs.map((m, i) => {
                const mine = m.sender_id === me.id;
                const prev = activeMsgs[i - 1];
                const showDay = !prev || (new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()) > 15 * 60_000;
                const isLast = i === activeMsgs.length - 1;
                return (
                  <div key={m.id}>
                    {showDay && <div className="text-center text-[10px] text-white/30 font-mono my-3">{fmtDay(m.created_at)}</div>}
                    <MessageBubble m={m} mine={mine} onReact={(r) => react(m, r)} />
                    {mine && isLast && m.read_at && <div className="text-[10px] text-white/40 text-right pr-1 mt-0.5">Read {fmtTime(m.read_at)}</div>}
                    {mine && isLast && !m.read_at && <div className="text-[10px] text-white/30 text-right pr-1 mt-0.5">Delivered</div>}
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* composer */}
            <div className="p-3 border-t border-white/5 bg-black/30 backdrop-blur-xl">
              <div className="flex items-end gap-2 bg-white/5 rounded-3xl border border-white/10 px-3 py-1.5">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="iMessage"
                  className="flex-1 bg-transparent outline-none py-2 text-sm" />
                <button onClick={send} disabled={!draft.trim()}
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center disabled:opacity-30 transition">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* RIGHT INFO PANEL */}
      <AnimatePresence>
        {showInfo && other && (
          <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="border-l border-white/5 overflow-hidden bg-black/40 backdrop-blur-xl">
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-6 flex flex-col items-center text-center border-b border-white/5">
                <Avatar p={other} size={72} />
                <div className="mt-3 text-lg font-bold">{other.display_name}</div>
                <div className="text-[10px] font-mono tracking-widest text-fuchsia-300/70">{other.ghost_id}</div>
                <div className="flex gap-3 mt-4">
                  <RoundBtn icon={<Phone className="h-4 w-4" />} label="audio" onClick={() => setCall({ withId: other.id, video: false })} />
                  <RoundBtn icon={<Video className="h-4 w-4" />} label="video" onClick={() => setCall({ withId: other.id, video: true })} />
                  <RoundBtn icon={<MoreHorizontal className="h-4 w-4" />} label="more" />
                </div>
              </div>
              <div className="p-4 space-y-4 text-xs flex-1 overflow-y-auto scrollbar-hide">
                <InfoBlock title="SHARED MEDIA" empty="No photos yet" />
                <InfoBlock title="FILES" empty="No files shared" />
                <InfoBlock title="LINKS" empty="No links yet" />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && <AddFriendSheet me={me} onClose={() => setShowAdd(false)} onAdd={sendRequest} />}
      </AnimatePresence>

      <AnimatePresence>
        {call && other && profiles[call.withId] && (
          <CallOverlay me={me} peer={profiles[call.withId]} video={call.video} onEnd={() => setCall(null)} />
        )}
      </AnimatePresence>

      {/* keep onProfile referenced */}
      <span className="hidden" data-p={me.id} onClick={() => onProfile(me)} />
    </div>
  );
}

function EmptyPanel({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="text-center py-10 px-4">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-white/50 mt-1 leading-relaxed">{body}</div>
    </div>
  );
}

function RoundBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div className="h-10 w-10 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition text-fuchsia-200">{icon}</div>
      <div className="text-[9px] text-white/50 tracking-wider uppercase">{label}</div>
    </button>
  );
}

function InfoBlock({ title, empty }: { title: string; empty: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-widest font-mono text-white/40 mb-2">{title}</div>
      <div className="text-xs text-white/40 bg-white/5 rounded-xl p-3 text-center">{empty}</div>
    </div>
  );
}

function MessageBubble({ m, mine, onReact }: { m: Message; mine: boolean; onReact: (r: string) => void }) {
  const [showR, setShowR] = useState(false);
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} group`}>
      <div className="relative max-w-[70%]">
        <motion.div layout initial={{ opacity: 0, y: 4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          onDoubleClick={() => setShowR((s) => !s)}
          className={`px-3.5 py-2 text-[15px] leading-snug break-words shadow-sm ${
            mine
              ? "bg-gradient-to-br from-[#2f7cf6] to-[#0a5cff] text-white rounded-[20px] rounded-br-[6px]"
              : "bg-[#26262b] text-white rounded-[20px] rounded-bl-[6px]"
          }`}>
          {m.content}
        </motion.div>
        {m.reaction && (
          <div className={`absolute -top-2 ${mine ? "-left-1" : "-right-1"} bg-[#1a1a1f] border border-white/10 rounded-full h-6 w-6 flex items-center justify-center text-xs`}>
            {m.reaction}
          </div>
        )}
        <AnimatePresence>
          {showR && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`absolute -top-9 ${mine ? "right-0" : "left-0"} bg-[#1a1a1f] border border-white/10 rounded-full px-2 py-1 flex gap-1 z-10 shadow-lg`}>
              {REACTIONS.map((r) => (
                <button key={r} onClick={() => { onReact(r); setShowR(false); }} className="h-7 w-7 hover:bg-white/10 rounded-full text-sm">{r}</button>
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
        <div className="text-xs text-white/60 mb-3">Enter your friend's Ghost ID. Share yours: <span className="font-mono text-fuchsia-300">{me.ghost_id}</span></div>
        <input autoFocus value={gid} onChange={(e) => setGid(e.target.value.toUpperCase())} placeholder="GH-XXXXXX"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-fuchsia-400/50 text-lg font-mono tracking-widest text-center" />
        {msg && <div className="mt-3 text-xs text-rose-300 bg-rose-500/10 rounded-lg px-3 py-2 text-center">{msg}</div>}
        {ok && <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2 text-center">Request sent ✓</div>}
        <button onClick={submit} disabled={!gid.trim()} className="mt-4 w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 font-semibold disabled:opacity-40">Send request</button>
      </motion.div>
    </motion.div>
  );
}

// ============ Simulated FaceTime Call ============
function CallOverlay({ me, peer, video, onEnd }: { me: Profile; peer: Profile; video: boolean; onEnd: () => void }) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cam, setCam] = useState(video);
  const [share, setShare] = useState(false);
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setConnected(true), 1600);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setT((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#0b0716] via-[#1a0a2a] to-[#050308]">
        {/* peer tile */}
        <div className={`absolute inset-0 flex items-center justify-center transition ${cam && connected ? "opacity-100" : "opacity-70"}`}>
          <div className={`h-40 w-40 rounded-full bg-gradient-to-br ${peer.avatar_gradient} flex items-center justify-center text-7xl ring-2 ring-white/10 shadow-2xl`}>
            {peer.avatar_emoji}
          </div>
        </div>
        <div className="absolute top-8 left-0 right-0 text-center">
          <div className="text-2xl font-bold">{peer.display_name}</div>
          <div className="text-sm text-white/60 font-mono mt-1">
            {connected ? (video ? "FaceTime Video" : "FaceTime Audio") : "Connecting…"}
          </div>
          {connected && <div className="text-xs text-white/40 mt-1 font-mono">{mm}:{ss}</div>}
        </div>
        {/* self tile */}
        <motion.div drag dragMomentum={false}
          initial={{ x: 0, y: 0 }}
          className="absolute top-6 right-6 h-32 w-24 rounded-2xl bg-gradient-to-br from-black to-zinc-900 ring-1 ring-white/10 flex items-center justify-center cursor-move shadow-xl">
          <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${me.avatar_gradient} flex items-center justify-center text-2xl`}>{me.avatar_emoji}</div>
        </motion.div>
        {share && (
          <div className="absolute bottom-24 left-6 right-6 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/50 font-mono">
            <MonitorUp className="h-4 w-4 mr-2" /> Screen sharing active
          </div>
        )}
      </div>
      <div className="p-6 flex items-center justify-center gap-4 bg-black/60 backdrop-blur-xl">
        <CallBtn active={muted} onClick={() => setMuted((s) => !s)} icon={muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />} />
        <CallBtn active={!cam} onClick={() => setCam((s) => !s)} icon={cam ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />} />
        <CallBtn active={share} onClick={() => setShare((s) => !s)} icon={<MonitorUp className="h-5 w-5" />} />
        <button onClick={onEnd} className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition">
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}

function CallBtn({ icon, active, onClick }: { icon: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={`h-14 w-14 rounded-full flex items-center justify-center transition ${active ? "bg-white text-black" : "bg-white/10 hover:bg-white/20 text-white"}`}>
      {icon}
    </button>
  );
}
