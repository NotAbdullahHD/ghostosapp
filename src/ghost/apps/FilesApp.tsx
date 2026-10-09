import { useEffect, useMemo, useRef, useState } from "react";
import { Folder, FileText, Image as ImageIcon, Film, Music, File, Trash2, Undo2, Upload, FolderOpen, X, Download } from "lucide-react";

/** Real files imported from this device, kept in IndexedDB so they survive reloads. */
type StoredFile = { id: string; name: string; type: string; size: number; added: number; folder: string; trashed: boolean; blob: Blob };

const DB = "ghost-files";
const STORE = "files";
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => { const q = fn(d.transaction(STORE, mode).objectStore(STORE)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}

function kind(f: { type: string; name: string }) {
  if (f.type.startsWith("image/")) return "Images";
  if (f.type.startsWith("video/")) return "Videos";
  if (f.type.startsWith("audio/")) return "Music";
  if (f.type === "application/pdf" || f.type.startsWith("text/") || /\.(docx?|txt|md|pdf|csv|json|rtf|pptx?|xlsx?)$/i.test(f.name)) return "Documents";
  return "Other";
}
const ICON = { Images: ImageIcon, Videos: Film, Music, Documents: FileText, Other: File } as const;
const FOLDERS = ["All", "Images", "Documents", "Videos", "Music", "Other"] as const;
const size = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : b < 1073741824 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1073741824).toFixed(2)} GB`;

export function FilesApp() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [folder, setFolder] = useState<string>("All");
  const [view, setView] = useState<"files" | "trash">("files");
  const [open, setOpen] = useState<StoredFile | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { tx("readonly", (s) => s.getAll()).then((a) => setFiles((a as StoredFile[]).sort((x, y) => y.added - x.added))).catch(() => {}); }, []);

  const add = async (list: FileList | File[]) => {
    const next: StoredFile[] = [];
    for (const f of Array.from(list)) {
      const item: StoredFile = { id: crypto.randomUUID(), name: f.name, type: f.type, size: f.size, added: Date.now(), folder: kind(f), trashed: false, blob: f };
      try { await tx("readwrite", (s) => s.put(item)); next.push(item); } catch { /* quota */ }
    }
    setFiles((p) => [...next, ...p]);
  };
  const pickFolder = async () => {
    const w = window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> };
    if (!w.showDirectoryPicker) { input.current?.click(); return; }
    try {
      const dir = await w.showDirectoryPicker();
      const out: File[] = [];
      for await (const h of (dir as unknown as { values(): AsyncIterable<FileSystemHandle> }).values()) {
        if (h.kind === "file") out.push(await (h as FileSystemFileHandle).getFile());
      }
      add(out);
    } catch { /* cancelled */ }
  };
  const update = async (f: StoredFile, patch: Partial<StoredFile>) => {
    const n = { ...f, ...patch }; await tx("readwrite", (s) => s.put(n));
    setFiles((p) => p.map((x) => (x.id === f.id ? n : x)));
  };
  const destroy = async (ids: string[]) => {
    for (const id of ids) await tx("readwrite", (s) => s.delete(id));
    setFiles((p) => p.filter((x) => !ids.includes(x.id)));
  };

  const trash = files.filter((f) => f.trashed);
  const list = view === "trash" ? trash : files.filter((f) => !f.trashed && (folder === "All" || f.folder === folder));
  const used = useMemo(() => files.reduce((a, f) => a + f.size, 0), [files]);

  return (
    <div className="h-full flex bg-[#0E0E10] text-white"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) add(e.dataTransfer.files); }}>
      <aside className="w-44 shrink-0 border-r border-white/[0.06] p-3 flex flex-col gap-0.5 bg-[#121214]">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.25em] text-white/35">Places</div>
        {FOLDERS.map((f) => {
          const n = f === "All" ? files.filter((x) => !x.trashed).length : files.filter((x) => !x.trashed && x.folder === f).length;
          return (
            <button key={f} onClick={() => { setFolder(f); setView("files"); }}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[12.5px] ${view === "files" && folder === f ? "bg-white/10" : "text-white/60 hover:bg-white/[0.05]"}`}>
              <span className="flex items-center gap-2"><Folder className="h-3.5 w-3.5" />{f === "All" ? "All files" : f}</span>
              <span className="text-[10px] text-white/35">{n}</span>
            </button>
          );
        })}
        <button onClick={() => setView("trash")} className={`mt-2 flex items-center justify-between px-2 py-1.5 rounded-md text-[12.5px] ${view === "trash" ? "bg-white/10" : "text-white/60 hover:bg-white/[0.05]"}`}>
          <span className="flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" />Trash</span><span className="text-[10px] text-white/35">{trash.length}</span>
        </button>
        <div className="mt-auto px-2 text-[10px] text-white/35">{size(used)} stored on this device</div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="h-11 flex items-center justify-between px-4 border-b border-white/[0.06]">
          <div className="text-[13px] font-medium">{view === "trash" ? "Trash" : folder === "All" ? "All files" : folder}</div>
          <div className="flex items-center gap-1.5">
            {view === "trash" ? (
              trash.length > 0 && <button onClick={() => destroy(trash.map((t) => t.id))} className="px-3 py-1.5 rounded-md text-[12px] text-white/70 hover:bg-white/[0.06]">Empty Trash</button>
            ) : (<>
              <button onClick={pickFolder} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] text-white/70 hover:bg-white/[0.06]"><FolderOpen className="h-3.5 w-3.5" />Import folder</button>
              <button onClick={() => input.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] bg-white/10 hover:bg-white/15"><Upload className="h-3.5 w-3.5" />Add files</button>
            </>)}
            <input ref={input} type="file" multiple hidden onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          {list.length === 0 ? (
            <div className={`h-full min-h-[240px] rounded-xl border border-dashed flex flex-col items-center justify-center text-center ${drag ? "border-white/40 bg-white/[0.04]" : "border-white/10"}`}>
              <Upload className="h-6 w-6 text-white/30" />
              <div className="mt-3 text-[13px] text-white/60">{view === "trash" ? "Trash is empty" : "Drop photos, documents or videos here"}</div>
              {view === "files" && <div className="mt-1 text-[11px] text-white/35">Files stay on this device only.</div>}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
              {list.map((f) => <Tile key={f.id} f={f} trash={view === "trash"} onOpen={() => setOpen(f)}
                onTrash={() => update(f, { trashed: true })} onRestore={() => update(f, { trashed: false })} onDelete={() => destroy([f.id])} />)}
            </div>
          )}
        </div>
      </main>

      {open && <Preview f={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function useObjectUrl(b: Blob) {
  const url = useMemo(() => URL.createObjectURL(b), [b]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return url;
}

function Tile({ f, trash, onOpen, onTrash, onRestore, onDelete }: { f: StoredFile; trash: boolean; onOpen: () => void; onTrash: () => void; onRestore: () => void; onDelete: () => void }) {
  const Icon = ICON[f.folder as keyof typeof ICON] ?? File;
  const thumb = f.folder === "Images";
  const url = useObjectUrl(f.blob);
  return (
    <div className="group rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] hover:ring-white/15 overflow-hidden">
      <button onDoubleClick={onOpen} onClick={onOpen} className="block w-full aspect-[4/3] bg-black/30 flex items-center justify-center overflow-hidden">
        {thumb ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Icon className="h-8 w-8 text-white/40" />}
      </button>
      <div className="p-2">
        <div className="text-[12px] truncate" title={f.name}>{f.name}</div>
        <div className="flex items-center justify-between text-[10px] text-white/35 mt-0.5">
          <span>{size(f.size)}</span>
          {trash ? (
            <span className="flex gap-2"><button onClick={onRestore} title="Restore" className="hover:text-white"><Undo2 className="h-3 w-3" /></button><button onClick={onDelete} title="Delete forever" className="hover:text-white"><X className="h-3 w-3" /></button></span>
          ) : <button onClick={onTrash} title="Move to Trash" className="opacity-0 group-hover:opacity-100 hover:text-white"><Trash2 className="h-3 w-3" /></button>}
        </div>
      </div>
    </div>
  );
}

function Preview({ f, onClose }: { f: StoredFile; onClose: () => void }) {
  const url = useObjectUrl(f.blob);
  const [text, setText] = useState<string | null>(null);
  const isText = f.type.startsWith("text/") || /\.(txt|md|csv|json|log)$/i.test(f.name);
  useEffect(() => { if (isText) f.blob.text().then((t) => setText(t.slice(0, 200000))); }, [f, isText]);
  return (
    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div className="h-11 flex items-center justify-between px-4 text-[12.5px]" onClick={(e) => e.stopPropagation()}>
        <span className="truncate">{f.name}</span>
        <span className="flex items-center gap-1">
          <a href={url} download={f.name} className="p-1.5 rounded-md hover:bg-white/10"><Download className="h-4 w-4" /></a>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/10"><X className="h-4 w-4" /></button>
        </span>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        {f.type.startsWith("image/") ? <img src={url} alt={f.name} className="max-h-full max-w-full object-contain rounded-lg" />
          : f.type.startsWith("video/") ? <video src={url} controls autoPlay className="max-h-full max-w-full rounded-lg" />
          : f.type.startsWith("audio/") ? <audio src={url} controls autoPlay />
          : f.type === "application/pdf" ? <iframe src={url} title={f.name} className="h-full w-full rounded-lg bg-white" />
          : isText ? <pre className="h-full w-full overflow-auto rounded-lg bg-[#141416] p-4 text-[12px] text-white/80 whitespace-pre-wrap">{text ?? "…"}</pre>
          : <div className="text-center text-white/60 text-[13px]">No preview for this file type.<div className="mt-3"><a href={url} download={f.name} className="px-3 py-1.5 rounded-md bg-white/10">Download</a></div></div>}
      </div>
    </div>
  );
}
