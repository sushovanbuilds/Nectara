"use client";

import type { InvestigationCase } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CASE_STATUSES } from "@/lib/cases-constants";

const input = "mt-1.5 block w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";

export function CasePanel({ incidentId, cases }: { incidentId: string; cases: InvestigationCase[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const open = cases.find((c) => c.status !== "RESOLVED");
  const resolved = cases.filter((c) => c.status === "RESOLVED").length;

  async function post(path: string, body: object, done: string) {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { setError(""); setNote(""); toast(done); router.refresh(); }
    else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "That did not save. Try again.");
  }

  return (
    <section className="rounded-[10px] border border-line bg-paper p-5 sm:p-6" aria-labelledby="case-h">
      <h2 id="case-h" className="t-h3">Investigation case</h2>
      {!open ? (
        <>
          <p className="t-small mt-2 text-ink2">No open case. A person opens one to review this cluster; the engine never does.</p>
          <button type="button" className={buttonClass("primary", "md", "mt-4")} onClick={() => post(`/api/incidents/${incidentId}/case`, {}, "Case opened.")}>Open a case</button>
        </>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="t-body block">Status
            <select className={`${input} min-h-11`} value={open.status} onChange={(e) => post(`/api/cases/${open.id}`, { status: e.target.value }, "Status updated.")}>
              {CASE_STATUSES.map((s) => <option key={s} value={s}>{s[0] + s.slice(1).replace("_", " ").toLowerCase()}</option>)}
            </select>
          </label>
          {open.notes
            ? <pre className="t-small max-h-72 overflow-y-auto whitespace-pre-wrap rounded-[10px] bg-panel p-3 font-sans">{open.notes}</pre>
            : <p className="t-small text-ink3">No notes yet.</p>}
          <form onSubmit={(e) => { e.preventDefault(); post(`/api/cases/${open.id}`, { note }, "Note saved."); }}>
            <label className="t-body block" htmlFor="note">Add a note</label>
            <textarea id="note" required maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} className={`${input} py-2`} rows={3} />
            <button className={buttonClass("secondary", "md", "mt-3")}>Save note</button>
          </form>
        </div>
      )}
      {resolved > 0 && <p className="t-caption mt-4 text-ink3">{resolved} earlier case{resolved > 1 ? "s" : ""} resolved.</p>}
      {error && <p role="alert" className="t-small mt-3 text-terra">{error}</p>}
    </section>
  );
}
