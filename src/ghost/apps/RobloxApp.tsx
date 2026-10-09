import { EmbedShell, GhostSpinner, useConnection } from "./EmbedShell";
import { ROBLOX_URL } from "../storeCatalog";

export function RobloxApp() {
  const net = useConnection();
  const slowNet = !net.online || (net.downlink !== undefined && net.downlink < 5);
  const detail = !net.online
    ? "You're offline"
    : net.downlink !== undefined
      ? `connection ≈ ${net.downlink} Mbps${slowNet ? " · may be too slow" : ""}`
      : "cloud stream · needs a fast connection";
  return (
    <EmbedShell
      appId="roblox"
      title="Roblox"
      subtitle="cloud stream"
      src={ROBLOX_URL}
      externalUrl={ROBLOX_URL}
      slowAfterMs={25000}
      slowMessage="Roblox streams from the cloud and needs a fast connection. If it keeps loading, retry or switch to a faster network."
      loading={<GhostSpinner label="Connecting to Roblox" detail={detail} />}
    />
  );
}
