import type { RiskBand } from "@prisma/client";
import { Chip } from "@/components/ui/chip";
import { GROUP_LABEL, type RiskResult } from "@/lib/risk";

const TONE = { LOW: "green", MEDIUM: "amber", HIGH: "terra" } as const;

export const BandChip = ({ band, children }: { band: RiskBand; children?: React.ReactNode }) => (
  <Chip tone={TONE[band]}>{children ?? `${band[0]}${band.slice(1).toLowerCase()} risk`}</Chip>
);

export const RISK_NOTE = "A score orders the investigation queue. A high score is not a verdict of fraud; a person reviews every case.";

/** Every point of a score with its reason, grouped by rule, so nobody has to trust a bare number. */
export function Explain({ res }: { res: RiskResult }) {
  return (
    <div className="mt-3">
      {res.reasons.length === 0 ? <p className="t-small text-ink2">No rules fired for this batch.</p> : (
        <table className="t-small w-full text-left">
          <caption className="sr-only">Points by rule</caption>
          <tbody>
            {res.reasons.map((r, i) => (
              <tr key={i} className="border-t border-line align-top">
                <td className="w-12 py-2 pr-3 font-medium tabular-nums">+{r.points}</td>
                <td className="w-40 py-2 pr-3 text-ink3">{GROUP_LABEL[r.group]}</td>
                <td className="py-2 text-ink2">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="t-caption mt-2 text-ink3">
        {res.groups.filter((g) => g.capped).map((g) => `${GROUP_LABEL[g.group]} is capped at ${g.weight}. `)}
        Rule set {res.ruleSetVersion}. Not evaluated: {res.notEvaluated.join("; ")}.
      </p>
    </div>
  );
}
