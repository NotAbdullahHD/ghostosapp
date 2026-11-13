import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGhost } from "../store";

export function BrowserApp() {
  const { settings } = useGhost();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    setLoaded(false); setFailed(false);
    const timer = window.setTimeout(() => setFailed(true), 20000);
    return () => clearTimeout(timer);
  }, [reloadKey]);
  const browserUrl = `/spectre/index.html?engine=${settings.searchEngine}&proxy=${settings.proxyProvider}&newtab=${settings.newTab}&home=${encodeURIComponent(settings.homepage)}`;
  return <div className="relative h-full overflow-hidden bg-background text-foreground">
    <iframe key={reloadKey} src={browserUrl} title="Ghost Browser" onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => setFailed(true)} className="h-full w-full border-0" allow="autoplay; fullscreen; clipboard-write; encrypted-media; gamepad" referrerPolicy="no-referrer" />
    {!loaded && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground" role="status">{failed ? "Browser couldn’t start." : "Opening browser…"}{failed && <Button variant="secondary" onClick={() => setReloadKey(k => k + 1)}><RotateCw />Retry</Button>}</div>}
  </div>;
}
