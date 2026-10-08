import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Wifi, WifiOff, Volume2, Sun, Moon, Radio, Settings2, Lock, BatteryCharging } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGhost } from "./store";
import { useMusic } from "./music";
import { useDeviceStatus } from "./useDeviceStatus";

export function ControlCenter() {
  const { showControlCenter, toggleControlCenter, openApp, toggleGhostDrop, setLocked } = useGhost();
  const { volume, setVolume } = useMusic();
  const { online, battery } = useDeviceStatus();
  const [brightness,setBrightness] = useState(100);
  const [night,setNight] = useState(false);
  useEffect(() => { try { const s=JSON.parse(localStorage.getItem("ghost.controlcenter.v2") || "{}");setBrightness(s.brightness??100);setNight(s.night??false); } catch {} },[]);
  useEffect(() => { try { localStorage.setItem("ghost.controlcenter.v2",JSON.stringify({brightness,night})); } catch {} document.documentElement.style.setProperty("--desktop-brightness",String(brightness/100));return ()=>{ document.documentElement.style.removeProperty("--desktop-brightness"); }; },[brightness,night]);
  return <>
    <div className={`desktop-display-overlay ${night?"desktop-night":""}`} style={{opacity: 1-brightness/100}}/>
    {night && <div className="desktop-night-overlay"/>}
    <AnimatePresence>{showControlCenter && <>
      <div className="fixed inset-0 z-[780]" onClick={toggleControlCenter}/>
      <motion.div role="dialog" aria-label="Control Center" className="desktop-panel fixed right-2 top-11 z-[800] w-[300px] max-w-[calc(100vw-16px)] rounded-lg p-4" initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}>
        <div className="flex items-center justify-between mb-5">
          <span className="flex gap-2 items-center text-xs">{battery && <><BatteryCharging className="h-4 w-4"/>{battery.level}%{battery.charging?" · Charging":""}</>}</span>
          <div className="flex gap-1"><Button variant="desktop" size="icon" title="Settings" className="h-7 w-7 rounded-full" onClick={()=>{toggleControlCenter();openApp("settings","Settings");}}><Settings2/></Button><Button variant="desktop" size="icon" title="Lock GhostOS" className="h-7 w-7 rounded-full" onClick={()=>{toggleControlCenter();setLocked(true);}}><Lock/></Button></div>
        </div>
        <label className="flex items-center gap-3 mb-5 text-chrome-muted"><Volume2 className="h-4 w-4"/><input aria-label="Music volume" type="range" min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))} className="w-full accent-primary"/><span className="w-8 text-[10px] tabular-nums">{volume}%</span></label>
        <label className="flex items-center gap-3 mb-5 text-chrome-muted"><Sun className="h-4 w-4"/><input aria-label="Display brightness" type="range" min="30" max="100" value={brightness} onChange={e=>setBrightness(Number(e.target.value))} className="w-full accent-primary"/><span className="w-8 text-[10px] tabular-nums">{brightness}%</span></label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-2 py-3 text-xs text-chrome-muted">{online===false?<WifiOff className="h-4 w-4"/>:<Wifi className="h-4 w-4"/>}{online===null?"Network unavailable":online?"Browser online":"Browser offline"}</div>
          <Button variant="desktop" className={night?"bg-chrome-hover":""} aria-pressed={night} onClick={()=>setNight(v=>!v)}><Moon/>Night light</Button>
          <Button variant="desktop" onClick={()=>{toggleControlCenter();toggleGhostDrop();}}><Radio/>GhostDrop</Button>
          <Button variant="desktop" onClick={()=>{toggleControlCenter();openApp("music","Ghost Music");}}><Volume2/>Music</Button>
        </div>
      </motion.div>
    </>}</AnimatePresence>
  </>;
}
