import { useEffect, useState } from "react";

interface BatteryStatus extends EventTarget { level: number; charging: boolean }
export function useDeviceStatus() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    let disposed = false;
    let cleanupBattery = () => {};
    const device = navigator as Navigator & { getBattery?: () => Promise<BatteryStatus> };
    device.getBattery?.().then((value) => {
      if (disposed) return;
      const update = () => setBattery({ level: Math.round(value.level * 100), charging: value.charging });
      update();
      value.addEventListener("levelchange", update);
      value.addEventListener("chargingchange", update);
      cleanupBattery = () => { value.removeEventListener("levelchange", update); value.removeEventListener("chargingchange", update); };
    }).catch(() => {});
    return () => { disposed = true; cleanupBattery(); window.removeEventListener("online", updateNetwork); window.removeEventListener("offline", updateNetwork); };
  }, []);
  return { online, battery };
}