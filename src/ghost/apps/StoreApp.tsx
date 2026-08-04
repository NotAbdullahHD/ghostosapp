import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronLeft, Check, Loader2, Star, Shield, Download, Trash2,
  Gamepad2, LayoutGrid, Wrench, Palette, Sparkles,
} from "lucide-react";
import { useGhost } from "../store";
import { AppIcon } from "../AppIcon";
import {
  STORE_CATEGORIES, STORE_LISTINGS, PERMISSION_LABELS,
  type StoreCategoryId, type StoreListing,
} from "../storeCatalog";

const CAT_ICON: Record<StoreCategoryId, typeof Gamepad2> = {
  games: Gamepad2,
  apps: LayoutGrid,
  utilities: Wrench,
  themes: Palette,
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function StoreApp() {
  const { installedApps, installApp, uninstallApp, openApp, pushNotification } = useGhost();
  const [tab, setTab] = useState<"home" | StoreCategoryId>("home");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const listing = STORE_LISTINGS.find((l) => l.id === openId) || null;
  const searching = q.trim().length > 0;

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return STORE_LISTINGS.filter(
      (l) => l.name.toLowerCase().includes(t) || l.tagline.toLowerCase().includes(t) || l.publisher.toLowerCase().includes(t),
    );
  }, [q]);

  const isInstalled = (l: StoreListing) => l.delivery.kind !== "appearance" && !!installedApps[l.delivery.appId];

  const install = (l: StoreListing) => {
    if (l.delivery.kind === "appearance") return;
    setInstalling(l.id);
    setProgress(0);
    const started = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(100, ((Date.now() - started) / 2200) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(tick);
        setInstalling(null);
        installApp(l.delivery.kind === "appearance" ? "store" : l.delivery.appId);
        pushNotification({ title: `${l.name} installed`, body: "Available in the launcher and dock." });
      }
    }, 60);
  };

  return (
    <div className="h-full flex bg-[#0B0B0D] text-white">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-white/[0.08] bg-[#141416] flex flex-col">
        <div className="px-4 pt-4 pb-3">
          <div className="text-[13px] font-semibold tracking-tight">Ghost Store</div>
          <div className="text-[10px] text-white/35 mt-0.5">Apps built for GhostOS</div>
        </div>
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 h-8 rounded-lg bg-white/[0.05] ring-1 ring-white/[0.07] px-2.5">
            <Search className="h-3.5 w-3.5 text-white/35" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpenId(null); }}
              placeholder="Search"
              className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-white/30"
            />
          </div>
        </div>
        <nav className="px-2 space-y-0.5">
          <SideItem active={tab === "home" && !searching} onClick={() => { setTab("home"); setQ(""); setOpenId(null); }} icon={Sparkles} label="Discover" />
          {STORE_CATEGORIES.map((c) => {
            const Icon = CAT_ICON[c.id];
            return (
              <SideItem key={c.id} active={tab === c.id && !searching} onClick={() => { setTab(c.id); setQ(""); setOpenId(null); }} icon={Icon} label={c.name} />
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <div className="rounded-xl p-3 ring-1 ring-white/[0.07] bg-white/[0.03]">
            <div className="text-[11px] font-medium">Publish on GhostOS</div>
            <div className="text-[10px] text-white/40 mt-1 leading-relaxed">
              Third-party developer tools are in preparation.
            </div>
            <div className="mt-2 text-[9px] font-mono tracking-widest text-white/25">COMING SOON</div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {listing ? (
            <motion.div key="detail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: EASE }}>
              <ProductPage
                listing={listing}
                installed={isInstalled(listing)}
                installing={installing === listing.id}
                progress={progress}
                onBack={() => setOpenId(null)}
                onInstall={() => install(listing)}
                onOpen={() => listing.delivery.kind !== "appearance" && openApp(listing.delivery.appId, listing.name)}
                onUninstall={() => listing.delivery.kind !== "appearance" && uninstallApp(listing.delivery.appId)}
              />
            </motion.div>
          ) : searching ? (
            <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <h2 className="text-[15px] font-semibold tracking-tight mb-4">Results for “{q.trim()}”</h2>
              {results.length === 0 ? (
                <EmptyState title="No results" body="Only Minecraft is available today. More applications arrive with future GhostOS updates." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {results.map((l) => <ListingCard key={l.id} l={l} installed={isInstalled(l)} onClick={() => setOpenId(l.id)} />)}
                </div>
              )}
            </motion.div>
          ) : tab === "home" ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 space-y-8">
              <Featured listing={STORE_LISTINGS[0]} installed={isInstalled(STORE_LISTINGS[0])} onClick={() => setOpenId(STORE_LISTINGS[0].id)} />
              <section>
                <SectionHead title="Categories" sub="Everything in GhostOS, organised." />
                <div className="grid grid-cols-4 gap-3">
                  {STORE_CATEGORIES.map((c) => {
                    const Icon = CAT_ICON[c.id];
                    const count = STORE_LISTINGS.filter((l) => l.category === c.id).length;
                    return (
                      <button key={c.id} onClick={() => setTab(c.id)}
                        className="text-left rounded-xl p-3.5 ring-1 ring-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition">
                        <Icon className="h-4 w-4 text-[#66D9FF]" />
                        <div className="mt-2.5 text-[12px] font-medium">{c.name}</div>
                        <div className="text-[10px] text-white/35 mt-0.5">{count > 0 ? `${count} available` : "Coming soon"}</div>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section>
                <SectionHead title="New in GhostOS" sub="Hand-picked by the GhostOS team." />
                <div className="grid grid-cols-2 gap-3">
                  {STORE_LISTINGS.map((l) => <ListingCard key={l.id} l={l} installed={isInstalled(l)} onClick={() => setOpenId(l.id)} />)}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6">
              <CategoryView catId={tab} installedOf={isInstalled} onOpen={setOpenId} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SideItem({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Gamepad2; label: string }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-[12px] transition ${
        active ? "bg-[#66D9FF]/12 text-white ring-1 ring-[#66D9FF]/25" : "text-white/55 hover:bg-white/[0.05]"
      }`}>
      <Icon className={`h-3.5 w-3.5 ${active ? "text-[#66D9FF]" : "text-white/40"}`} />
      {label}
    </button>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      <p className="text-[11px] text-white/35 mt-0.5">{sub}</p>
    </div>
  );
}

function Featured({ listing, installed, onClick }: { listing: StoreListing; installed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left relative overflow-hidden rounded-2xl ring-1 ring-white/[0.08] group">
      <div className="h-44 relative" style={{ background: listing.heroCss }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(90% 120% at 15% 0%, rgba(102,217,255,.16), transparent 60%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/25 to-transparent" />
        <div className="relative h-full flex items-end p-5 gap-4">
          <AppIcon id="minecraft" size={56} />
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.22em] text-[#66D9FF] font-medium">FEATURED</div>
            <div className="text-[20px] font-semibold tracking-tight mt-0.5">{listing.name}</div>
            <div className="text-[12px] text-white/55 mt-0.5 truncate">{listing.tagline}</div>
          </div>
          <span className={`ml-auto shrink-0 px-3.5 h-8 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition ${
            installed ? "bg-white/[0.08] text-white/70" : "bg-[#66D9FF] text-[#06212b] group-hover:brightness-110"
          }`}>
            {installed ? <><Check className="h-3.5 w-3.5" /> Installed</> : <><Download className="h-3.5 w-3.5" /> Get</>}
          </span>
        </div>
      </div>
    </button>
  );
}

function ListingCard({ l, installed, onClick }: { l: StoreListing; installed: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl ring-1 ring-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] transition text-left">
      {l.delivery.kind !== "appearance" ? <AppIcon id={l.delivery.appId} size={44} /> : <div className="h-11 w-11 rounded-xl" style={{ background: l.heroCss }} />}
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium truncate">{l.name}</div>
        <div className="text-[11px] text-white/40 truncate">{l.tagline}</div>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-white/35">
          <Star className="h-2.5 w-2.5 fill-[#66D9FF] text-[#66D9FF]" /> {l.rating.toFixed(1)} · {l.publisher}
        </div>
      </div>
      <span className={`shrink-0 px-2.5 h-7 rounded-md text-[11px] font-medium flex items-center ${installed ? "text-white/50 ring-1 ring-white/10" : "bg-[#66D9FF]/15 text-[#66D9FF] ring-1 ring-[#66D9FF]/25"}`}>
        {installed ? "Open" : "Get"}
      </span>
    </button>
  );
}

function CategoryView({ catId, installedOf, onOpen }: { catId: StoreCategoryId; installedOf: (l: StoreListing) => boolean; onOpen: (id: string) => void }) {
  const cat = STORE_CATEGORIES.find((c) => c.id === catId)!;
  const items = STORE_LISTINGS.filter((l) => l.category === catId);
  return (
    <div className="space-y-6">
      <SectionHead title={cat.name} sub={cat.tagline} />
      {cat.shelves.map((shelf) => {
        const shelfItems = items.filter((l) => l.shelf === shelf || (shelf === "Featured" && l.shelf !== shelf));
        return (
          <section key={shelf}>
            <div className="text-[12px] font-medium text-white/70 mb-2">{shelf}</div>
            {shelfItems.length === 0 ? (
              <div className="rounded-xl ring-1 ring-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
                <div className="text-[12px] text-white/45">Coming Soon</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {shelfItems.map((l) => <ListingCard key={l.id} l={l} installed={installedOf(l)} onClick={() => onOpen(l.id)} />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl ring-1 ring-white/[0.06] bg-white/[0.02] px-6 py-10 text-center">
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-white/40 mt-1 max-w-sm mx-auto">{body}</div>
    </div>
  );
}

function ProductPage({
  listing, installed, installing, progress, onBack, onInstall, onOpen, onUninstall,
}: {
  listing: StoreListing; installed: boolean; installing: boolean; progress: number;
  onBack: () => void; onInstall: () => void; onOpen: () => void; onUninstall: () => void;
}) {
  return (
    <div>
      <div className="relative h-52" style={{ background: listing.heroCss }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(80% 120% at 20% 0%, rgba(102,217,255,.14), transparent 60%)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/30 to-transparent" />
        <button onClick={onBack} className="absolute top-4 left-4 z-10 flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] bg-black/40 ring-1 ring-white/10 hover:bg-black/60">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="absolute inset-x-0 bottom-0 p-5 flex items-end gap-4">
          {listing.delivery.kind !== "appearance" && <AppIcon id={listing.delivery.appId} size={64} />}
          <div className="min-w-0">
            <div className="text-[22px] font-semibold tracking-tight">{listing.name}</div>
            <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
              <span>{listing.publisher}</span>
              {listing.verified && <span className="flex items-center gap-1 text-[#66D9FF]"><Shield className="h-3 w-3" /> Verified</span>}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {installed ? (
              <>
                <button onClick={onOpen} className="h-9 px-4 rounded-lg text-[12.5px] font-medium bg-[#66D9FF] text-[#06212b] hover:brightness-110">Open</button>
                <button onClick={onUninstall} title="Uninstall" className="h-9 w-9 rounded-lg grid place-items-center ring-1 ring-white/10 text-white/55 hover:bg-white/[0.06]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            ) : installing ? (
              <div className="h-9 px-4 rounded-lg text-[12.5px] font-medium bg-white/[0.08] flex items-center gap-2 text-white/70">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {Math.round(progress)}%
              </div>
            ) : (
              <button onClick={onInstall} className="h-9 px-5 rounded-lg text-[12.5px] font-medium bg-[#66D9FF] text-[#06212b] hover:brightness-110 flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Install
              </button>
            )}
          </div>
        </div>
        {installing && (
          <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10">
            <div className="h-full bg-[#66D9FF] transition-[width] duration-100" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div className="p-6 space-y-7">
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Rating" value={`${listing.rating.toFixed(1)} ★`} sub={`${listing.ratingCount.toLocaleString()} ratings`} />
          <Stat label="Version" value={listing.version} sub={`Updated ${listing.updated}`} />
          <Stat label="Age" value={listing.ageRating} sub="Content rating" />
          <Stat label="Category" value={STORE_CATEGORIES.find((c) => c.id === listing.category)!.name} sub={listing.shelf} />
        </div>

        <section>
          <SectionHead title="About" sub="What this application does." />
          <p className="text-[12.5px] leading-relaxed text-white/60 max-w-2xl">{listing.description}</p>
        </section>

        <section>
          <SectionHead title="Screenshots" sub="From the packaged build." />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {listing.screenshots.map((s) => (
              <div key={s.label} className="shrink-0 w-64 h-36 rounded-xl ring-1 ring-white/[0.07] relative overflow-hidden" style={{ background: s.css }}>
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white/70">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div>
            <SectionHead title="System requirements" sub="Verified against this device class." />
            <div className="rounded-xl ring-1 ring-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.05]">
              {listing.requirements.map((r) => (
                <div key={r.label} className="flex items-center justify-between px-3.5 py-2.5 text-[11.5px]">
                  <span className="text-white/45">{r.label}</span>
                  <span className="text-white/80">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHead title="Permissions" sub="Requested from the GhostOS App API." />
            <div className="rounded-xl ring-1 ring-white/[0.07] bg-white/[0.03] divide-y divide-white/[0.05]">
              {listing.permissions.map((p) => (
                <div key={p} className="flex items-center gap-2 px-3.5 py-2.5 text-[11.5px] text-white/70">
                  <Check className="h-3 w-3 text-[#66D9FF]" /> {PERMISSION_LABELS[p]}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHead title="What’s new" sub="Release history." />
          <div className="space-y-3">
            {listing.changelog.map((c) => (
              <div key={c.version} className="rounded-xl ring-1 ring-white/[0.07] bg-white/[0.03] p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-medium">{c.version}</div>
                  <div className="text-[10px] text-white/35">{c.date}</div>
                </div>
                <ul className="mt-2 space-y-1">
                  {c.notes.map((n) => (
                    <li key={n} className="text-[11.5px] text-white/55 flex gap-2"><span className="text-white/25">—</span>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl ring-1 ring-white/[0.07] bg-white/[0.03] p-3">
      <div className="text-[10px] tracking-wide text-white/35 uppercase">{label}</div>
      <div className="text-[13px] font-medium mt-1">{value}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>
    </div>
  );
}
