import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { GhostProvider, useGhost } from "@/ghost/store";
import { BootScreen } from "@/ghost/BootScreen";
import { Desktop } from "@/ghost/Desktop";
import { MusicProvider } from "@/ghost/music";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GhostOS — Spectral Desktop Environment" },
      { name: "description", content: "GhostOS is a futuristic browser-based operating system with a cinematic dark interface, neon glow, and a complete glassmorphic desktop experience." },
      { property: "og:title", content: "GhostOS — Spectral Desktop Environment" },
      { property: "og:description", content: "A premium cyberpunk OS in your browser. Apps, windows, dock, GhostAI, and more." },
    ],
  }),
  component: Index,
});

function Shell() {
  const { booted, setBooted, setLocked } = useGhost();
  return (
    <>
      <AnimatePresence>
        {!booted && (
          <BootScreen
            onDone={() => {
              // Land on the lock screen after the boot sequence.
              setLocked(true);
              setBooted(true);
            }}
          />
        )}
      </AnimatePresence>
      {booted && <Desktop />}
    </>
  );
}

function Index() {
  return (
    <GhostProvider>
      <MusicProvider>
        <Shell />
      </MusicProvider>
    </GhostProvider>
  );
}
