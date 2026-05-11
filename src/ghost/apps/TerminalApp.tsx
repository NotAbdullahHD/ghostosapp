import { useEffect, useRef, useState } from "react";

const HELP = [
  "available commands: help, whoami, ls, cat <file>, neofetch, ghost, clear, sudo summon",
];

export function TerminalApp() {
  const [lines, setLines] = useState<string[]>([
    "GhostOS Spectral Shell v3.1.4",
    "type 'help' for commands.",
    "",
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const run = () => {
    const cmd = input.trim();
    const out: string[] = [`ghost@os ~$ ${cmd}`];
    if (!cmd) { /* noop */ }
    else if (cmd === "help") out.push(...HELP);
    else if (cmd === "whoami") out.push("ghost (uid=1337, role=phantom)");
    else if (cmd === "ls") out.push("vault/  arcade/  cinema/  notes/  README.ghost");
    else if (cmd.startsWith("cat ")) out.push("[encrypted] — quantum seal active.");
    else if (cmd === "neofetch") {
      out.push(
        "          ▲▲▲          OS:     GhostOS v3.1.4",
        "        ▲▲   ▲▲        kernel: spectral-9.2",
        "       ▲   ✦   ▲       shell:  spec-sh",
        "        ▲▲   ▲▲        cpu:    Phantom M3 (12c)",
        "          ▼▼▼          mem:    13.7G / 32G",
      );
    }
    else if (cmd === "ghost") out.push("👻  boo.");
    else if (cmd === "clear") { setLines([]); setInput(""); return; }
    else if (cmd === "sudo summon") out.push("summoning… ✦ a phantom appears in your dock.");
    else out.push(`spec-sh: command not found: ${cmd}`);
    setLines((l) => [...l, ...out, ""]);
    setInput("");
  };

  return (
    <div className="h-full bg-black text-emerald-300 font-mono text-[12px] p-4 overflow-y-auto scrollbar-hide" onClick={() => (document.getElementById("term-input") as HTMLInputElement | null)?.focus()}>
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
