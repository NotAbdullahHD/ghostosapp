import { useEffect } from "react";
import { X, RotateCcw, Type, Move, Blend } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePersonalization } from "./PersonalizationProvider";
import { CLOCK_COLORS, DEFAULT_CLOCK, type ClockSettings } from "./personalization";

export function ClockEditor() {
  const { clock, updateClock, showClockEditor, setShowClockEditor } = usePersonalization();
  useEffect(() => {
    if (!showClockEditor) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setShowClockEditor(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [showClockEditor, setShowClockEditor]);
  if (!showClockEditor) return null;
  const slider = (key: "size" | "detailSize" | "opacity" | "x" | "y", label: string, min: number, max: number, unit: string) => <label className="editor-slider"><span>{label}<output>{clock[key]}{unit}</output></span><input type="range" aria-label={label} min={min} max={max} value={clock[key]} onChange={event => updateClock({ [key]: Number(event.target.value) })}/></label>;
  return <aside role="dialog" aria-label="Customize clock" data-no-ctx className="desktop-panel clock-editor fixed right-4 top-12 z-[850] w-[300px] max-w-[calc(100vw-32px)] rounded-lg p-5">
    <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold">Clock studio</h2><Button variant="desktop" size="icon" className="h-7 w-7" aria-label="Close clock editor" onClick={() => setShowClockEditor(false)}><X/></Button></div>
    <label className="editor-label"><span className="flex gap-2"><Type className="h-3.5 w-3.5"/>Display text</span><input aria-label="Clock text" maxLength={40} placeholder="Automatic weekday" value={clock.text} onChange={event => updateClock({ text: event.target.value })} className="editor-input"/></label>
    {slider("size", "Text size", 24, 110, "px")}{slider("detailSize", "Date and time size", 10, 24, "px")}{slider("opacity", "Opacity", 10, 100, "%")}
    <div className="editor-section"><Move className="h-3.5 w-3.5"/>Position</div>
    {slider("x", "Horizontal", 15, 85, "%")}{slider("y", "Vertical", 20, 75, "%")}
    <div className="editor-section">Color</div><div className="flex gap-3 mb-4">{(Object.keys(CLOCK_COLORS) as (keyof typeof CLOCK_COLORS)[]).map(color => <Button key={color} variant="desktop" size="icon" aria-label={`${color} clock color`} aria-pressed={clock.color === color} title={color} onClick={() => updateClock({ color })} className={`clock-swatch clock-swatch-${color} ${clock.color === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}/>)}</div>
    <label className="editor-label"><span className="flex gap-2"><Blend className="h-3.5 w-3.5"/>Blend</span><select aria-label="Clock blend" className="editor-input" value={clock.blend} onChange={event => updateClock({ blend: event.target.value as ClockSettings["blend"] })}>{["normal", "difference", "overlay", "screen"].map(mode => <option key={mode} value={mode}>{mode[0].toUpperCase() + mode.slice(1)}</option>)}</select></label>
    <div className="flex gap-5 text-xs mb-4"><label className="flex items-center gap-2"><input type="checkbox" checked={clock.date} onChange={event => updateClock({ date: event.target.checked })}/>Date</label><label className="flex items-center gap-2"><input type="checkbox" checked={clock.time} onChange={event => updateClock({ time: event.target.checked })}/>Time</label></div>
    <Button variant="desktop" className="w-full border border-chrome-border text-xs" onClick={() => updateClock(DEFAULT_CLOCK)}><RotateCcw/>Reset clock</Button>
  </aside>;
}