import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ExplainCard } from "@/components/ai/explain-card";
import { CasePanel } from "@/components/case-panel";
import { aiConfigured } from "@/lib/ai/providers";
import { Denied } from "@/components/denied";
import { BandChip, Explain, RISK_NOTE } from "@/components/risk-ui";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Banner } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { scoreFromRepo } from "@/lib/risk-engine";

const TONE = { LOW: "green", MEDIUM: "amber", HIGH: "terra" } as const;

export default async function IncidentPage(props: PageProps<"/incidents/[id]">) {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "risk:read")) return <Denied who="investigators" />;

  const { id } = await props.params;
  const repo = await getRepo();
  const inc = await repo.getIncident(id);
  if (!inc) notFound();
  const cases = await repo.listCases(id);
  const batchIds = [...new Set(inc.alerts.map((a) => a.batchId).filter((x): x is string => !!x))];
  const batches = await repo.listBatches();
  const linked = [];
  for (const bid of batchIds) {
    const d = await repo.getBatchById(bid);
    if (d) linked.push({ d, res: await scoreFromRepo(repo, d, batches) });
  }
  linked.sort((a, b) => b.res.score - a.res.score);

  return (
    <>
      <PageHeader
        title={inc.title}
        description={<span className="flex flex-wrap items-center gap-2"><BandChip band={inc.band}>{inc.band[0] + inc.band.slice(1).toLowerCase()} severity</BandChip> {inc.alerts.length} alerts · opened {fmtDate(inc.openedAt)} · {inc.status.toLowerCase()}</span>}
      />
      <Banner tone="info">{RISK_NOTE}</Banner>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card as="section" aria-labelledby="alerts-h">
            <h2 id="alerts-h" className="t-h3">Alerts in this cluster</h2>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {[...inc.alerts].sort((a, b) => +a.createdAt - +b.createdAt).map((a) => (
                <li key={a.id} className="t-small flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
                  <span className="min-w-0"><span className="block font-medium">{a.kind.toLowerCase().replaceAll("_", " ")}</span><span className="text-ink2">{a.message}</span></span>
                  <span className="flex shrink-0 items-center gap-2"><span className="text-ink3">{fmtDate(a.createdAt)}</span><Chip tone={TONE[a.severity]}>{a.severity.toLowerCase()}</Chip></span>
                </li>
              ))}
            </ol>
          </Card>

          {linked.map(({ d, res }) => (
            <Card key={d.id} as="section" aria-label={`Score for ${d.code}`}>
              <div className="flex items-center justify-between gap-3">
                <Link href={`/batches/${d.code}`} className="t-h3 inline-flex min-h-11 items-center underline-offset-4 hover:underline">{d.code}</Link>
                <span className="flex items-center gap-2"><span className="t-h3 tabular-nums">{res.score}</span><BandChip band={res.band} /></span>
              </div>
              <p className="t-small mt-1 text-ink2">{d.honeyType} · {d.farm.name}</p>
              <Explain res={res} />
            </Card>
          ))}
        </div>

        <aside className="space-y-6">
          {can(s.role, "case:manage") ? <CasePanel incidentId={id} cases={cases} /> : <Card><p className="t-small text-ink2">Cases are worked by investigators.</p></Card>}
          <ExplainCard kind="incident" refId={id} configured={aiConfigured()} title="Case brief" intro="What the alerts share, which batches are involved and what to check first. A starting point, not a finding." />
        </aside>
      </div>
    </>
  );
}
