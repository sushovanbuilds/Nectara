import { Chip } from "@/components/ui/chip";
import { fmtDateTime } from "@/lib/format";
import type { SealResult } from "@/lib/seal";
import { SealButton } from "./seal-button";

const VIEW = {
  INTACT: { tone: "green", label: "Intact" },
  BROKEN: { tone: "terra", label: "Broken" },
  UNSEALED: { tone: "amber", label: "Not sealed yet" },
} as const;

/** Record seal. Answers "has the record been rewritten?" and nothing about honey purity. */
export function SealPanel({ seal, batchCode, canSeal }: { seal: SealResult; batchCode: string; canSeal: boolean }) {
  const v = VIEW[seal.state];
  return (
    <section className="rounded-[10px] border border-line bg-paper p-5 sm:p-6" aria-labelledby="seal-h">
      <div className="flex items-center justify-between gap-3">
        <h2 id="seal-h" className="t-h3">Record seal</h2>
        <Chip tone={v.tone}>{v.label}</Chip>
      </div>
      <p className="t-caption mt-1 text-ink3">Has the record been rewritten?</p>
      {seal.state === "BROKEN" && seal.firstMismatch && (
        <div role="alert" className="mt-4 rounded-md bg-terrabg p-3 text-terra">
          <p className="t-small font-medium">Broken: record changed after sealing</p>
          <p className="t-small mt-1">First mismatch: event {seal.firstMismatch.eventId}. {seal.firstMismatch.reason}.</p>
        </div>
      )}
      {seal.state === "UNSEALED" && <p className="t-small mt-4 text-ink2">Events are hash-chained, but no Merkle root has been sealed yet.</p>}
      {seal.anchor && (
        <dl className="t-small mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-ink3">Ledger</dt><dd>{seal.anchor.network === "SIMULATED" ? "Simulated ledger" : seal.anchor.network}</dd>
          <dt className="text-ink3">Sealed</dt><dd>{fmtDateTime(seal.anchor.anchoredAt)} · {seal.anchor.eventIds.length} events</dd>
          <dt className="text-ink3">Merkle root</dt><dd className="font-mono text-xs break-all">{seal.anchor.merkleRoot}</dd>
          {seal.newSinceAnchor > 0 && (<><dt className="text-ink3">Since sealing</dt><dd>{seal.newSinceAnchor} newer event{seal.newSinceAnchor > 1 ? "s" : ""}, chained but not yet sealed</dd></>)}
        </dl>
      )}
      <p className="t-caption mt-4 text-ink3">
        The seal shows whether the record has been rewritten. It does not show whether the honey is genuine; only lab evidence for this batch can.
        {seal.anchor?.network === "SIMULATED" && " The ledger is simulated: nothing is written to a public blockchain."}
      </p>
      {canSeal && seal.state !== "BROKEN" && <SealButton batchCode={batchCode} label={seal.state === "UNSEALED" ? "Seal record now" : "Seal again"} />}
    </section>
  );
}
