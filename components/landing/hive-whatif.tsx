"use client";

import { useState } from "react";
import { StateChip } from "@/components/hive-ui";
import { type Observation, simulate } from "@/lib/hiveos";

/** Runs the real HIVEOS simulator on sample hive A-105. Labelled as an illustration: it predicts nothing about a real hive. */
export function HiveWhatIf({ obs }: { obs: Observation }) {
  const [delta, setDelta] = useState(3);
  const { before, after } = simulate(obs, { tempDeltaC: delta, humidityDelta: 0, activityDelta: 0, days: 5 });
  return (
    <div className="rounded-[10px] border border-line bg-paper p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <label htmlFor="whatif" className="t-small font-medium">What if: +{delta}°C for 5 days</label>
        <span className="t-caption italic text-ink3">Illustration · sample hive A-105</span>
      </div>
      <input id="whatif" type="range" min={0} max={6} step={0.5} value={delta} onChange={(e) => setDelta(Number(e.target.value))} className="mt-1 h-11 w-full accent-[var(--amber)]" />
      <p className="t-small mt-3 flex flex-wrap items-center gap-2 text-ink2" aria-live="polite">
        Now <StateChip state={before.state} /> <span aria-hidden>→</span> projected <StateChip state={after.state} /> <span className="text-ink3">({after.score}/100)</span>
      </p>
    </div>
  );
}
