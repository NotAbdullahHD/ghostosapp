import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPS, type AppId } from "./apps";
import { AppIcon } from "./AppIcon";
import { useGhost } from "./store";

export function AppLauncher() {
  const { showLauncher, toggleLauncher, openApp, installedApps } = useGhost();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => { try { setRecent(JSON.parse(localStorage.getItem("ghost.recentApps.v1") || "[]")); } catch {} }, []);
  useEffect(() => { if (!showLauncher) { setQuery(""); setSelected(0); } }, [showLauncher]);
  const apps = useMemo(() => [...APPS].filter(a => (!a.installable || installedApps[a.id]) && (a.name + " " + a.description).toLowerCase().includes(query.toLowerCase())).sort((a,b) => {
    const rank = (id:string) => { const index=recent.indexOf(id); return index<0 ? 999 : index; };
    return rank(a.id)-rank(b.id);
  }), [query, installedApps, recent]);
  const launch = (id: AppId, name: string) => {
    const next = [id, ...recent.filter(r=>r!==id)].slice(0,6); setRecent(next);
    try { localStorage.setItem("ghost.recentApps.v1",JSON.stringify(next)); } catch {}
    openApp(id,name); toggleLauncher();
  };
  return <AnimatePresence>{showLauncher && <motion.div role="dialog" aria-label="All apps" className="desktop-launcher fixed inset-0 z-[800] flex flex-col items-center justify-center px-6 py-16" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={toggleLauncher}>
    <Button variant="desktop" size="icon" title="Close apps" className="absolute right-5 top-12" onClick={toggleLauncher}><X/></Button>
    <div className="flex w-full max-w-[320px] items-center gap-3 border-b border-chrome-border mb-10 py-2" onClick={e=>e.stopPropagation()}>
      <Search className="h-4 w-4 text-chrome-muted"/>
      <input autoFocus aria-label="Search apps" placeholder="Search" className="w-full bg-transparent text-sm text-chrome-foreground outline-none placeholder:text-chrome-muted" value={query} onChange={e=>{setQuery(e.target.value);setSelected(0);}} onKeyDown={e=>{
        const n=apps.length; const columns=grid.current ? getComputedStyle(grid.current).gridTemplateColumns.split(" ").length : 5;
        if(e.key==="Escape"){e.preventDefault();toggleLauncher();}
        if(!n)return;
        if(e.key.startsWith("Arrow")){e.preventDefault(); const move=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:e.key==="ArrowDown"?columns:-columns;setSelected(s=>(s+move+n)%n);}
        if(e.key==="Enter"){e.preventDefault();const a=apps[selected];if(a)launch(a.id,a.name);}
      }}/>
    </div>
    <div ref={grid} className="desktop-launcher-grid w-full max-w-[680px] max-h-[65vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
      {apps.map((app,i)=><Button key={app.id} variant="desktop" className={`desktop-app-tile p-2 ${selected===i?"bg-chrome-hover":""}`} onMouseEnter={()=>setSelected(i)} onClick={()=>launch(app.id,app.name)}><AppIcon id={app.id} size={48}/><span>{app.name}</span></Button>)}
    </div>
    {!apps.length && <p className="text-sm text-chrome-muted">No matching apps</p>}
  </motion.div>}</AnimatePresence>;
}
