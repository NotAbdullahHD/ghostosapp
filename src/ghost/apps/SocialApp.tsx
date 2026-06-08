import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ExternalLink, Loader2, Maximize2, RotateCw, Wifi } from "lucide-react";

// Route social apps through the local Spectre (Ultraviolet) relay so they bypass
// school / network filters the same way the Browser app does.
const spectreEmbed = (url: string) =>
  `/spectre/index.html?chrome=mini&url=${encodeURIComponent(url)}`;

interface SocialConfig {
  id: string;
  name: string;
  tagline: string;
  url: string;
  accent: string;
  glow: string;
  logo: string;
}

const CONFIGS: Record<"x" | "tiktok" | "pinterest", SocialConfig> = {
  x: {
    id: "x", name: "X", tagline: "Realtime signal feed",
    url: "https://twitter.com/explore",
    accent: "from-zinc-700 via-black to-black",
    glow: "rgba(255,255,255,.4)",
    logo: "𝕏",
  },
  tiktok: {
    id: "tiktok", name: "TikTok", tagline: "Looping the algorithm",
    url: "https://www.tiktok.com/explore",
    accent: "from-pink-500 via-fuchsia-600 to-cyan-500",
    glow: "rgba(236,72,153,.5)",
    logo: "♫",
  },
  pinterest: {
    id: "pinterest", name: "Pinterest", tagline: "Visual mood archive",
    url: "https://www.pinterest.com",
    accent: "from-rose-500 via-red-600 to-red-800",
    glow: "rgba(244,63,94,.5)",
    logo: "◔",
  },
};

export function SocialApp({ kind }: { kind: "x" | "tiktok" | "pinterest" }) {
  const cfg = CONFIGS[kind];
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => { setLoaded(false); setFailed(false); setReloadKey((k) => k + 1); };

  return (
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 glass-strong border-b border-white/10 relative">
        <div className="flex items-center gap-3">
          <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${cfg.accent} flex items-center justify-center text-sm font-bold ring-1 ring-white/20`}
            style={{ boxShadow: `0 0 18px ${cfg.glow}` }}>
            {cfg.logo}
          </div>
          <div>
            <div className="text-xs font-bold tracking-widest neon-text">{cfg.name.toUpperCase()}</div>
            <div className="text-[9px] font-mono text-white/40 tracking-[0.3em]">{cfg.tagline.toUpperCase()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-white/50 text-xs">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ghost-pulse shadow-[0_0_8px_rgba(74,222,128,.9)]" />
            STREAMING
          </span>
          <button onClick={retry} className="hover:text-white transition"><RotateCw className="h-3.5 w-3.5" /></button>
          <a href={cfg.url} target="_blank" rel="noreferrer" className="hover:text-white transition"><ExternalLink className="h-3.5 w-3.5" /></a>
          <Wifi className="h-3.5 w-3.5" />
          <Maximize2 className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="relative flex-1 bg-black">
        <AnimatePresence>
          {!loaded && !failed && (
            <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`h-24 w-24 rounded-3xl bg-gradient-to-br ${cfg.accent} flex items-center justify-center text-4xl font-bold ring-1 ring-white/20`}
                style={{ boxShadow: `0 0 60px ${cfg.glow}` }}>
                {cfg.logo}
              </motion.div>
              <motion.div animate={{ scale: [1, 1.45], opacity: [0.6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}
                className={`absolute h-24 w-24 rounded-3xl ring-2 ring-white/40`} />
              <div className="mt-8 text-2xl font-black neon-text tracking-[0.3em]">{cfg.name.toUpperCase()}</div>
              <div className="mt-2 text-[10px] tracking-[0.5em] text-white/50 font-mono flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" /> ROUTING THROUGH GHOSTNET…
              </div>
              <div className="mt-6 w-64 h-[3px] bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                  className={`h-full w-1/2 bg-gradient-to-r ${cfg.accent}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <iframe
          key={reloadKey}
          src={proxify(cfg.url)}
          title={cfg.name}
          onLoad={() => setLoaded(true)}
          className="w-full h-full bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads"
          allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
        />
        {failed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 text-center px-6">
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${cfg.accent} flex items-center justify-center ring-1 ring-white/20`}>
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <div className="mt-5 text-xl font-black neon-text tracking-[0.3em]">SIGNAL LOST</div>
            <div className="mt-2 text-xs text-white/60 max-w-sm">The relay couldn't reach {cfg.name}. Retry the handshake or open externally.</div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={retry} className="px-4 py-1.5 rounded-full gradient-neon text-xs font-mono flex items-center gap-1.5"><RotateCw className="h-3 w-3" /> RETRY</button>
              <a href={cfg.url} target="_blank" rel="noreferrer" className="px-4 py-1.5 rounded-full glass text-xs font-mono hover:bg-white/10">Open externally</a>
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent" />
      </div>
    </div>
  );
}
