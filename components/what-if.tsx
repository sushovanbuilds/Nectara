"use client";

import { useState } from "react";
import { type Observation, simulate } from "@/lib/hiveos";
import { StateChip } from "./hive-ui";

/** Runs the pure simulator in the browser. Nothing is sent or stored. */
export function WhatIf({ obs }: { obs: Observation }) {
  const [s, setS] = useState({ tempDeltaC: 3, humidityDelta: 0, activityDelta: 0, days: 5 });
  const { before, after } = simulate(obs, s);
  const slider = (key: keyof typeof s, label: string, min: number, max: number, step: number, unit: string, disabled = false) => (
    <label className="block text-sm">
      <span className="flex justify-between"><span>{label}</span><span className="tabular-nums text-ink2">{s[key] > 0 && key !== "days" ? "+" : ""}{s[key]}{unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={s[key]} disabled={disabled} onChange={(e) => setS({ ...s, [key]: Number(e.target.value) })} className="h-11 w-full accent-[var(--amber)] disabled:opacity-40" />
    </label>
  );
  return (
    <section className="rounded-[10px] border border-line bg-paper p-5 sm:p-6" aria-labelledby="wi-h">
      <h2 id="wi-h" className="t-h3">What if…</h2>
      <p className="mt-1 text-xs text-ink3">A rule-of-thumb projection, not a forecast. Changes ramp in over three days. Nothing is saved.</p>
      <div className="mt-4 space-y-3">
        {slider("tempDeltaC", "Temperature change", -6, 6, 0.5, "°C", obs.tempC === null)}
        {slider("humidityDelta", "Humidity change", -20, 20, 1, "%", obs.humidity === null)}
        {slider("activityDelta", "Activity change", -0.5, 0.5, 0.05, "", obs.activity === null)}
        {slider("days", "For", 1, 14, 1, " days")}
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm" aria-live="polite">
        <span>Now <StateChip state={before.state} /> {before.score}</span><span aria-hidden>→</span><span>Projected <StateChip state={after.state} /> {after.score}</span>
      </div>
    </section>
  );
}
