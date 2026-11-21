"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";

const input = "mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";

export function BlendForm({ batchCodes }: { batchCodes: string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState([{ code: batchCodes[0] ?? "", ratioPct: 50 }, { code: batchCodes[1] ?? batchCodes[0] ?? "", ratioPct: 50 }]);
  const [error, setError] = useState("");
  const total = rows.reduce((t, r) => t + (Number(r.ratioPct) || 0), 0);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/batches/blend", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ honeyType: f.get("honeyType"), kg: Number(f.get("kg")), parents: rows.map((r) => ({ code: r.code, ratioPct: Number(r.ratioPct) })) }),
    });
    const d = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;
    if (res.ok && d?.code) router.push(`/batches/${d.code}`);
    else setError(d?.error ?? "Could not create blend");
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[10px] border border-line bg-paper p-5">
      <h2 className="t-h3">Create a blend</h2>
      <p className="text-xs text-ink3">Only batches in your custody. Ratios must add up to 100%.</p>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_6rem] gap-3">
          <label className="block text-sm">Parent batch {i + 1}
            <select value={r.code} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} className={input}>{batchCodes.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="block text-sm">Ratio %
            <input type="number" min="1" max="99" step="any" value={r.ratioPct} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, ratioPct: Number(e.target.value) } : x)))} className={input} />
          </label>
        </div>
      ))}
      <p className={`text-sm ${Math.abs(total - 100) < 0.01 ? "text-green" : "text-terra"}`} aria-live="polite">Total: {total}%</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">Honey type<input name="honeyType" required defaultValue="Blended honey" className={input} /></label>
        <label className="block text-sm">Quantity (kg)<input name="kg" type="number" min="0.1" step="any" required className={input} /></label>
      </div>
      {error && <p role="alert" className="text-sm text-terra">{error}</p>}
      <button className={buttonClass("primary", "md")}>Create blend</button>
    </form>
  );
}
