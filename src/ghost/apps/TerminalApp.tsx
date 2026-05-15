import { useEffect, useRef, useState } from "react";
import { useGhost, WALLPAPERS } from "../store";

const HELP = [
  "available commands:",
  "  help                 — show this menu",
  "  whoami               — current spectral identity",
  "  ls                   — list current directory",
  "  neofetch             — system info",
  "  wallpapers           — list wallpapers + lock state (codes hidden)",
  "  redeem <#code>       — unlock hidden wallpaper / theme",
  "  unlock <#code>       — alias of redeem",
  "  apply <wallpaper-id> — switch to an unlocked wallpaper",
  "  panic                — minimize everything · trigger panic",
  "  cloak <preset>       — set tab cloak (off|google|classroom|docs|drive|canvas|classlink)",
  "  lock                 — lock the OS",
  "  ghost                — ???",
  "  clear                — clear terminal",
];

export function TerminalApp() {
  const { redeemCode, unlocked, setWallpaperById, triggerPanic, updateSettings, setLocked } = useGhost();
  const [lines, setLines] = useState<string[]>([
    "GhostOS Spectral Shell v3.2.0",
    "type 'help' for commands. codes drop on Discord.",
    "",
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const print = (...rows: string[]) => setLines((l) => [...l, ...rows]);

  const run = () => {
    const cmd = input.trim();
    const out: string[] = [`ghost@os ~$ ${cmd}`];
    const lower = cmd.toLowerCase();

    if (!cmd) { /* noop */ }
    else if (lower === "help") out.push(...HELP);
    else if (lower === "whoami") out.push("ghost (uid=1337, role=phantom)");
    else if (lower === "ls") out.push("vault/  arcade/  cinema/  notes/  wallpapers/  README.ghost");
    else if (lower === "neofetch") {
      out.push(
        "          ▲▲▲          OS:     GhostOS v3.2.0",
        "        ▲▲   ▲▲        kernel: spectral-9.4",
        "       ▲   ✦   ▲       shell:  spec-sh",
        "        ▲▲   ▲▲        cpu:    Phantom M3 (12c)",
        "          ▼▼▼          mem:    13.7G / 32G",
      );
    }
    else if (lower === "ghost") out.push("👻  boo.");
    else if (lower === "panic") { triggerPanic(); out.push("✓ panic triggered"); }
    else if (lower === "lock") { setLocked(true); out.push("✓ system locked"); }
    else if (lower.startsWith("cloak ")) {
      const preset = cmd.slice(6).trim().toLowerCase();
      const valid = ["off","google","classroom","docs","drive","canvas","classlink"];
      if (!valid.includes(preset)) out.push(`✗ unknown preset. one of: ${valid.join(", ")}`);
      else { updateSettings({ tabCloak: preset }); out.push(`✓ tab cloak: ${preset}`); }
    }
    else if (lower === "wallpapers") {
      out.push("[ wallpaper library ]");
      WALLPAPERS.forEach((w) => {
        const lockedByCode = !!w.code && !unlocked[w.id];
        const lockedExclusive = !!w.exclusive && !unlocked[w.id];
        const status = lockedExclusive ? "EXCLUSIVE·LOCKED" : lockedByCode ? "LOCKED" : (w.code || w.exclusive ? "UNLOCKED" : "OWNED");
        out.push(`  ${w.id.padEnd(18)} ${w.rarity.toUpperCase().padEnd(10)} ${status}`);
      });
      out.push("", "(codes are not printed — drops on Discord)");
    }
    else if (lower.startsWith("apply ")) {
      const id = cmd.slice(6).trim();
      const ok = setWallpaperById(id);
      out.push(ok ? `✓ wallpaper applied: ${id}` : `✗ cannot apply '${id}' (locked or unknown)`);
    }
    else if (lower.startsWith("redeem") || lower.startsWith("unlock")) {
      const code = cmd.split(/\s+/).slice(1).join(" ").trim();
      if (!code) out.push("usage: redeem <#code>");
      else {
        const r = redeemCode(code);
        if (r.ok && r.wallpaper) {
          out.push(
            "",
            "  ░▒▓  SIGNAL DECRYPTED  ▓▒░",
            `  ✦ unlocked: ${r.wallpaper.name}`,
            `  ✦ rarity:   ${r.wallpaper.rarity.toUpperCase()}`,
            `  ✦ status:   added to library`,
            `  → run: apply ${r.wallpaper.id}`,
            "",
          );
        } else if (r.wallpaper) {
          out.push(`✗ ${r.reason}: ${r.wallpaper.name} already in library.`);
        } else {
          out.push(`✗ ${r.reason || "redemption failed"}`);
        }
      }
    }
    else if (lower === "clear") { setLines([]); setInput(""); return; }
    else out.push(`spec-sh: command not found: ${cmd}`);
    print(...out, "");
    setInput("");
  };

  return (
    <div className="h-full bg-black text-emerald-300 font-mono text-[12px] p-4 overflow-y-auto scrollbar-hide relative" onClick={() => (document.getElementById("term-input") as HTMLInputElement | null)?.focus()}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,140,.4) 0 1px, transparent 1px 3px)" }} />
      {lines.map((l, i) => (
        <div key={i} className="whitespace-pre">{l}</div>
      ))}
      <div className="flex items-center gap-2">
        <span className="text-fuchsia-400">ghost@os</span><span className="text-white/50">~$</span>
        <input id="term-input" autoFocus value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && run()}
          className="flex-1 bg-transparent outline-none text-emerald-200 caret-fuchsia-400" />
      </div>
      <div ref={endRef} />
    </div>
  );
}
