import { Chip } from "@/components/ui/chip";
import type { HealthState } from "@/lib/hiveos";

const STATE = {
  STABLE: ["bg-greenbg text-green", "Stable"], WATCH: ["bg-honeybg text-amber-ink", "Watch"],
  STRESSED: ["bg-terrabg text-terra", "Stressed"], CRITICAL: ["bg-terra text-white", "Critical"],
} as const;

/** Same status language as every other chip; Critical is the one solid fill so it stands apart from Stressed. */
export const StateChip = ({ state }: { state: HealthState }) =>
  state === "CRITICAL"
    ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-terra px-3 py-1 font-sans text-xs font-medium tracking-normal text-paper"><span aria-hidden className="size-1.5 rounded-full bg-paper" />Critical</span>
    : <Chip tone={state === "STABLE" ? "green" : state === "WATCH" ? "amber" : "terra"}>{STATE[state][1]}</Chip>;

// Same families as the chips: Stressed is the light terracotta, Critical the solid one.
const COLOR: Record<HealthState, string> = { STABLE: "var(--green)", WATCH: "var(--honey)", STRESSED: "var(--terra-dark)", CRITICAL: "var(--terra)" };

/** Donut of hives by health state, with a text legend so colour is never the only signal. */
export function HealthRing({ counts }: { counts: Record<HealthState, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const R = 42, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label={`${total} hives by health state`}>
        <circle cx="50" cy="50" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
        {total > 0 && (Object.keys(counts) as HealthState[]).map((s) => {
          const len = (counts[s] / total) * C;
          const el = <circle key={s} cx="50" cy="50" r={R} fill="none" stroke={COLOR[s]} strokeWidth="12" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return counts[s] ? el : null;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {(Object.keys(counts) as HealthState[]).map((s) => (
          <li key={s} className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ background: COLOR[s] }} />{STATE[s][1]}: {counts[s]}</li>
        ))}
      </ul>
    </div>
  );
}

const LADDER = ["Manual observation", "Basic sensor", "Multiple sensors", "Sensors plus corroborating inspection"];

export function TrustLadder({ level, confidence }: { level: number; confidence: string }) {
  return (
    <div>
      <ol className="space-y-1.5" aria-label="Trust ladder">
        {LADDER.map((label, i) => (
          <li key={label} className={`flex items-center gap-2 rounded-[10px] px-3 py-1.5 text-sm ${i + 1 <= level ? "bg-greenbg text-green" : "bg-panel text-ink3"}`}>
            <span className="font-medium">{i + 1}</span>{label}{i + 1 === level && <span className="ml-auto text-xs">current</span>}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-ink2">Data confidence: <strong>{confidence}</strong>{level === 0 && " (no data yet)"}</p>
    </div>
  );
}
