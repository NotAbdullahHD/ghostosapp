import { useEffect, useState } from "react";
import { MINECRAFT_URL } from "../storeCatalog";
import { EmbedShell, GhostSpinner } from "./EmbedShell";

/**
 * The packaged client is fetched and mounted as an in-memory HTML document, so
 * the browser runs it instead of treating it as a download.
 */
let cached: string | null = null;

export function MinecraftApp() {
  const [src, setSrc] = useState<string | null>(cached);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    setError(false); setProgress(0);
    (async () => {
      try {
        const res = await fetch(MINECRAFT_URL);
        if (!res.ok) throw new Error(String(res.status));
        const timer = setInterval(() => { if (!cancelled) setProgress((p) => Math.min(0.92, p + 0.04)); }, 300);
        const blob = await res.blob().finally(() => clearInterval(timer));
        if (!cancelled) setProgress(1);
        cached = URL.createObjectURL(new Blob([blob], { type: "text/html" }));
        if (!cancelled) setSrc(cached);
      } catch {
        // Large download: retry automatically a couple of times before showing the error.
        if (!cancelled && attempt < 2) setTimeout(() => setAttempt((a) => a + 1), 800);
        else if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  return (
    <EmbedShell
      appId="minecraft"
      title="Minecraft"
      subtitle="1.8 · u53"
      src={src}
      slowAfterMs={error ? 0 : 60000}
      slowMessage={error ? "Minecraft couldn't be unpacked. Check your connection and retry." : undefined}
      onReload={() => { if (!src) setAttempt((a) => a + 1); }}
      loading={<GhostSpinner label={src ? "Starting Minecraft" : "Unpacking Minecraft"} detail={src ? "launching client" : "18 MB client"} progress={src ? 1 : progress} />}
    />
  );
}
