import { useEffect, useState, type ReactNode } from "react";
import { RotateCw, ExternalLink, Maximize } from "lucide-react";
import { useGhost } from "../store";
import type { AppId } from "../apps";

/** Real connection reading from the browser (Network Information API), when available. */
export function useConnection() {
  const [info, setInfo] = useState<{ downlink?: number; type?: string; online: boolean }>({ online: true });
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { downlink?: number; effectiveType?: string; addEventListener?: (e: string, f: () => void) => void; removeEventListener?: (e: string, f: () => void) => void } }).connection;
    const read = () => setInfo({ downlink: c?.downlink, type: c?.effectiveType, online: navigator.onLine });
    read();
    c?.addEventListener?.("change", read);
    window.addEventListener("online", read);
    window.addEventListener("offline", read);
    return () => { c?.removeEventListener?.("change", read); window.removeEventListener("online", read); window.removeEventListener("offline", read); };
  }, []);
  return info;
}

interface Props {
  appId: AppId;
  title: string;
  subtitle?: string;
  src: string | null;
  /** Shown over the frame until it reports loaded. */
  loading?: ReactNode;
  /** Extra overlay (e.g. slow warning) rendered while loading. */
  slowAfterMs?: number;
  slowMessage?: string;
  onReload?: () => void;
  externalUrl?: string;
}

export function EmbedShell({ appId, title, subtitle, src, loading, slowAfterMs = 20000, slowMessage, onReload, externalUrl }: Props) {
  const { windows, toggleFullscreen } = useGhost();
  const me = windows.find((w) => w.appId === appId);
  const [key, setKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setReady(false); setSlow(false);
    const t = setTimeout(() => setSlow(true), slowAfterMs);
    return () => clearTimeout(t);
  }, [key, src, slowAfterMs]);

  const reload = () => { onReload?.(); setKey((k) => k + 1); };

  return (
    <div className="h-full flex flex-col bg-[#0B0B0D] text-white">
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.08] bg-[#141416] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium tracking-tight truncate">{title}</span>
          {subtitle && <span className="text-[10px] text-white/35 font-mono truncate">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reload} title="Reload" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><RotateCw className="h-3.5 w-3.5" /></button>
          {externalUrl && <button onClick={() => window.open(externalUrl, "_blank")} title="Open in new tab" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><ExternalLink className="h-3.5 w-3.5" /></button>}
          {me && <button onClick={() => toggleFullscreen(me.id)} title="Fullscreen" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><Maximize className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
      <div className="flex-1 relative bg-black">
        {src && (
          <iframe
            key={key}
            src={src}
            title={title}
            onLoad={() => setReady(true)}
            className="absolute inset-0 w-full h-full bg-black"
            allow="autoplay; fullscreen; gamepad; pointer-lock; clipboard-read; clipboard-write; encrypted-media; microphone; camera"
            allowFullScreen
          />
        )}
        {(!ready || !src) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0D] text-center px-8">
            {loading ?? <GhostSpinner label={`Starting ${title}…`} />}
            {slow && (
              <div className="mt-6 max-w-sm">
                <div className="text-[12px] text-white/55">{slowMessage ?? "This is taking longer than usual."}</div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button onClick={reload} className="px-3.5 py-2 rounded-lg text-[12px] bg-white/10 hover:bg-white/15">Retry</button>
                  {externalUrl && <button onClick={() => window.open(externalUrl, "_blank")} className="px-3.5 py-2 rounded-lg text-[12px] text-white/70 ring-1 ring-white/10 hover:bg-white/5">Open in new tab</button>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function GhostSpinner({ label, detail, progress }: { label: string; detail?: string; progress?: number }) {
  return (
    <>
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--ice,#66D9FF)] animate-spin" />
        <div className="absolute inset-[14px] rounded-full bg-white/80 animate-ghost-pulse" />
      </div>
      <div className="mt-5 text-[11px] uppercase tracking-[0.35em] text-white/70">{label}</div>
      {detail && <div className="mt-1.5 text-[10px] text-white/35 font-mono">{detail}</div>}
      {progress !== undefined && (
        <div className="mt-4 h-[3px] w-56 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-white/80 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </>
  );
}
