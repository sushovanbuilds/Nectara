"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function SealButton({ batchCode, label }: { batchCode: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4">
      <button
        type="button" disabled={busy} className={buttonClass("secondary")}
        onClick={async () => {
          setBusy(true);
          setError("");
          const res = await fetch("/api/anchor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchCode }) });
          setBusy(false);
          if (res.ok) { toast("Record sealed."); router.refresh(); }
          else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not seal");
        }}
      >
        {busy ? "Sealing…" : label}
      </button>
      {error && <p role="alert" className="t-small mt-2 text-terra">{error}</p>}
    </div>
  );
}
