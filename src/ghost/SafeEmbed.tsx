import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, RotateCw } from "lucide-react";
import { proxify, resolveInput } from "./proxy";

type Mode = "direct" | "proxy";
type Status = "loading" | "ready" | "error";

const DIRECT_TIMEOUT = 9_000;
const PROXY_TIMEOUT = 14_000;

export interface SafeEmbedProps {
  /** Raw URL or domain — sanitized before use. */
  url: string;
  title: string;
  /** Force proxy mode from the start (e.g. mixed content / known blocked). */
  forceProxy?: boolean;
  /** Called when user clicks "Back to Desktop" — usually closes/exits the app view. */
  onBack?: () => void;
  className?: string;
  sandbox?: string;
  allow?: string;
  /** Accent color classes for spinner/glow (default fuchsia). */
  accent?: string;
  /** Optional label shown under spinner. */
  loadingLabel?: string;
}

/** Sanitize a user/provider URL. Returns null if it can't be made into a valid http(s) URL. */
export function sanitizeUrl(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  try {
    const resolved = /^[a-z][a-z0-9+\-.]*:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(resolved);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.host || !u.host.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Hardened iframe with:
 *  - URL validation/sanitization
 *  - direct → proxy auto-fallback
 *  - timeout detection
 *  - cinematic GhostOS error UI (Retry / Reload Source / Open in Tab / Back)
 */
export function SafeEmbed({
  url, title, forceProxy, onBack,
  className = "w-full h-full bg-black",
  sandbox = "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups allow-popups-to-escape-sandbox",
  allow = "autoplay; fullscreen; gamepad; clipboard-write; encrypted-media; picture-in-picture",
  accent = "fuchsia",
  loadingLabel,
}: SafeEmbedProps) {
  const sanitized = sanitizeUrl(url);
  const initialMode: Mode = forceProxy || (sanitized && new URL(sanitized).protocol === "http:" && (typeof window !== "undefined" && window.location.protocol === "https:")) ? "proxy" : "direct";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [status, setStatus] = useState<Status>(sanitized ? "loading" : "error");
  const [errorMsg, setErrorMsg] = useState<string | null>(
    sanitized ? null : "The source URL is invalid or malformed."
  );
  const [reloadKey, setReloadKey] = useState(0);
  const triedProxyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const src = sanitized ? (mode === "proxy" ? proxify(sanitized) : sanitized) : "";

  const clearTimer = () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };

  // Reset when url/mode/reload changes.
  useEffect(() => {
    if (!sanitized) return;
    setStatus("loading");
    setErrorMsg(null);
    clearTimer();
    const limit = mode === "proxy" ? PROXY_TIMEOUT : DIRECT_TIMEOUT;
    timerRef.current = setTimeout(() => {
      if (mode === "direct" && !triedProxyRef.current) {
        triedProxyRef.current = true;
        setMode("proxy");
      } else {
        setStatus("error");
        setErrorMsg("Source did not respond in time. It may be blocked, offline, or restricted.");
      }
    }, limit);
    return clearTimer;
  }, [sanitized, mode, reloadKey]);

  const handleLoad = useCallback(() => {
    clearTimer();
    setStatus("ready");
  }, []);

  const handleError = useCallback(() => {
    clearTimer();
    if (mode === "direct" && !triedProxyRef.current) {
      triedProxyRef.current = true;
      setMode("proxy");
    } else {
      setStatus("error");
      setErrorMsg("The embedded source failed to load.");
    }
  }, [mode]);

  const retry = () => {
    triedProxyRef.current = false;
    setMode(initialMode);
    setReloadKey((k) => k + 1);
  };
  const reloadSource = () => setReloadKey((k) => k + 1);
  const openInTab = () => { if (sanitized) window.open(sanitized, "_blank", "noopener,noreferrer"); };

  const accentMap: Record<string, { text: string; ring: string; glow: string; from: string; to: string }> = {
    fuchsia: { text: "text-fuchsia-300", ring: "ring-fuchsia-400/40", glow: "shadow-[0_0_30px_rgba(232,121,249,.45)]", from: "from-fuchsia-500", to: "to-violet-600" },
    red:     { text: "text-rose-300",    ring: "ring-rose-400/40",    glow: "shadow-[0_0_30px_rgba(244,63,94,.45)]",    from: "from-red-500",    to: "to-rose-700" },
    cyan:    { text: "text-cyan-300",    ring: "ring-cyan-400/40",    glow: "shadow-[0_0_30px_rgba(34,211,238,.45)]",   from: "from-cyan-500",   to: "to-blue-700" },
  };
  const A = accentMap[accent] ?? accentMap.fuchsia;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {sanitized && (
        <iframe
          key={`${mode}-${reloadKey}`}
          src={src}
          title={title}
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          sandbox={sandbox}
          allow={allow}
          referrerPolicy="no-referrer"
        />
      )}

      <AnimatePresence>
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <motion.div
                className={`absolute inset-0 rounded-full border-t-2 ${accent === "red" ? "border-rose-400" : accent === "cyan" ? "border-cyan-400" : "border-fuchsia-400"}`}
                animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className={`mt-5 text-[10px] tracking-[0.5em] font-mono ${A.text}`}>
              {loadingLabel ?? `ROUTING ${title.toUpperCase()}…`}
            </div>
            <div className="mt-1 text-[9px] font-mono text-white/40">
              {mode === "proxy" ? "VIA NET22 RELAY" : "DIRECT CONNECTION"}
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
          >
            <div className={`relative max-w-md w-full rounded-2xl bg-gradient-to-br from-black via-zinc-950 to-black ring-1 ${A.ring} ${A.glow} p-7 text-center`}>
              <div className={`mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br ${A.from} ${A.to} flex items-center justify-center ring-1 ring-white/15`}>
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div className={`mt-5 text-[10px] tracking-[0.5em] font-mono ${A.text}`}>CONNECTION FAILED</div>
              <h3 className="mt-1 text-xl font-black tracking-wide text-white">{title}</h3>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                {errorMsg ?? "We couldn't reach this source through GhostOS."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={retry} className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r ${A.from} ${A.to} text-white text-xs font-bold tracking-wider hover:brightness-110 transition`}>
                  <RotateCw className="h-3.5 w-3.5" /> RETRY
                </button>
                <button onClick={reloadSource} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white text-xs font-bold tracking-wider hover:bg-white/10 transition">
                  <Loader2 className="h-3.5 w-3.5" /> RELOAD SOURCE
                </button>
                <button onClick={openInTab} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white text-xs font-bold tracking-wider hover:bg-white/10 transition">
                  <ExternalLink className="h-3.5 w-3.5" /> OPEN IN TAB
                </button>
                <button onClick={onBack} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 ring-1 ring-white/15 text-white/80 text-xs font-bold tracking-wider hover:bg-white/10 transition">
                  <ArrowLeft className="h-3.5 w-3.5" /> BACK TO DESKTOP
                </button>
              </div>
              <div className="mt-4 text-[9px] font-mono text-white/30 tracking-widest">
                MODE: {mode.toUpperCase()} · GHOSTOS RELAY
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Keep resolveInput re-export so call sites can sanitize first.
export { resolveInput };
