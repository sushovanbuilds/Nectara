import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { LabCard } from "@/components/lab-card";
import { QrSection } from "@/components/qr-section";
import { SealPanel } from "@/components/seal-panel";
import { PageHeader } from "@/components/shell/page-header";
import { StepPanel } from "@/components/step-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { cx } from "@/lib/cx";
import { describePayload, EVENT_LABEL, fmtDate, fmtDateTime } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { verifySeal } from "@/lib/seal";
import { stepsFor } from "@/lib/step-defs";
import { holderOrgId } from "@/lib/trace";
import { summariseLab } from "@/lib/verify";

const STAGES = [
  ["HIVE", "Hive"], ["HARVEST", "Harvest"], ["COLLECTION", "Collection"], ["QUALITY_TEST", "Lab test"],
  ["PROCESSING", "Processing"], ["PACKAGING", "Packaging"], ["SHIPMENT", "Shipment"],
] as const;
type StageState = "done" | "current" | "todo";

export default async function BatchPage(props: PageProps<"/batches/[code]">) {
  await connection();
  const { code } = await props.params;
  const repo = await getRepo();
  const b = await repo.getBatch(code);
  if (!b) notFound();
  const session = await currentSession();
  const seal = verifySeal(b.events, b.anchors);
  const holder = holderOrgId(b);
  const steps = session ? stepsFor(session.role, holder === session.orgId) : [];
  const tokens = await repo.listQrForBatch(b.id);
  const h = await headers();
  const baseUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const codeById = new Map((await repo.listBatches()).map((x) => [x.id, x.code]));
  const orgName = new Map((await repo.listOrgs()).map((o) => [o.id, o.name]));
  const actor = new Map<string, string>();
  for (const id of new Set(b.events.map((e) => e.actorId))) actor.set(id, (await repo.findUserById(id))?.name ?? id);

  const lab = summariseLab(b.tests);
  const seen = new Set(b.events.map((e) => e.type));
  const stageState = (type: string): StageState =>
    type === "QUALITY_TEST" ? (lab === "PASSED" || lab === "FAILED" ? "done" : lab === "IN_PROGRESS" ? "current" : "todo") : seen.has(type as never) ? "done" : "todo";
  const canIssue = !!session && can(session.role, "qr:issue") && holder === session.orgId && !tokens.some((t) => !t.revokedAt);

  return (
    <>
      <PageHeader
        title={b.code}
        description={`${b.honeyType} · ${b.kg} kg · ${b.farm.name}, ${b.farm.state} · created ${fmtDate(b.createdAt)} · held by ${orgName.get(holder) ?? holder}`}
        action={canIssue ? <Button href="#qr">Issue QR label</Button> : undefined}
      />

      <ol aria-label="Traceability stages" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STAGES.map(([type, label], i) => {
          const st = stageState(type);
          return (
            <li key={type} className={cx("rounded-[10px] border p-3", st === "done" ? "border-line bg-paper" : st === "current" ? "border-amber bg-honeybg" : "border-dashed border-line2")}>
              <p className="t-caption text-ink3">Step {i + 1}</p>
              <p className="t-small font-medium">{label}</p>
              <p className={cx("t-caption mt-0.5", st === "done" ? "text-green" : st === "current" ? "text-amber-ink" : "text-ink3")}>
                {st === "done" ? "Recorded" : st === "current" ? "In progress" : "Not yet"}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <LabCard status={lab} tests={b.tests} />
        <SealPanel seal={seal} batchCode={b.code} canSeal={!!session && can(session.role, "seal:anchor")} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card as="section" aria-labelledby="log-h">
            <h2 id="log-h" className="t-h3">Event log</h2>
            <p className="t-caption mt-1 text-ink3">Append-only. Each event stores the hash of the one before it.</p>
            <div role="region" aria-label="Event log, scrollable" tabIndex={0} className="mt-4 overflow-x-auto">
              <table className="t-small w-full min-w-[40rem] text-left">
                <thead className="t-caption text-ink3">
                  <tr className="border-b border-line"><th scope="col" className="py-2 pr-3 font-medium">Event</th><th scope="col" className="py-2 pr-3 font-medium">Detail</th><th scope="col" className="py-2 pr-3 font-medium">Actor</th><th scope="col" className="py-2 pr-3 font-medium">When</th><th scope="col" className="py-2 font-medium">Hash</th></tr>
                </thead>
                <tbody>
                  {b.events.map((e) => (
                    <tr key={e.id} className="border-b border-line align-top last:border-0">
                      <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{EVENT_LABEL[e.type]}</td>
                      <td className="py-2.5 pr-3 text-ink2">{describePayload(e.payload) || "–"}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-ink2">{actor.get(e.actorId)}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-ink3">{fmtDateTime(e.createdAt)}</td>
                      <td className="py-2.5 font-mono text-xs whitespace-nowrap text-ink3" title={`prev ${e.prevHash}\nhash ${e.hash}`}>{e.hash.slice(0, 8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card as="section" aria-labelledby="custody-h">
            <h2 id="custody-h" className="t-h3">Custody</h2>
            {b.custody.length === 0 ? <p className="t-small mt-3 text-ink2">Still with {orgName.get(b.farm.orgId) ?? "the keeper"}. No hand-off recorded yet.</p> : (
              <ol className="mt-3 divide-y divide-line border-y border-line">
                {b.custody.map((c) => (
                  <li key={c.id} className="t-small flex flex-wrap justify-between gap-x-4 py-2.5">
                    <span><span className="text-ink2">{orgName.get(c.fromOrgId) ?? c.fromOrgId}</span> → <span className="font-medium">{orgName.get(c.toOrgId) ?? c.toOrgId}</span>{c.note && <span className="text-ink3"> · {c.note}</span>}</span>
                    <span className="text-ink3">{fmtDate(c.at)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {(b.parentLinks.length > 0 || b.childLinks.length > 0) && (
            <Card as="section" aria-labelledby="lineage-h">
              <h2 id="lineage-h" className="t-h3">Lineage</h2>
              <ul className="t-small mt-3 space-y-1.5 text-ink2">
                {b.parentLinks.map((l) => <li key={l.id}><span className="font-medium text-ink">{l.ratioPct}%</span> from batch {codeById.get(l.parentId) ?? l.parentId}</li>)}
                {b.childLinks.map((l) => <li key={l.id}><span className="font-medium text-ink">{l.ratioPct}%</span> of blend {codeById.get(l.childId) ?? l.childId}</li>)}
              </ul>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <StepPanel batchCode={b.code} steps={steps} />
          <div id="qr" className="scroll-mt-20">
            <QrSection batchCode={b.code} tokens={tokens} baseUrl={baseUrl} canIssue={!!session && can(session.role, "qr:issue")} canRevoke={!!session && can(session.role, "qr:revoke")} />
          </div>
        </aside>
      </div>
    </>
  );
}
