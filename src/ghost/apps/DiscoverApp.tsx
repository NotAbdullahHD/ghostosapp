import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Gamepad2, Brain, Tv, Wrench, Compass, Shuffle, ExternalLink } from "lucide-react";

interface Item { name: string; url: string; tag: string; color: string; }

const CATS = [
  { id: "tools", name: "TOOLS", icon: Wrench },
  { id: "games", name: "GAMES", icon: Gamepad2 },
  { id: "ai",    name: "AI",    icon: Brain },
  { id: "watch", name: "STREAM", icon: Tv },
  { id: "weird", name: "RABBIT HOLES", icon: Compass },
] as const;

const LIBRARY: Record<typeof CATS[number]["id"], Item[]> = {
  tools: [
    { name: "Photopea",    url: "https://www.photopea.com",    tag: "Photo editor", color: "from-blue-500 to-indigo-700" },
    { name: "Excalidraw",  url: "https://excalidraw.com",      tag: "Whiteboard",   color: "from-violet-500 to-purple-700" },
    { name: "Carbon",      url: "https://carbon.now.sh",       tag: "Code shots",   color: "from-zinc-700 to-black" },
    { name: "tldraw",      url: "https://www.tldraw.com",      tag: "Sketch",       color: "from-sky-500 to-blue-700" },
    { name: "Stackedit",   url: "https://stackedit.io",        tag: "Markdown",     color: "from-emerald-500 to-teal-700" },
    { name: "RegExr",      url: "https://regexr.com",          tag: "Regex tester", color: "from-rose-500 to-red-700" },
  ],
  games: [
    { name: "CineStream",  url: "https://cinesteam.cine-softwares.workers.dev/", tag: "Hidden arcade", color: "from-fuchsia-600 to-purple-800" },
    { name: "Slither.io",  url: "https://slither.io",          tag: "Multiplayer",  color: "from-emerald-500 to-green-700" },
    { name: "Krunker",     url: "https://krunker.io",          tag: "FPS",          color: "from-orange-500 to-red-700" },
    { name: "Drift Hunters", url: "https://driftgame.io",      tag: "Racing",       color: "from-amber-500 to-orange-700" },
    { name: "1v1.LOL",     url: "https://1v1.lol",             tag: "Build battle", color: "from-cyan-500 to-blue-700" },
    { name: "Chess.com",   url: "https://chess.com/play",      tag: "Chess",        color: "from-zinc-700 to-zinc-900" },
  ],
  ai: [
    { name: "ChatGPT",     url: "https://chatgpt.com",         tag: "LLM chat",     color: "from-emerald-500 to-teal-700" },
    { name: "Claude",      url: "https://claude.ai",           tag: "AI assistant", color: "from-orange-500 to-amber-700" },
    { name: "Perplexity",  url: "https://perplexity.ai",       tag: "AI search",    color: "from-sky-500 to-cyan-700" },
    { name: "Suno",        url: "https://suno.com",            tag: "AI music",     color: "from-fuchsia-500 to-pink-700" },
    { name: "Runway",      url: "https://runwayml.com",        tag: "AI video",     color: "from-violet-500 to-purple-700" },
    { name: "HuggingFace", url: "https://huggingface.co",      tag: "Model hub",    color: "from-yellow-500 to-amber-700" },
  ],
  watch: [
    { name: "YouTube",     url: "https://youtube.com",         tag: "Video",        color: "from-red-500 to-rose-700" },
    { name: "Twitch",      url: "https://twitch.tv",           tag: "Live",         color: "from-purple-500 to-violet-700" },
    { name: "Vimeo",       url: "https://vimeo.com",           tag: "Cinematic",    color: "from-cyan-500 to-blue-700" },
    { name: "Internet Archive", url: "https://archive.org",    tag: "Lost media",   color: "from-zinc-600 to-zinc-900" },
  ],
  weird: [
    { name: "Window Swap",   url: "https://window-swap.com",       tag: "Stranger windows", color: "from-emerald-500 to-teal-800" },
    { name: "Pointer Pointer", url: "https://pointerpointer.com",  tag: "Cursor lore",      color: "from-pink-500 to-rose-700" },
    { name: "Radio Garden",   url: "https://radio.garden",         tag: "Global radio",     color: "from-lime-500 to-emerald-700" },
    { name: "The Useless Web", url: "https://theuselessweb.com",   tag: "Random portal",    color: "from-fuchsia-500 to-purple-800" },
    { name: "Neal.fun",       url: "https://neal.fun",             tag: "Tiny worlds",      color: "from-amber-500 to-orange-700" },
    { name: "Wiby",           url: "https://wiby.me",              tag: "Old web",          color: "from-zinc-600 to-zinc-900" },
  ],
};

export function DiscoverApp() {
  const [cat, setCat] = useState<typeof CATS[number]["id"]>("tools");
  const items = LIBRARY[cat];

  const surprise = () => {
    const all = Object.values(LIBRARY).flat();
    const pick = all[Math.floor(Math.random() * all.length)];
    window.open(pick.url, "_blank", "noopener");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0414] via-[#0d0820] to-black text-white overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "linear-gradient(rgba(192,132,252,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,.6) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="pointer-events-none absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent animate-scan" />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-800 flex items-center justify-center ring-1 ring-white/15 shadow-[0_0_22px_rgba(168,85,247,.6)]">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight neon-text">DISCOVER</div>
            <div className="text-[10px] tracking-[0.4em] text-white/50 font-mono">A HIDDEN INTERNET — CURATED BY GHOSTS</div>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={surprise}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full gradient-neon text-xs font-bold shadow-lg shadow-fuchsia-500/40">
            <Shuffle className="h-3.5 w-3.5" /> Surprise me
          </motion.button>
        </div>

        <div className="flex items-center gap-2 mt-5 overflow-x-auto scrollbar-hide">
          {CATS.map((c) => {
            const Icon = c.icon;
            const active = c.id === cat;
            return (
              <motion.button key={c.id} whileTap={{ scale: 0.96 }} onClick={() => setCat(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition ${active ? "gradient-neon text-white shadow-md shadow-fuchsia-500/30" : "glass text-white/60 hover:text-white"}`}>
                <Icon className="h-3 w-3" /> {c.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, i) => (
            <motion.a key={it.name} href={it.url} target="_blank" rel="noreferrer"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-white/10 hover:ring-fuchsia-400/40 transition cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${it.color}`} />
              <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white, transparent 60%)" }} />
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,.16)_50%,transparent_70%)] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Sparkles className="absolute top-3 right-3 h-3.5 w-3.5 text-white/40" />
              <ExternalLink className="absolute top-3 left-3 h-3.5 w-3.5 text-white/40 opacity-0 group-hover:opacity-100 transition" />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
                <div className="text-[9px] font-mono tracking-widest text-fuchsia-300/80">{it.tag.toUpperCase()}</div>
                <div className="text-base font-bold">{it.name}</div>
              </div>
            </motion.a>
          ))}
        </div>
        <div className="mt-8 text-center text-[10px] tracking-[0.4em] text-white/30 font-mono">MORE NODES UNLOCKING…</div>
      </div>
    </div>
  );
}
