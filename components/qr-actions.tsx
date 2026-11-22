"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Issue a new QR label for a batch, or revoke the active one. Revoking asks for confirmation first. */
export function QrActions({ batchCode, activeToken }: { batchCode: string; activeToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function call(path: string, body: object) {
    setBusy(true);
    setError("");
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    setConfirming(false);
    if (res.ok) { toast(path.endsWith("revoke") ? "QR label revoked." : "QR label issued."); router.refresh(); }
    else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Request failed");
  }

  return (
    <div className="mt-4">
      {!activeToken ? (
        <button type="button" disabled={busy} className={buttonClass("primary")} onClick={() => call("/api/qr", { batchCode })}>
          {busy ? "Issuing…" : "Issue QR label"}
        </button>
      ) : confirming ? (
        <div role="group" aria-label="Confirm revoking the label" className="space-y-3">
          <p className="t-small text-ink2">Anyone who scans this label afterwards will see it as revoked. Continue?</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} className={buttonClass("danger")} onClick={() => call("/api/qr/revoke", { token: activeToken })}>
              {busy ? "Revoking…" : "Yes, revoke label"}
            </button>
            <button type="button" disabled={busy} className={buttonClass("ghost")} onClick={() => setConfirming(false)}>Keep label</button>
          </div>
        </div>
      ) : (
        <button type="button" className={buttonClass("danger")} onClick={() => setConfirming(true)}>Revoke label</button>
      )}
      {error && <p role="alert" className="t-small mt-2 text-terra">{error}</p>}
    </div>
  );
}
