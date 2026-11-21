"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Banner } from "@/components/ui/states";
import { toast } from "@/components/ui/toast";

const input = "mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";
export interface LabBatch { code: string; honeyType: string; pendingRef?: string }

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Select batch → certificate → values. Warns before a certificate already used elsewhere is attached. */
export function LabForm({ batches, defaultBatch }: { batches: LabBatch[]; defaultBatch?: string }) {
  const router = useRouter();
  const [batchCode, setBatchCode] = useState(defaultBatch ?? batches[0]?.code ?? "");
  const pending = batches.find((b) => b.code === batchCode)?.pendingRef;
  const [labRef, setLabRef] = useState(pending ?? "");
  const [cert, setCert] = useState("");
  const [usedOn, setUsedOn] = useState<string | null>(null);
  const [file, setFile] = useState<{ filename: string; sha256: string } | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  async function check(value: string) {
    setUsedOn(null);
    if (!value.trim()) return;
    const r = await fetch(`/api/lab/check?cert=${encodeURIComponent(value.trim())}`);
    if (r.ok) setUsedOn(((await r.json()) as { usedOn: string | null }).usedOn);
  }

  async function onFile(f: File | undefined) {
    if (!f) return setFile(null);
    setFile({ filename: f.name, sha256: hex(await crypto.subtle.digest("SHA-256", await f.arrayBuffer())) });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const n = (k: string) => (String(fd.get(k)).trim() === "" ? undefined : Number(fd.get(k)));
    setBusy(true);
    const res = await fetch("/api/lab", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ batchCode, labRef, status: fd.get("status"), certificateRef: cert, certificateFile: file ?? undefined, results: { moisturePct: n("moisturePct"), hmfMgKg: n("hmfMgKg") } }),
    });
    setBusy(false);
    const d = (await res.json().catch(() => null)) as { error?: string; labRef?: string } | null;
    if (res.ok) {
      setError(""); setSaved(`Saved ${d?.labRef} for ${batchCode}.`); toast(`Lab result ${d?.labRef} published.`);
      setCert(""); setFile(null); setUsedOn(null); form.reset(); router.refresh();
    } else { setSaved(""); setError(d?.error ?? "The result could not be saved. Try again."); }
  }

  const reused = usedOn && usedOn !== batchCode;
  return (
    <form onSubmit={submit} className="space-y-6 rounded-[10px] border border-line bg-paper p-5 sm:p-7">
      <section aria-labelledby="l1">
        <h2 id="l1" className="t-h3"><span className="text-amber-ink">1.</span> Batch</h2>
        <label className="t-body mt-3 block">Batch tested
          <select name="batchCode" value={batchCode} onChange={(e) => { setBatchCode(e.target.value); setLabRef(batches.find((b) => b.code === e.target.value)?.pendingRef ?? ""); }} className={input}>
            {batches.map((b) => <option key={b.code} value={b.code}>{b.code} · {b.honeyType}{b.pendingRef ? ` · ${b.pendingRef} in progress` : ""}</option>)}
          </select>
        </label>
        {pending && <p className="t-small mt-2 text-ink2">Finalising {pending}, which is in progress for this batch.</p>}
      </section>

      <section aria-labelledby="l2" className="border-t border-line pt-6">
        <h2 id="l2" className="t-h3"><span className="text-amber-ink">2.</span> Certificate</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="t-body block">Certificate reference
            <input value={cert} onChange={(e) => { setCert(e.target.value); setUsedOn(null); }} onBlur={(e) => check(e.target.value)} placeholder="Needed for a final result" className={input} aria-describedby={reused ? "cert-warn" : undefined} />
          </label>
          <label className="t-body block">Certificate file (optional)
            <input type="file" accept="application/pdf,image/*" onChange={(e) => onFile(e.target.files?.[0])} className="t-small mt-1.5 block w-full file:mr-3 file:min-h-11 file:rounded-[10px] file:border file:border-line2 file:bg-panel file:px-3 file:text-ink" />
          </label>
        </div>
        {reused && <div id="cert-warn" className="mt-3"><Banner tone="warning" title="Already used.">Certificate {cert} is attached to {usedOn}. A certificate can belong to one batch only, so saving will be refused and flagged to investigators.</Banner></div>}
        {file && <p className="t-small mt-3 text-ink2">Fingerprint <span className="font-mono">{file.sha256.slice(0, 8)}…{file.sha256.slice(-8)}</span> for {file.filename}. Only this fingerprint is stored, not the file, so a copied file is detected on any other batch.</p>}
      </section>

      <section aria-labelledby="l3" className="border-t border-line pt-6">
        <h2 id="l3" className="t-h3"><span className="text-amber-ink">3.</span> Values</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="t-body block">Lab reference<input value={labRef} onChange={(e) => setLabRef(e.target.value)} required placeholder="LAB-2026-000" className={input} /></label>
          <label className="t-body block">Result
            <select name="status" defaultValue="PASSED" className={input}><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="IN_PROGRESS">Still in progress</option></select>
          </label>
          <label className="t-body block">Moisture (%)<input name="moisturePct" type="number" step="any" inputMode="decimal" className={input} /></label>
          <label className="t-body block">HMF (mg/kg)<input name="hmfMgKg" type="number" step="any" inputMode="decimal" className={input} /></label>
        </div>
      </section>

      {error && <p role="alert" className="t-small rounded-md bg-terrabg px-3 py-2 text-terra">{error}</p>}
      {saved && <p className="t-small rounded-md bg-greenbg px-3 py-2 text-green">{saved}</p>}
      <button disabled={busy} className={buttonClass("primary", "lg")}>{busy ? "Publishing…" : "Publish result"}</button>
    </form>
  );
}
