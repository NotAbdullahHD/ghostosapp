import { useEffect, useState } from "react";
import { Wand2, KeyRound, RotateCcw } from "lucide-react";
import { DEFAULT_MODS, OPEN_ANIMATIONS, hasLockPassword, setLockPassword, useMods, writeMods, type OpenAnimation } from "./mods";

const ACCENTS = ["#66d9ff", "#fb542b", "#a78bfa", "#34d399", "#f472b6", "#facc15", "#ffffff"];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3">
    <div><div className="text-xs font-medium">{label}</div>{hint && <div className="text-[11px] text-white/40">{hint}</div>}</div>
    <div className="shrink-0">{children}</div>
  </div>;
}
function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return <button role="switch" aria-checked={on} onClick={() => set(!on)} className={`h-5 w-9 rounded-full p-0.5 transition ${on ? "bg-[var(--ice)]" : "bg-white/15"}`}>
    <span className={`block h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} /></button>;
}

export function GhostModsPanel() {
  const m = useMods();
  const [pwSet, setPwSet] = useState(false);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setPwSet(hasLockPassword()); }, []);

  return <div className="space-y-6 max-w-xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3"><Wand2 className="h-5 w-5 text-[var(--ice)]" /><div><h2 className="text-lg font-semibold">Ghost Mods</h2><p className="text-[11px] text-white/40">Live system tweaks — built in, no installs.</p></div></div>
      <button onClick={() => writeMods(DEFAULT_MODS)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-white/60 hover:bg-white/5"><RotateCcw className="h-3 w-3" />Reset all</button>
    </div>

    <section className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-white/40">Windows</h3>
      <Row label="Open animation" hint="How apps appear when launched">
        <div className="flex gap-1">{(Object.keys(OPEN_ANIMATIONS) as OpenAnimation[]).map(k =>
          <button key={k} onClick={() => writeMods({ openAnimation: k })} className={`rounded-md px-2 py-1 text-[11px] ${m.openAnimation === k ? "bg-[var(--ice)] text-black" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>{OPEN_ANIMATIONS[k].label}</button>)}</div>
      </Row>
      <Row label="Corner roundness" hint={`${m.windowRadius}px`}><input type="range" min={0} max={28} value={m.windowRadius} onChange={e => writeMods({ windowRadius: +e.target.value })} className="w-36 accent-[var(--ice)]" /></Row>
      <Row label="Window transparency" hint={`${Math.round(m.windowOpacity * 100)}%`}><input type="range" min={60} max={100} value={m.windowOpacity * 100} onChange={e => writeMods({ windowOpacity: +e.target.value / 100 })} className="w-36 accent-[var(--ice)]" /></Row>
      <Row label="Compact title bars"><Toggle on={m.compactTitlebars} set={v => writeMods({ compactTitlebars: v })} /></Row>
    </section>

    <section className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-white/40">Desktop & dock</h3>
      <Row label="Dock size" hint={`${Math.round(m.dockScale * 100)}%`}><input type="range" min={80} max={130} value={m.dockScale * 100} onChange={e => writeMods({ dockScale: +e.target.value / 100 })} className="w-36 accent-[var(--ice)]" /></Row>
      <Row label="Hide desktop icons"><Toggle on={m.hideDesktopIcons} set={v => writeMods({ hideDesktopIcons: v })} /></Row>
      <Row label="Hide icon labels"><Toggle on={m.hideIconLabels} set={v => writeMods({ hideIconLabels: v })} /></Row>
      <Row label="Reduce blur" hint="Faster on slow Chromebooks"><Toggle on={m.reduceBlur} set={v => writeMods({ reduceBlur: v })} /></Row>
      <Row label="Accent color">
        <div className="flex gap-1.5">{ACCENTS.map(c => <button key={c} aria-label={`Accent ${c}`} onClick={() => writeMods({ accent: c })} className={`h-5 w-5 rounded-full ring-2 ${m.accent === c ? "ring-white" : "ring-transparent"}`} style={{ background: c }} />)}</div>
      </Row>
    </section>

    <section className="space-y-2">
      <h3 className="text-[10px] uppercase tracking-widest text-white/40">Lock screen password</h3>
      <div className="rounded-lg border border-white/5 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs"><KeyRound className="h-4 w-4 text-[var(--ice)]" />{pwSet ? "Password is on — needed to unlock." : "No password — click to unlock."}</div>
        <div className="flex gap-2">
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder={pwSet ? "New password" : "Set a password (4+ characters)"} className="flex-1 rounded-md bg-black/40 px-3 py-2 text-xs outline-none ring-1 ring-white/10 focus:ring-[var(--ice)]" />
          <button disabled={pw.length < 4} onClick={async () => { await setLockPassword(pw); setPw(""); setPwSet(true); setMsg("Password saved on this device."); }} className="rounded-md bg-[var(--ice)] px-3 text-xs font-medium text-black disabled:opacity-40">Save</button>
          {pwSet && <button onClick={async () => { await setLockPassword(null); setPwSet(false); setMsg("Password removed."); }} className="rounded-md bg-white/5 px-3 text-xs hover:bg-white/10">Remove</button>}
        </div>
        {msg && <p className="text-[11px] text-white/50">{msg}</p>}
      </div>
    </section>
  </div>;
}
