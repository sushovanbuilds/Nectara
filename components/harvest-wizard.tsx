"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cx } from "@/lib/cx";

const KEY = "nectara:harvest-draft";
const STEPS = ["Hive", "Quantity and date", "Origin", "Review"] as const;
type Form = { hiveCode: string; kg: string; harvestedOn: string; floralSource: string; honeyType: string };

// Drafts live only in this browser. Storage can be blocked (private mode), so every access is guarded.
const readDraft = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const writeDraft = (f: Form) => { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch { /* storage unavailable */ } };
const clearDraft = () => { try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };
const noSubscribe = () => () => {};

const input = "mt-1.5 block min-h-12 w-full rounded-[10px] border border-line2 bg-paper px-4 t-body";

export function HarvestWizard({ hives, today }: { hives: { code: string; farm: string }[]; today: string }) {
  const router = useRouter();
  const blank: Form = { hiveCode: hives[0]?.code ?? "", kg: "", harvestedOn: today, floralSource: "", honeyType: "" };
  const [f, setF] = useState<Form>(blank);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const saved = useSyncExternalStore(noSubscribe, readDraft, () => null);
  const heading = useRef<HTMLHeadingElement>(null);

  const set = (k: keyof Form, v: string) => {
    const next = { ...f, [k]: v };
    setF(next);
    writeDraft(next);
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function validate(s: number): boolean {
    const e: typeof errors = {};
    if (s === 0 && !hives.some((h) => h.code === f.hiveCode)) e.hiveCode = "Choose the hive this honey came from.";
    if (s === 1) {
      const kg = Number(f.kg);
      if (!f.kg || !Number.isFinite(kg) || kg <= 0) e.kg = "Enter the quantity in kilograms, more than 0.";
      else if (kg > 10000) e.kg = "That is more than 10,000 kg. Check the number.";
      if (!f.harvestedOn) e.harvestedOn = "Enter the harvest date.";
      else if (f.harvestedOn > today) e.harvestedOn = "The harvest date can’t be in the future.";
    }
    if (s === 2) {
      if (!f.floralSource.trim()) e.floralSource = "Name the main flower source, for example Mustard.";
      if (!f.honeyType.trim()) e.honeyType = "Name the honey type, for example Mustard honey.";
    }
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`h-${first}`)?.focus();
    return !first;
  }

  const go = (s: number) => { setStep(s); setServerError(""); requestAnimationFrame(() => heading.current?.focus()); };

  async function submit() {
    setBusy(true);
    setServerError("");
    const res = await fetch("/api/harvests", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ hiveCode: f.hiveCode, kg: Number(f.kg), harvestedOn: f.harvestedOn, floralSource: f.floralSource.trim(), honeyType: f.honeyType.trim() }),
    });
    const data = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;
    setBusy(false);
    if (res.ok && data?.code) {
      clearDraft();
      toast(`Harvest logged as batch ${data.code}.`);
      router.push(`/batches/${data.code}`);
    } else setServerError(data?.error ?? "The harvest could not be saved. Check your connection and try again; your draft is kept.");
  }

  const err = (k: keyof Form) => errors[k] && <p id={`e-${k}`} className="t-small mt-1.5 text-terra">{errors[k]}</p>;
  const field = (k: keyof Form) => ({ id: `h-${k}`, "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `e-${k}` : undefined });
  const hive = hives.find((h) => h.code === f.hiveCode);

  return (
    <div className="max-w-2xl">
      {saved && !draftDismissed && saved !== JSON.stringify(f) && (
        <div role="note" className="t-small mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-line2 bg-panel px-4 py-3">
          <span>You have an unsaved harvest draft on this device.</span>
          <span className="flex gap-2">
            <button type="button" className={buttonClass("secondary", "sm")} onClick={() => { try { setF({ ...blank, ...JSON.parse(saved) }); } catch { /* corrupt draft */ } setDraftDismissed(true); }}>Restore draft</button>
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => { clearDraft(); setDraftDismissed(true); }}>Discard</button>
          </span>
        </div>
      )}

      <ol aria-label="Steps" className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="min-w-0">
            <span className={cx("block h-1 rounded-full", i <= step ? "bg-amber" : "bg-line")} />
            <span className={cx("t-caption mt-2 block leading-snug", i === step ? "font-medium text-ink" : "text-ink3")}>{i + 1}. {label}</span>
          </li>
        ))}
      </ol>

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (step < 3) { if (validate(step)) go(step + 1); } else submit(); }}
        className="rounded-[10px] border border-line bg-paper p-5 sm:p-7"
      >
        <h2 ref={heading} tabIndex={-1} className="t-h3 outline-none">Step {step + 1} of 4 · {STEPS[step]}</h2>

        {step === 0 && (
          <fieldset className="mt-5" aria-describedby={errors.hiveCode ? "e-hiveCode" : undefined}>
            <legend className="t-body text-ink2">Which hive did this honey come from?</legend>
            {hives.length === 0 ? <p className="t-body mt-3">You have no hives yet. Register a hive before logging a harvest.</p> : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {hives.map((h, i) => (
                  <label key={h.code} className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3", f.hiveCode === h.code ? "border-ink bg-panel" : "border-line2")}>
                    <input type="radio" name="hive" value={h.code} checked={f.hiveCode === h.code} onChange={() => set("hiveCode", h.code)} id={i === 0 ? "h-hiveCode" : undefined} className="size-5 accent-[var(--ink)]" />
                    <span><span className="t-body block font-medium">{h.code}</span><span className="t-small text-ink2">{h.farm}</span></span>
                  </label>
                ))}
              </div>
            )}
            {err("hiveCode")}
          </fieldset>
        )}

        {step === 1 && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="t-body block">Quantity (kg)
              <input {...field("kg")} type="number" inputMode="decimal" min="0.1" step="0.1" value={f.kg} onChange={(e) => set("kg", e.target.value)} className={input} />
              {err("kg")}
            </label>
            <label className="t-body block">Harvest date
              <input {...field("harvestedOn")} type="date" max={today} value={f.harvestedOn} onChange={(e) => set("harvestedOn", e.target.value)} className={input} />
              {err("harvestedOn")}
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-5">
            <p className="t-small rounded-[10px] bg-panel px-4 py-3 text-ink2">Origin: <strong className="font-medium text-ink">{hive?.farm}</strong>, from hive {f.hiveCode}.</p>
            <label className="t-body block">Main flower source
              <input {...field("floralSource")} value={f.floralSource} onChange={(e) => set("floralSource", e.target.value)} list="floral" className={input} placeholder="Mustard" />
              <datalist id="floral"><option value="Mustard" /><option value="Litchi" /><option value="Acacia" /><option value="Khalsi mangrove" /><option value="Multiflora" /></datalist>
              {err("floralSource")}
            </label>
            <label className="t-body block">Honey type
              <input {...field("honeyType")} value={f.honeyType} onChange={(e) => set("honeyType", e.target.value)} className={input} placeholder="Mustard honey" />
              {err("honeyType")}
            </label>
          </div>
        )}

        {step === 3 && (
          <dl className="t-body mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 border-y border-line py-4">
            <dt className="text-ink2">Hive</dt><dd>{f.hiveCode} · {hive?.farm}</dd>
            <dt className="text-ink2">Quantity</dt><dd>{f.kg} kg</dd>
            <dt className="text-ink2">Harvested</dt><dd>{f.harvestedOn}</dd>
            <dt className="text-ink2">Flower source</dt><dd>{f.floralSource}</dd>
            <dt className="text-ink2">Honey type</dt><dd>{f.honeyType}</dd>
          </dl>
        )}

        {serverError && <p role="alert" className="t-small mt-4 rounded-[10px] bg-terrabg px-3 py-2 text-terra">{serverError}</p>}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? <button type="button" onClick={() => go(step - 1)} className={buttonClass("ghost", "lg")}>Back</button> : <span />}
          <button type="submit" disabled={busy || hives.length === 0} className={buttonClass("primary", "lg")}>
            {step < 3 ? "Next" : busy ? "Logging…" : "Log harvest"}
          </button>
        </div>
        <p className="t-caption mt-4 text-ink3">Your answers are kept as a draft on this device until the harvest is logged.</p>
      </form>
    </div>
  );
}
