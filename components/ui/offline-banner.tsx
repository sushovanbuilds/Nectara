"use client";

import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};

/** Field use: says plainly when the connection is gone. Harvest drafts are kept on the device; other writes wait for the connection. */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="alert" className="t-small border-b border-amber bg-honeybg px-4 py-2 text-center text-amber-ink">
      You are offline. Harvest drafts are saved on this device; other changes will need a connection.
    </div>
  );
}
