import { Folder, FileText, Shield } from "lucide-react";

const items = [
  { name: "Encrypted", icon: Shield, count: "12 items" },
  { name: "Documents", icon: Folder, count: "84 items" },
  { name: "Spectral Logs", icon: FileText, count: "4.2 GB" },
  { name: "Neural Cache", icon: Folder, count: "1.8 GB" },
  { name: "Ghost Backups", icon: Shield, count: "32 items" },
  { name: "Downloads", icon: Folder, count: "203 items" },
];

export function FilesApp() {
  return (
    <div className="h-full bg-gradient-to-br from-[#04140a] via-black to-[#031a18] text-white overflow-y-auto scrollbar-hide p-6">
      <h2 className="text-xl font-bold mb-1">Vault</h2>
      <p className="text-xs text-white/50 mb-5 font-mono">AES-512 · QUANTUM SEALED</p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((it) => (
          <button key={it.name} className="glass rounded-xl p-4 hover:neon-border transition text-left">
            <it.icon className="h-6 w-6 text-emerald-300 mb-3" />
            <div className="text-sm font-bold">{it.name}</div>
            <div className="text-[10px] text-white/40 font-mono mt-0.5">{it.count}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
