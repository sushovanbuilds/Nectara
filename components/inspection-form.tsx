"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function InspectionForm({ hiveCode }: { hiveCode: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch(`/api/hives/${hiveCode}/inspections`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ queenSeen: f.get("queenSeen") === "yes", broodPattern: f.get("broodPattern"), notes: f.get("notes") }),
    });
    if (res.ok) { setError(""); e.currentTarget.reset(); toast("Inspection saved. Hive health updated."); router.refresh(); }
    else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not save");
  }
  const input = "mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";
  return (
    <form onSubmit={submit} className="rounded-[10px] border border-line bg-paper p-5 sm:p-6">
      <h2 className="t-h3">Log an inspection</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Queen seen<select name="queenSeen" className={input}><option value="yes">Yes</option><option value="no">No</option></select></label>
        <label className="block text-sm">Brood pattern<select name="broodPattern" className={input}><option>solid</option><option>patchy</option><option>spotty</option></select></label>
      </div>
      <label className="mt-3 block text-sm">Notes<input name="notes" maxLength={1000} className={input} /></label>
      {error && <p role="alert" className="mt-2 text-sm text-terra">{error}</p>}
      <button className={buttonClass("primary", "md", "mt-3")}>Save inspection</button>
    </form>
  );
}
