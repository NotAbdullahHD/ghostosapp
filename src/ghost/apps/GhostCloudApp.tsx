import { EmbedShell } from "./EmbedShell";

const CLOUD_URL = "https://ghost-mathmulti.zeoghost.workers.dev/";

export function GhostCloudApp() {
  return <EmbedShell appId="ghostcloud" title="GhostCloud" src={CLOUD_URL} externalUrl={CLOUD_URL} />;
}
