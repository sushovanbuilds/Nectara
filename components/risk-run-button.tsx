"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function RiskRunButton() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button" disabled={busy} className={buttonClass("primary")}
        onClick={async () => {
          setBusy(true);
          const res = await fetch("/api/risk/run", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
          setBusy(false);
          const d = (await res.json().catch(() => null)) as { error?: string; scored?: number; alertsRaised?: number; incidentsCreated?: number } | null;
          const text = res.ok ? `Scored ${d?.scored} batches, raised ${d?.alertsRaised} alerts, opened ${d?.incidentsCreated} incidents.` : d?.error ?? "The run failed. Try again.";
          setMsg(text);
          if (res.ok) { toast("Risk engine run complete."); router.refresh(); }
        }}
      >
        {busy ? "Running…" : "Run risk engine"}
      </button>
      {msg && <p className="t-small text-ink2">{msg}</p>}
    </div>
  );
}
