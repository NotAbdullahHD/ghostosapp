import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Upload, QrCode, Users, History, Send, Smartphone, Wifi,
  CheckCircle2, Loader2, Copy, ExternalLink, Trash2, Image as ImageIcon,
  FileText, Film, Music as MusicIcon, Archive, File as FileIcon, Radio,
} from "lucide-react";
import QRCode from "qrcode";
import { useGhost } from "./store";
import { supabase } from "@/integrations/supabase/client";

// ---------------- Types ----------------
type Phase = "queued" | "preparing" | "encrypting" | "uploading" | "ready" | "failed";
type Direction = "sent" | "received";
interface DropItem {
  id: string;
  name: string;
  size: number;
  type: string;
  phase: Phase;
  progress: number;      // 0..100
  speed: number;         // bytes/sec (simulated)
  url?: string;          // signed URL
  qr?: string;           // dataURL of QR
  createdAt: number;
  expiresAt?: number;
  direction: Direction;
  error?: string;
  path?: string;         // storage path (for cleanup)
}

const HISTORY_LS = "ghostdrop.history";
const EXPIRE_MS = 10 * 60 * 1000; // 10 min signed URL

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
function fmtTimeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function iconFor(type: string, name: string) {
  const t = type.toLowerCase();
  if (t.startsWith("image/")) return <ImageIcon className="h-5 w-5" />;
  if (t.startsWith("video/")) return <Film className="h-5 w-5" />;
  if (t.startsWith("audio/")) return <MusicIcon className="h-5 w-5" />;
  if (t.includes("pdf") || name.endsWith(".pdf")) return <FileText className="h-5 w-5" />;
  if (t.includes("zip") || name.match(/\.(zip|rar|7z|tar|gz)$/i)) return <Archive className="h-5 w-5" />;
  if (t.startsWith("text/") || name.match(/\.(txt|md|json|csv|log)$/i)) return <FileText className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
}
function phaseLabel(p: Phase) {
  return {
    queued: "Queued",
    preparing: "Preparing file…",
    encrypting: "Encrypting…",
    uploading: "Sending…",
    ready: "Ready to share",
    failed: "Transfer failed",
  }[p];
}

