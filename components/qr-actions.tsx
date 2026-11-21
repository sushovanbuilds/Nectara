"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Issue a new QR label for a batch, or revoke the active one. */
export function QrActions({ batchCode, activeToken }: { batchCode: string; activeToken?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function call(path: string, body: object) {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast(path.endsWith("revoke") ? "QR label revoked." : "QR label issued."); router.refresh(); }
    else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Request failed");
  }

  return (
    <div className="mt-4">
      {activeToken ? (
        <button className="rounded-md border border-terra px-3 py-1.5 text-sm text-terra hover:bg-terrabg" onClick={() => call("/api/qr/revoke", { token: activeToken })}>Revoke label</button>
      ) : (
        <button className={buttonClass("primary", "sm")} onClick={() => call("/api/qr", { batchCode })}>Issue QR label</button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-terra">{error}</p>}
    </div>
  );
}
