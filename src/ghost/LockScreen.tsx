import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGhost, WALLPAPERS } from "./store";
import { GhostLogo } from "./GhostLogo";
import { usePersonalization } from "./PersonalizationProvider";

export function LockScreen() {
  const { locked, setLocked, wallpaperId, wallpaper } = useGhost();
  const { customImage } = usePersonalization();
  const [now, setNow] = useState<Date | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wp = useMemo(() => WALLPAPERS.find(w => w.id === wallpaperId), [wallpaperId]);
  useEffect(() => { const tick = () => setNow(new Date()); tick(); const interval = setInterval(tick, 1000); return () => { clearInterval(interval); if (timer.current) clearTimeout(timer.current); }; }, []);
  useEffect(() => {
    if (!locked) return;
    const unlock = (event: KeyboardEvent) => { if (["Enter", " ", "ArrowUp"].includes(event.key)) { event.preventDefault(); setLocked(false); } };
    window.addEventListener("keydown", unlock);
    return () => window.removeEventListener("keydown", unlock);
  }, [locked, setLocked]);
  const unlock = () => {
    if (unlocking) return;
    setUnlocking(true);
    timer.current = setTimeout(() => { setLocked(false); setUnlocking(false); }, 400);
  };
  return <AnimatePresence>{locked && <motion.div role="dialog" aria-label="GhostOS lock screen" data-no-ctx initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="lock-screen fixed inset-0 z-[9900] overflow-hidden select-none" onClick={unlock}>
    <div className="absolute inset-0" style={{ background: wallpaper }}/>
    {customImage ? <img src={customImage.url} alt="" className="absolute inset-0 h-full w-full object-cover"/> : wp?.video && <video className="absolute inset-0 h-full w-full object-cover" src={wp.video} autoPlay muted loop playsInline/>}
    <div className="lock-screen-shade absolute inset-0"/>
    <motion.div animate={{ opacity: unlocking ? 0 : 1, y: unlocking ? -24 : 0 }} className="relative flex h-full flex-col items-center justify-between px-6 py-8 text-chrome-foreground">
      <div className="flex items-center gap-3"><GhostLogo size={28}/><span className="text-xs font-medium">GhostOS</span><LockKeyhole className="ml-2 h-3 w-3 text-chrome-muted"/></div>
      <div className="lock-clock text-center"><div className="mb-5 text-xs font-semibold text-chrome-muted">{now?.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</div><div className="lock-clock-time">{now?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</div><div className="mt-8 flex justify-center"><GhostLogo size={56}/></div></div>
      <Button variant="desktop" aria-label="Unlock GhostOS" className="lock-unlock flex h-auto flex-col gap-3 rounded-full px-8 py-4" onClick={event => { event.stopPropagation(); unlock(); }}><ArrowUp className="h-5 w-5"/><span className="text-xs font-normal">Unlock</span></Button>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
