import type { LabStatus } from "@prisma/client";
import { Chip } from "@/components/ui/chip";
import { fmtDate } from "@/lib/format";

const TONE = { PASSED: "green", FAILED: "terra", IN_PROGRESS: "amber", NONE: "neutral" } as const;
const LABEL = { PASSED: "Passed", FAILED: "Failed", IN_PROGRESS: "In progress", NONE: "No result yet" } as const;

export interface LabRow { labRef: string; certificateRef: string | null; status: LabStatus; testedAt: Date | null }

/** Lab evidence. Answers "is the honey genuine?" for this one batch. Never merged with the record seal. */
export function LabCard({ status, tests }: { status: LabStatus | "NONE"; tests: LabRow[] }) {
  return (
    <section className="rounded-[10px] border border-line bg-paper p-5 sm:p-6" aria-labelledby="lab-h">
      <div className="flex items-center justify-between gap-3">
        <h2 id="lab-h" className="t-h3">Lab evidence</h2>
        <Chip tone={TONE[status]}>{LABEL[status]}</Chip>
      </div>
      <p className="t-caption mt-1 text-ink3">Is the honey genuine?</p>
      {tests.length === 0 ? (
        <p className="t-small mt-4 text-ink2">No lab test recorded for this batch yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {tests.map((t) => (
            <li key={t.labRef} className="t-small flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span>
                <span className="font-medium">{t.status === "IN_PROGRESS" ? `Lab test in progress (${t.labRef})` : t.labRef}</span>
                <span className="block text-ink2">{t.certificateRef ? `Certificate ${t.certificateRef}` : "Certificate pending"}{t.testedAt && ` · tested ${fmtDate(t.testedAt)}`}</span>
              </span>
              {tests.length > 1 && <Chip tone={TONE[t.status]}>{LABEL[t.status]}</Chip>}
            </li>
          ))}
        </ul>
      )}
      <p className="t-caption mt-4 text-ink3">Only a lab certificate issued for this exact batch can show whether the honey is genuine.</p>
    </section>
  );
}
