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
        if (!res.ok || !res.body) throw new Error(String(res.status));
        const total = Number(res.headers.get("content-length")) || 18002822;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); got += value.length;
          if (!cancelled) setProgress(Math.min(1, got / total));
        }
        cached = URL.createObjectURL(new Blob(chunks, { type: "text/html" }));
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
      loading={<GhostSpinner label={src ? "Starting Minecraft" : "Unpacking Minecraft"} detail={src ? "launching client" : `${Math.round(progress * 18)} / 18 MB`} progress={src ? 1 : progress} />}
    />
  );
}
