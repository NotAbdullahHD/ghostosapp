import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { GhostProvider, useGhost } from "@/ghost/store";
import { BootScreen } from "@/ghost/BootScreen";
import { Desktop } from "@/ghost/Desktop";
import { MusicProvider } from "@/ghost/music";
import { PersonalizationProvider } from "@/ghost/PersonalizationProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "GhostOS — Your Browser Desktop" },
      { name: "description", content: "GhostOS brings a customized desktop, music, notes, files and apps to your browser." },
      { property: "og:title", content: "GhostOS — Your Browser Desktop" },
      { property: "og:description", content: "A minimal desktop with live music, useful apps and your own wallpapers." },
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
        <PersonalizationProvider>
        <Shell />
        </PersonalizationProvider>
      </MusicProvider>
    </GhostProvider>
  );
}
