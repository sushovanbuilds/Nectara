import Link from "next/link";
import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { BandChip, Explain, RISK_NOTE } from "@/components/risk-ui";
import { RiskRunButton } from "@/components/risk-run-button";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Banner, EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import type { RiskResult } from "@/lib/risk";
import { scoreFromRepo } from "@/lib/risk-engine";

export const metadata = { title: "Risk and incidents · Nectara" };

export default async function Risk() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "risk:read")) return <Denied who="investigators" />;

  const repo = await getRepo();
  const batches = await repo.listBatches();
  const scores = new Map<string, RiskResult>();
  for (const b of batches) scores.set(b.id, await scoreFromRepo(repo, (await repo.getBatchById(b.id))!, batches));
  const code = new Map(batches.map((b) => [b.id, b.code]));
  const queue = batches.map((b) => ({ b, res: scores.get(b.id)! })).sort((x, y) => y.res.score - x.res.score);

  // A cluster's score is its highest-scoring batch, so the queue order is explainable rule by rule.
  const clusters = (await repo.listIncidents()).map((inc) => {
    const ids = [...new Set(inc.alerts.map((a) => a.batchId).filter((x): x is string => !!x))];
    const top = ids.map((id) => ({ id, res: scores.get(id) })).filter((x) => x.res).sort((a, b) => b.res!.score - a.res!.score)[0];
    return { inc, ids, top };
  }).sort((a, b) => (b.top?.res?.score ?? 0) - (a.top?.res?.score ?? 0));

  return (
    <>
      <PageHeader title="Risk and incidents" description="Clusters of related alerts first, then every batch by score." action={can(s.role, "risk:run") ? <RiskRunButton /> : undefined} />
      <Banner tone="info" title="How to read this.">{RISK_NOTE}</Banner>

      <section aria-labelledby="inc-h" className="mt-8">
        <h2 id="inc-h" className="t-h3">Incident clusters</h2>
        <p className="t-caption mt-1 text-ink3">Alerts that share a farm, organisation, lab or batch lineage within 72 hours are grouped. Sorted by the highest batch score in each cluster.</p>
        {clusters.length === 0 ? <div className="mt-4"><EmptyState message="No incident clusters. Run the risk engine to look for related alerts." /></div> : (
          <ul className="mt-4 space-y-4">
            {clusters.map(({ inc, ids, top }) => (
              <li key={inc.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/incidents/${inc.id}`} className="t-h3 underline-offset-4 hover:underline">{inc.title}</Link>
                      <p className="t-small mt-1 text-ink2">{inc.alerts.length} alerts · {ids.length} batches ({ids.map((i) => code.get(i)).join(", ")}) · opened {fmtDate(inc.openedAt)} · {inc.status.toLowerCase()}</p>
                    </div>
                    <span className="flex items-center gap-3">{top?.res && <span className="text-right"><span className="t-h3 block tabular-nums">{top.res.score}</span><span className="t-caption block text-ink3">top batch score</span></span>}<BandChip band={inc.band}>{inc.band[0] + inc.band.slice(1).toLowerCase()} severity</BandChip></span>
                  </div>
                  {top?.res && (
                    <details className="mt-3 border-t border-line pt-3">
                      <summary className="t-small cursor-pointer py-3 text-ink2">Why this score: {code.get(top.id)}, rule by rule</summary>
                      <Explain res={top.res} />
                    </details>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="q-h" className="mt-10">
        <h2 id="q-h" className="t-h3">Batch queue</h2>
        {queue.length === 0 ? <div className="mt-4"><EmptyState message="No batches to score yet." /></div> : (
          <ul className="mt-4 divide-y divide-line rounded-[10px] border border-line bg-paper">
            {queue.map(({ b, res }) => (
              <li key={b.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/batches/${b.code}`} className="font-medium underline-offset-2 hover:underline">{b.code} <span className="t-small font-normal text-ink2">{b.honeyType}</span></Link>
                  <span className="flex items-center gap-2"><span className="t-h3 tabular-nums">{res.score}</span><BandChip band={res.band} /></span>
                </div>
                <details className="mt-1">
                  <summary className="t-small cursor-pointer py-3 text-ink2">Why this score ({res.reasons.length} rule{res.reasons.length === 1 ? "" : "s"} fired)</summary>
                  <Explain res={res} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
