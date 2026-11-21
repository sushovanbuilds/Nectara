import Link from "next/link";
import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { LabForm } from "@/components/lab-form";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import type { Batch } from "@prisma/client";
import { getRepo, type BatchDetail } from "@/lib/repo";
import { summariseLab } from "@/lib/verify";

export const metadata = { title: "Lab · Nectara" };

const TONE = { PASSED: "green", FAILED: "terra", IN_PROGRESS: "amber", NONE: "neutral" } as const;
const LABEL = { PASSED: "Passed", FAILED: "Failed", IN_PROGRESS: "In progress", NONE: "No test" } as const;

export default async function Lab() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "lab:publish")) return <Denied who="the quality lab" />;
  const repo = await getRepo();
  const rows: { b: Batch; d: BatchDetail }[] = [];
  for (const b of await repo.listBatches()) rows.push({ b, d: (await repo.getBatchById(b.id))! });
  const pendingRef = (d: BatchDetail) => d.tests.find((t) => t.status === "IN_PROGRESS")?.labRef;
  const queue = rows.filter(({ d }) => ["IN_PROGRESS", "NONE"].includes(summariseLab(d.tests)));

  return (
    <>
      <PageHeader title="Quality lab" description="Only this workspace can publish purity evidence. Each certificate binds to one batch and cannot be reused." />
      {rows.length === 0 ? <EmptyState message="No batches exist yet. Results can be published once a keeper logs a harvest." /> : (
        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <LabForm
            batches={rows.map(({ b, d }) => ({ code: b.code, honeyType: b.honeyType, pendingRef: pendingRef(d) }))}
            defaultBatch={queue[0]?.b.code}
          />
          <Card as="section" aria-labelledby="queue-h">
            <h2 id="queue-h" className="t-h3">Waiting for a result</h2>
            {queue.length === 0 ? <p className="t-small mt-3 text-ink2">Nothing waiting. Every batch has a final result.</p> : (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {queue.map(({ b, d }) => (
                  <li key={b.id} className="t-small flex items-center justify-between gap-3 py-2.5">
                    <Link href={`/batches/${b.code}`} className="inline-flex min-h-11 items-center font-medium underline-offset-2 hover:underline">{b.code}</Link>
                    <Chip tone={TONE[summariseLab(d.tests)]}>{pendingRef(d) ? `${pendingRef(d)} in progress` : LABEL[summariseLab(d.tests)]}</Chip>
                  </li>
                ))}
              </ul>
            )}
            <h3 className="t-small mt-6 font-medium">All batches</h3>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {rows.map(({ b, d }) => (
                <li key={b.id} className="t-small flex items-center justify-between gap-3 py-2">
                  <Link href={`/batches/${b.code}`} className="inline-flex min-h-11 items-center underline-offset-2 hover:underline">{b.code}</Link>
                  <Chip tone={TONE[summariseLab(d.tests)]}>{LABEL[summariseLab(d.tests)]}</Chip>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
