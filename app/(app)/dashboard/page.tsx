import Link from "next/link";
import { connection } from "next/server";
import { HealthRing, StateChip } from "@/components/hive-ui";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icons";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import type { HealthState } from "@/lib/hiveos";
import { viewAll } from "@/lib/hives";
import { navItems } from "@/lib/nav";
import { getRepo } from "@/lib/repo";
import { summariseLab } from "@/lib/verify";

export const metadata = { title: "Dashboard · Nectara" };

function Kpi({ label, value, context }: { label: string; value: string; context: string }) {
  return (
    <Card>
      <p className="t-small text-ink2">{label}</p>
      <p className="t-h1 mt-2">{value}</p>
      <p className="t-caption mt-2 text-ink3">{context}</p>
    </Card>
  );
}

const WHAT: Record<string, string> = {
  "/batches": "Every batch, its lab evidence and its record seal.", "/lab": "Publish results bound to one batch.",
  "/custody": "Take custody and record processing, packaging and blends.", "/shipments": "Shipments and batches ready to ship.",
  "/risk": "Scored batches and incident clusters to review.", "/admin": "Users, the role matrix and the audit log.",
  "/verify": "The public page a buyer sees after scanning a jar.",
};

export default async function Dashboard() {
  await connection();
  const s = await currentSession();
  if (!s) return null;
  const first = s.name.split(" ")[0];

  // Other roles: a short map of their workspaces. Each workspace has its own page.
  if (!can(s.role, "hiveos:view")) {
    return (
      <>
        <PageHeader title={`Welcome, ${first}`} description="Here is what your role can do in Nectara." />
        <ul className="grid gap-4 md:grid-cols-2">
          {navItems(s.role).filter((n) => n.href !== "/dashboard").map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="flex h-full items-start gap-4 rounded-[10px] border border-line bg-paper p-5 hover:bg-panel">
                <Icon name={n.icon} className="mt-0.5 size-5 text-amber-ink" />
                <span><span className="t-h3 block">{n.label}</span><span className="t-small mt-1 block text-ink2">{WHAT[n.href]}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  const repo = await getRepo();
  const { views, anomalies } = await viewAll(repo);
  const counts: Record<HealthState, number> = { STABLE: 0, WATCH: 0, STRESSED: 0, CRITICAL: 0 };
  for (const v of views) counts[v.health.state]++;
  const attention = views.filter((v) => v.health.state !== "STABLE").sort((a, b) => a.health.score - b.health.score);

  const batches = await repo.listBatches();
  const totalKg = batches.reduce((t, b) => t + b.kg, 0);
  let inProgress = 0;
  for (const b of batches) if (summariseLab((await repo.getBatchById(b.id))!.tests) === "IN_PROGRESS") inProgress++;
  const farms = new Set(views.map((v) => v.farm.id)).size;
  const byMonth = new Map<string, number>();
  for (const h of await repo.listHarvests()) {
    const m = h.harvestedAt.toISOString().slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + h.kg);
  }
  const months = [...byMonth].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const max = Math.max(1, ...months.map(([, kg]) => kg));
  const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });

  return (
    <>
      <PageHeader
        title={`Welcome, ${first}`}
        description={`${views.length} hives across ${farms} apiaries · data as of ${fmtDate(views[0]?.asOf ?? new Date())}`}
        action={<Button href="/harvests/new">Log harvest</Button>}
      />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Hives" value={String(views.length)} context={`across ${farms} apiaries`} />
        <Kpi label="Stable" value={`${Math.round((counts.STABLE / Math.max(1, views.length)) * 100)}%`} context={`${counts.STABLE} of ${views.length} hives`} />
        <Kpi label="Batches" value={String(batches.length)} context={inProgress ? `${inProgress} with a lab test in progress` : "no lab tests pending"} />
        <Kpi label="Honey batched" value={`${totalKg.toLocaleString("en-IN")} kg`} context={`in ${batches.length} batches`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card as="section" aria-labelledby="trend-h">
          <h2 id="trend-h" className="t-h3">Harvest by month</h2>
          <p className="t-caption mt-1 text-ink3">Kilograms harvested</p>
          {months.length === 0 ? <p className="t-small mt-6 text-ink2">No harvests yet. Log your first harvest.</p> : (
            <svg viewBox={`0 0 ${Math.max(months.length, 3) * 80} 150`} className="mt-4 w-full max-w-md" role="img" aria-label={`Harvest by month: ${months.map(([m, kg]) => `${monthName(m)} ${kg} kg`).join(", ")}`}>
              <line x1="0" x2={Math.max(months.length, 3) * 80} y1="118" y2="118" stroke="var(--line)" />
              {months.map(([m, kg], i) => {
                const h = (kg / max) * 86;
                return (
                  <g key={m}>
                    <rect x={i * 80 + 18} y={118 - h} width="44" height={h} rx="3" fill="var(--honey)" />
                    <text x={i * 80 + 40} y={112 - h} textAnchor="middle" fontSize="11" fill="var(--ink2)">{kg}</text>
                    <text x={i * 80 + 40} y="136" textAnchor="middle" fontSize="11" fill="var(--ink3)">{monthName(m)}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </Card>
        <Card as="section" aria-labelledby="ring-h">
          <h2 id="ring-h" className="t-h3">Hive health</h2>
          <p className="t-caption mt-1 text-ink3">Rule-based, explained on each hive page</p>
          <div className="mt-5"><HealthRing counts={counts} /></div>
        </Card>
      </div>

      <Card as="section" aria-labelledby="att-h" className="mt-6">
        <h2 id="att-h" className="t-h3">Needs attention</h2>
        {anomalies.map((a) => <p key={a.farmId} role="status" className="t-small mt-4 rounded-md bg-honeybg p-3 text-amber-ink">{a.message}</p>)}
        {attention.length === 0 ? <p className="t-small mt-4 text-ink2">All hives are stable. Keep routine inspections every two weeks.</p> : (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {attention.map((v) => {
              const why = v.health.factors.filter((f) => f.effect === "concerning").sort((a, b) => b.penalty - a.penalty)[0];
              return (
                <li key={v.hive.id}>
                  <Link href={`/hives/${v.hive.code}`} className="grid gap-1 py-3 hover:bg-panel sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-4">
                    <span className="font-medium">{v.hive.code}</span>
                    <span className="t-small text-ink2">{why ? <><span className="text-ink">{why.label}:</span> {why.detail}</> : "Below stable."} <span className="text-ink3">· {v.farm.name}</span></span>
                    <span className="flex items-center gap-2"><span className="t-small text-ink3">{v.health.score}/100</span><StateChip state={v.health.state} /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
