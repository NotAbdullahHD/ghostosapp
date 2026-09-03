import { useEffect, useState } from "react";
import { Folder, FileText, Shield, Trash2, Undo2 } from "lucide-react";

type Item = { name: string; icon: "folder" | "file" | "shield"; count: string };

const DEFAULT_ITEMS: Item[] = [
  { name: "Encrypted", icon: "shield", count: "12 items" },
  { name: "Documents", icon: "folder", count: "84 items" },
  { name: "Spectral Logs", icon: "file", count: "4.2 GB" },
  { name: "Neural Cache", icon: "folder", count: "1.8 GB" },
  { name: "Ghost Backups", icon: "shield", count: "32 items" },
  { name: "Downloads", icon: "folder", count: "203 items" },
];

const ICONS = { folder: Folder, file: FileText, shield: Shield };
const LS = "ghost.files.v1";

export function FilesApp() {
  const [items, setItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [trash, setTrash] = useState<Item[]>([]);
  const [view, setView] = useState<"files" | "trash">("files");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p.items)) setItems(p.items);
        if (Array.isArray(p.trash)) setTrash(p.trash);
      }
    } catch { /* ignore */ }
  }, []);

  const persist = (nextItems: Item[], nextTrash: Item[]) => {
    setItems(nextItems);
    setTrash(nextTrash);
    try { localStorage.setItem(LS, JSON.stringify({ items: nextItems, trash: nextTrash })); } catch { /* ignore */ }
  };

  const del = (name: string) => {
    const it = items.find((i) => i.name === name);
    if (!it) return;
    persist(items.filter((i) => i.name !== name), [it, ...trash]);
  };
  const restore = (name: string) => {
    const it = trash.find((i) => i.name === name);
    if (!it) return;
    persist([...items, it], trash.filter((i) => i.name !== name));
  };
  const emptyTrash = () => persist(items, []);

  const list = view === "files" ? items : trash;

  return (
    <div className="h-full bg-gradient-to-br from-[#04140a] via-black to-[#031a18] text-white overflow-y-auto scrollbar-hide p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Vault</h2>
          <p className="text-xs text-white/50 font-mono">AES-512 · QUANTUM SEALED</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("files")}
            className={`px-3 py-1.5 rounded-lg text-xs ${view === "files" ? "bg-white/[0.12]" : "hover:bg-white/[0.06] text-white/60"}`}
          >Files</button>
          <button
            onClick={() => setView("trash")}
            className={`px-3 py-1.5 rounded-lg text-xs ${view === "trash" ? "bg-white/[0.12]" : "hover:bg-white/[0.06] text-white/60"}`}
          >Trash ({trash.length})</button>
          {view === "trash" && trash.length > 0 && (
            <button onClick={emptyTrash} className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:bg-white/[0.06]">Empty Trash</button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-white/40 text-sm py-12 text-center">{view === "trash" ? "Trash is empty" : "No files"}</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {list.map((it) => {
            const Icon = ICONS[it.icon];
            return (
              <div key={it.name} className="glass rounded-xl p-4 text-left">
                <Icon className="h-6 w-6 text-emerald-300 mb-3" />
                <div className="text-sm font-bold">{it.name}</div>
                <div className="text-[10px] text-white/40 font-mono mt-0.5">{it.count}</div>
                <button
                  onClick={() => (view === "files" ? del(it.name) : restore(it.name))}
                  className="mt-3 flex items-center gap-1.5 text-[11px] text-white/55 hover:text-white"
                >
                  {view === "files" ? <><Trash2 className="h-3.5 w-3.5" /> Delete</> : <><Undo2 className="h-3.5 w-3.5" /> Restore</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
