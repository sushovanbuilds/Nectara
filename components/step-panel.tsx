"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Field, StepDef } from "@/lib/step-defs";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const input = "mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";

function StepForm({ batchCode, step }: { batchCode: string; step: StepDef }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const fld of step.fields) {
      const v = String(f.get(fld.name) ?? "").trim();
      if (v !== "") body[fld.name] = fld.type === "number" ? Number(v) : v;
    }
    setBusy(true);
    const res = await fetch(`/api/batches/${batchCode}/${step.key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (res.ok) { setError(""); toast(`${step.label}: saved to the batch record.`); router.refresh(); }
    else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Could not save");
  }

  const id = (fld: Field) => `${step.key}-${fld.name}`;
  return (
    <form onSubmit={submit} className="space-y-3 border-t border-line pt-4 first:border-0 first:pt-0">
      <h3 className="t-body font-medium">{step.label}</h3>
      {step.fields.map((fld) => (
        <div key={fld.name}>
          <label htmlFor={id(fld)} className="t-small block">{fld.label}{fld.required && <span className="text-terra"> *</span>}</label>
          <input id={id(fld)} name={fld.name} type={fld.type} step={fld.type === "number" ? "any" : undefined} required={fld.required} defaultValue={fld.defaultValue} className={input} />
        </div>
      ))}
      {error && <p role="alert" className="t-small text-terra">{error}</p>}
      <button disabled={busy} className={buttonClass("primary", "md")}>{step.label}</button>
    </form>
  );
}

/** Role-specific actions on a batch. The server decides which steps appear; the API enforces them again. */
export function StepPanel({ batchCode, steps }: { batchCode: string; steps: StepDef[] }) {
  if (!steps.length) return null;
  return (
    <section className="space-y-4 rounded-[10px] border border-line bg-paper p-5" aria-labelledby="steps-h">
      <h2 id="steps-h" className="t-h3">Your actions</h2>
      {steps.map((s) => <StepForm key={s.key} batchCode={batchCode} step={s} />)}
    </section>
  );
}
