import Link from "next/link";
import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { StateChip } from "@/components/hive-ui";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { viewAll } from "@/lib/hives";
import { getRepo } from "@/lib/repo";

export const metadata = { title: "Hives · Nectara" };

export default async function Hives() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "hiveos:view")) return <Denied who="honey keepers" />;
  const { views, anomalies } = await viewAll(await getRepo());
  const sorted = [...views].sort((a, b) => a.health.score - b.health.score);
  return (
    <>
      <PageHeader title="Hives" description="Weakest first. Each state comes with its reasons on the hive page." action={can(s.role, "harvest:create") ? <Button href="/harvests/new" variant="secondary">Log harvest</Button> : undefined} />
      {anomalies.map((a) => <Banner key={a.farmId} tone="warning" className="mb-4" title="Apiary pattern.">{a.message}</Banner>)}
      {sorted.length === 0 ? <EmptyState message="No hives registered yet. Hives appear here once they are added to an apiary." /> : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map(({ hive, farm, health }) => {
            const why = health.factors.filter((f) => f.effect === "concerning").sort((a, b) => b.penalty - a.penalty)[0];
            return (
              <li key={hive.id}>
                <Link href={`/hives/${hive.code}`} className="block h-full rounded-[10px] border border-line bg-paper p-5 hover:bg-panel">
                  <div className="flex items-center justify-between gap-3"><span className="t-h3">{hive.code}</span><StateChip state={health.state} /></div>
                  <p className="t-small mt-1 text-ink2">{farm.name} · {health.score}/100 · trust level {health.trustLevel}</p>
                  <p className="t-small mt-3 text-ink2">{why ? <><span className="text-ink">{why.label}:</span> {why.detail}</> : "All readings in range."}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