// ---------------- Root panel ----------------
export function GhostDrop() {
  const { showGhostDrop, closeGhostDrop, pendingDropFiles, clearPendingDropFiles, pushNotification } = useGhost();
  const [tab, setTab] = useState<"send" | "devices" | "history">("send");
  const [items, setItems] = useState<DropItem[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_LS);
      return raw ? (JSON.parse(raw) as DropItem[]) : [];
    } catch { return []; }
  });
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeUploads = useRef<Record<string, boolean>>({});

  // Persist history
  useEffect(() => {
    try {
      const persistable = items.map((i) => ({ ...i, qr: undefined })).slice(0, 40);
      localStorage.setItem(HISTORY_LS, JSON.stringify(persistable));
    } catch { /* ignore */ }
  }, [items]);

  const uploadOne = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item: DropItem = {
      id, name: file.name, size: file.size, type: file.type || "application/octet-stream",
      phase: "preparing", progress: 0, speed: 0, direction: "sent", createdAt: Date.now(),
    };
    setItems((arr) => [item, ...arr]);
    activeUploads.current[id] = true;

    // Cinematic phase animation
    const setPatch = (patch: Partial<DropItem>) =>
      setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    await new Promise((r) => setTimeout(r, 500));
    setPatch({ phase: "encrypting", progress: 15 });
    await new Promise((r) => setTimeout(r, 700));
    setPatch({ phase: "uploading", progress: 25 });

    // Simulated progress ticker (real upload progress isn't exposed by supabase-js)
    let p = 25;
    const startedAt = Date.now();
    const ticker = setInterval(() => {
      if (!activeUploads.current[id]) return;
      p = Math.min(90, p + 4 + Math.random() * 4);
      const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
      const speed = (file.size * (p / 100)) / elapsed;
      setPatch({ progress: p, speed });
    }, 220);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) throw new Error("Sign in to GhostChat to use GhostDrop");
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${uid}/${id}-${safe}`;
      const { error: upErr } = await supabase.storage.from("ghostdrop").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("ghostdrop").createSignedUrl(path, EXPIRE_MS / 1000);
      if (sErr || !signed) throw sErr || new Error("Failed to sign URL");
      const url = signed.signedUrl;
      const qr = await QRCode.toDataURL(url, {
        width: 320, margin: 1,
        color: { dark: "#f5d0fe", light: "#00000000" },
        errorCorrectionLevel: "M",
      });
      clearInterval(ticker);
      activeUploads.current[id] = false;
      setPatch({
        phase: "ready", progress: 100, url, qr, path,
        expiresAt: Date.now() + EXPIRE_MS,
      });
      pushNotification({ title: "QR Code Ready", body: `${file.name} · scan to download` });
    } catch (e) {
      clearInterval(ticker);
      activeUploads.current[id] = false;
      setPatch({ phase: "failed", error: (e as Error).message, progress: 100 });
      pushNotification({ title: "Transfer Failed", body: (e as Error).message });
    }
  }, [pushNotification]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setTab("send");
    arr.forEach((f) => uploadOne(f));
  }, [uploadOne]);

  // Pick up files handed off from context-menu / other apps
  useEffect(() => {
    if (showGhostDrop && pendingDropFiles.length) {
      handleFiles(pendingDropFiles);
      clearPendingDropFiles();
    }
  }, [showGhostDrop, pendingDropFiles, handleFiles, clearPendingDropFiles]);

  // Close on Escape
  useEffect(() => {
    if (!showGhostDrop) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeGhostDrop(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showGhostDrop, closeGhostDrop]);

  const removeItem = (id: string) => {
    const it = items.find((x) => x.id === id);
    setItems((arr) => arr.filter((x) => x.id !== id));
    if (it?.path) supabase.storage.from("ghostdrop").remove([it.path]).catch(() => {});
  };
  const clearAll = () => {
    const paths = items.filter((i) => i.path).map((i) => i.path!) as string[];
    setItems([]);
    if (paths.length) supabase.storage.from("ghostdrop").remove(paths).catch(() => {});
  };

  const recent = useMemo(() => items.slice(0, 5), [items]);
  const ready = useMemo(() => items.filter((i) => i.phase === "ready"), [items]);

  return (
    <AnimatePresence>
      {showGhostDrop && (
        <>
          <motion.div
            className="fixed inset-0 z-[820] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeGhostDrop}
          />
          <motion.aside
            className="fixed top-3 right-3 bottom-3 w-[420px] z-[830] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, rgba(20,10,35,0.92), rgba(10,5,20,0.94))",
              backdropFilter: "blur(28px)",
              border: "1px solid rgba(232,121,249,0.18)",
              boxShadow: "0 40px 120px -20px rgba(0,0,0,.9), 0 0 80px -30px rgba(168,85,247,.5)",
            }}
            initial={{ x: 440, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 440, opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-600 flex items-center justify-center ring-1 ring-white/10 shadow-[0_10px_30px_-8px_rgba(168,85,247,0.6)]">
                    <Radio className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-base font-bold tracking-tight">GhostDrop</div>
                    <div className="text-[10px] font-mono tracking-widest text-fuchsia-300/70">SPECTRAL TRANSFER</div>
                  </div>
                </div>
                <button onClick={closeGhostDrop}
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/5">
                <TabBtn active={tab === "send"} onClick={() => setTab("send")} icon={<Upload className="h-3.5 w-3.5" />} label="Send" />
                <TabBtn active={tab === "devices"} onClick={() => setTab("devices")} icon={<Users className="h-3.5 w-3.5" />} label="Nearby" />
                <TabBtn active={tab === "history"} onClick={() => setTab("history")} icon={<History className="h-3.5 w-3.5" />} label="History" />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-4">
              {tab === "send" && (
                <>
                  {/* Drop zone */}
                  <motion.div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => inputRef.current?.click()}
                    animate={{
                      borderColor: dragOver ? "rgba(232,121,249,.9)" : "rgba(255,255,255,.1)",
                      boxShadow: dragOver
                        ? "0 0 60px -10px rgba(232,121,249,.6), inset 0 0 40px rgba(168,85,247,.15)"
                        : "0 0 0 rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="relative cursor-pointer rounded-2xl border border-dashed p-6 text-center bg-gradient-to-br from-fuchsia-500/5 to-violet-500/5"
                  >
                    <input ref={inputRef} type="file" multiple hidden
                      onChange={(e) => e.target.files && handleFiles(e.target.files)} />
                    <motion.div
                      animate={dragOver ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(232,121,249,.7)]"
                    >
                      <Upload className="h-6 w-6" />
                    </motion.div>
                    <div className="mt-3 text-sm font-semibold">
                      {dragOver ? "Release to drop into GhostDrop" : "Drop files here or click to browse"}
                    </div>
                    <div className="text-[11px] text-white/50 mt-1">
                      Images · Video · Audio · PDFs · Zips · Anything
                    </div>
                  </motion.div>

                  {/* Active transfers */}
                  {items.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] font-mono tracking-[0.3em] text-white/50">TRANSFERS</div>
                        {items.length > 3 && (
                          <button onClick={clearAll} className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Clear
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {items.slice(0, 8).map((it) => (
                          <TransferRow key={it.id} item={it} onRemove={() => removeItem(it.id)} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Featured QR of last ready */}
                  {ready[0] && <QRShowcase item={ready[0]} />}
                </>
              )}

              {tab === "devices" && <DevicesTab />}

              {tab === "history" && (
                <>
                  <div className="flex items-center justify-between px-1">
                    <div className="text-[10px] font-mono tracking-[0.3em] text-white/50">RECENT TRANSFERS</div>
                    {items.length > 0 && (
                      <button onClick={clearAll} className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> Clear all
                      </button>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-center py-10 text-xs text-white/40">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No transfers yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((it) => (
                        <HistoryRow key={it.id} item={it} onRemove={() => removeItem(it.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/50">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)] animate-pulse" />
                GHOSTNET · READY
              </div>
              <div>{recent.length} recent · {ready.length} ready</div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------- Sub-components ----------------
function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="relative py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 text-white/70 hover:text-white transition">
      {active && (
        <motion.div layoutId="ghostdrop-tab" className="absolute inset-0 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-violet-600/20 ring-1 ring-fuchsia-400/40" />
      )}
      <span className="relative flex items-center gap-1.5">{icon}{label}</span>
    </button>
  );
}

function TransferRow({ item, onRemove }: { item: DropItem; onRemove: () => void }) {
  const active = item.phase !== "ready" && item.phase !== "failed";
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
      className="relative rounded-2xl bg-white/[0.04] border border-white/5 p-3 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
          item.phase === "ready" ? "bg-emerald-500/15 text-emerald-300" :
          item.phase === "failed" ? "bg-rose-500/15 text-rose-300" :
          "bg-fuchsia-500/15 text-fuchsia-300"
        }`}>
          {iconFor(item.type, item.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{item.name}</div>
          <div className="text-[10px] text-white/50 font-mono flex items-center gap-2">
            <span>{fmtBytes(item.size)}</span>
            <span>·</span>
            <span className={item.phase === "failed" ? "text-rose-300" : item.phase === "ready" ? "text-emerald-300" : "text-fuchsia-300"}>
              {phaseLabel(item.phase)}
            </span>
            {active && item.speed > 0 && <><span>·</span><span>{fmtBytes(item.speed)}/s</span></>}
          </div>
        </div>
        {item.phase === "ready" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
        {active && <Loader2 className="h-4 w-4 text-fuchsia-300 animate-spin" />}
        <button onClick={onRemove} className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${item.progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`h-full ${
            item.phase === "failed" ? "bg-rose-500" :
            item.phase === "ready"  ? "bg-gradient-to-r from-emerald-400 to-teal-400" :
            "bg-gradient-to-r from-fuchsia-400 via-violet-500 to-blue-500"
          }`}
        />
      </div>
      {item.error && <div className="mt-2 text-[10px] text-rose-300">{item.error}</div>}
    </motion.div>
  );
}

function QRShowcase({ item }: { item: DropItem }) {
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(() =>
    item.expiresAt ? Math.max(0, item.expiresAt - Date.now()) : 0
  );
  useEffect(() => {
    if (!item.expiresAt) return;
    const t = setInterval(() => setRemaining(Math.max(0, (item.expiresAt || 0) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [item.expiresAt]);
  const min = Math.floor(remaining / 60000);
  const sec = Math.floor((remaining % 60000) / 1000);
  const copy = async () => {
    if (!item.url) return;
    try { await navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-blue-500/10 border border-fuchsia-400/20">
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-4 w-4 text-fuchsia-300" />
        <div className="text-xs font-semibold">Scan with your phone</div>
        {remaining > 0 && (
          <div className="ml-auto text-[10px] font-mono text-white/50">
            expires in {min}:{String(sec).padStart(2, "0")}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center py-3">
        {item.qr ? (
          <motion.img
            src={item.qr} alt="QR"
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="h-44 w-44 rounded-xl bg-black/40 p-2 ring-1 ring-white/10"
          />
        ) : (
          <div className="h-44 w-44 rounded-xl bg-black/40 animate-pulse" />
        )}
      </div>
      <div className="text-[11px] text-center text-white/60 mb-3">
        <span className="font-semibold text-white/80">{item.name}</span> · {fmtBytes(item.size)}
      </div>
      <div className="flex gap-2">
        <button onClick={copy}
          className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs flex items-center justify-center gap-1.5">
          <Copy className="h-3 w-3" />{copied ? "Copied" : "Copy link"}
        </button>
        {item.url && (
          <a href={item.url} target="_blank" rel="noreferrer"
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-xs font-semibold flex items-center justify-center gap-1.5">
            <ExternalLink className="h-3 w-3" />Open
          </a>
        )}
      </div>
    </motion.div>
  );
}

function HistoryRow({ item, onRemove }: { item: DropItem; onRemove: () => void }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center text-white/70">
        {iconFor(item.type, item.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold truncate">{item.name}</div>
        <div className="text-[10px] font-mono text-white/40">
          {fmtBytes(item.size)} · {fmtTimeAgo(item.createdAt)} · {item.direction}
        </div>
      </div>
      <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
        item.phase === "ready" ? "bg-emerald-500/15 text-emerald-300" :
        item.phase === "failed" ? "bg-rose-500/15 text-rose-300" :
        "bg-fuchsia-500/15 text-fuchsia-300"
      }`}>{item.phase}</div>
      <button onClick={onRemove} className="h-7 w-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DevicesTab() {
  // Believable nearby-device UI (backend expandable later)
  const devices = [
    { name: "This GhostOS", kind: "desktop", status: "online", note: "You" },
    { name: "iPhone", kind: "phone", status: "scan-qr", note: "Use QR from Send tab" },
    { name: "Nearby (empty)", kind: "radar", status: "listening", note: "Broadcasting on GhostNet" },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4 bg-gradient-to-br from-fuchsia-500/10 to-blue-500/10 border border-white/5 text-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center shadow-[0_0_40px_rgba(232,121,249,.5)]"
        >
          <Wifi className="h-6 w-6" />
        </motion.div>
        <div className="mt-3 text-sm font-semibold">Scanning GhostNet…</div>
        <div className="text-[11px] text-white/50">Nearby devices will appear here.</div>
      </div>
      <div className="text-[10px] font-mono tracking-[0.3em] text-white/50 px-1">DEVICES</div>
      {devices.map((d) => (
        <div key={d.name} className="rounded-xl bg-white/5 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-fuchsia-300">
            {d.kind === "phone" ? <Smartphone className="h-4 w-4" /> :
             d.kind === "radar" ? <Radio className="h-4 w-4" /> :
             <Send className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">{d.name}</div>
            <div className="text-[10px] text-white/50">{d.note}</div>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            d.status === "online" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/50"
          }`}>{d.status}</span>
        </div>
      ))}
    </div>
  );
}
