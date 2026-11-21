"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/toast";

export function SealButton({ batchCode, label }: { batchCode: string; label: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <div className="mt-4">
      <button
        className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel"
        onClick={async () => {
          const res = await fetch("/api/anchor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchCode }) });
          if (res.ok) { toast("Record sealed."); router.refresh(); }
          else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not seal");
        }}
      >
        {label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-terra">{error}</p>}
    </div>
  );
}
