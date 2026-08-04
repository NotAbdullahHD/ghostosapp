import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MINECRAFT_URL } from "../storeCatalog";
import { useGhost } from "../store";
import { RotateCw, Maximize, ExternalLink } from "lucide-react";

export function MinecraftApp() {
  const { windows, toggleFullscreen } = useGhost();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [key, setKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const me = windows.find((w) => w.appId === "minecraft");

  const reload = useCallback(() => {
    setState("loading");
    setKey((k) => k + 1);
  }, []);

  const onLoad = () => {
    if (timer.current) clearTimeout(timer.current);
    setState("ready");
  };

  return (
    <div className="h-full flex flex-col bg-[#0B0B0D] text-white">
      <div className="flex items-center justify-between px-3 h-10 border-b border-white/[0.08] bg-[#141416]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-medium tracking-tight truncate">Minecraft</span>
          <span className="text-[10px] text-white/35 font-mono">1.8 · u53</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reload} title="Reload" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><RotateCw className="h-3.5 w-3.5" /></button>
          <button onClick={() => window.open(MINECRAFT_URL, "_blank")} title="Open in new tab" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><ExternalLink className="h-3.5 w-3.5" /></button>
          {me && (
            <button onClick={() => toggleFullscreen(me.id)} title="Fullscreen" className="p-1.5 rounded-md hover:bg-white/[0.07] text-white/60"><Maximize className="h-3.5 w-3.5" /></button>
          )}
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <AnimatePresence>
          {state === "loading" && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0D]">
              <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#66D9FF] animate-spin" />
              <div className="mt-4 text-[12px] text-white/55">Starting Minecraft…</div>
              <div className="mt-1 text-[10px] text-white/25 font-mono">unpacking client · 18 MB</div>
            </motion.div>
          )}
          {state === "error" && (
            <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0D] text-center px-8">
              <div className="text-[15px] font-medium">Minecraft couldn’t start</div>
              <div className="mt-1.5 text-[12px] text-white/45 max-w-sm">The client failed to load. Reload it, or open it in a dedicated tab.</div>
              <div className="mt-5 flex items-center gap-2">
                <button onClick={reload} className="px-3.5 py-2 rounded-lg text-[12px] bg-[#66D9FF]/15 text-[#66D9FF] ring-1 ring-[#66D9FF]/30 hover:bg-[#66D9FF]/25">Retry</button>
                <button onClick={() => window.open(MINECRAFT_URL, "_blank")} className="px-3.5 py-2 rounded-lg text-[12px] text-white/70 ring-1 ring-white/10 hover:bg-white/5">Open in new tab</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <iframe
          key={key}
          src={MINECRAFT_URL}
          title="Minecraft"
          onLoad={onLoad}
          onError={() => setState("error")}
          className="absolute inset-0 w-full h-full bg-black"
          allow="autoplay; fullscreen; gamepad; pointer-lock; clipboard-write"
        />
      </div>
    </div>
  );
}
