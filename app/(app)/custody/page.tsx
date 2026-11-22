import Link from "next/link";
import { connection } from "next/server";
import { BlendForm } from "@/components/blend-form";
import { Denied } from "@/components/denied";
import { PostButton } from "@/components/post-button";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";
import { holderOrgId } from "@/lib/trace";

export const metadata = { title: "Custody · Nectara" };

export default async function Custody() {
  await connection();
  const s = await currentSession();
  if (!s || !(can(s.role, "custody:transfer") || can(s.role, "collection:record"))) return <Denied who="collectors, processors and distributors" />;
  const repo = await getRepo();
  const orgs = new Map((await repo.listOrgs()).map((o) => [o.id, o.name]));
  const rows = [];
  for (const b of await repo.listBatches()) rows.push({ b, holder: holderOrgId((await repo.getBatchById(b.id))!) });
  const mine = rows.filter((r) => r.holder === s.orgId);
  const others = rows.filter((r) => r.holder !== s.orgId);
  const take = s.role === "COLLECTOR" ? "collection" : "custody";

  return (
    <>
      <PageHeader title="Custody" description="Every hand-off is written once into the batch record. Take custody when the honey reaches you." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="mine-h">
          <h2 id="mine-h" className="t-h3">In your custody</h2>
          {mine.length === 0 ? <p className="t-small mt-3 text-ink2">Nothing yet. Take custody of a batch from the list of batches held by others.</p> : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {mine.map(({ b }) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="t-small"><span className="font-medium">{b.code}</span> <span className="text-ink2">{b.honeyType}, {b.kg} kg</span></span>
                  <Link href={`/batches/${b.code}`} className="t-small inline-flex min-h-11 items-center text-amber-ink underline">Record next step</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card as="section" aria-labelledby="other-h">
          <h2 id="other-h" className="t-h3">Held by others</h2>
          {others.length === 0 ? <p className="t-small mt-3 text-ink2">No other batches right now.</p> : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {others.map(({ b, holder }) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="t-small"><span className="font-medium">{b.code}</span> <span className="text-ink2">with {orgs.get(holder) ?? holder}</span></span>
                  {/* Collection needs a quantity; the batch's own is the sensible default. */}
                  <PostButton url={`/api/batches/${b.code}/${take}`} body={take === "collection" ? { kg: b.kg } : {}} label="Take custody" done={`Custody of ${b.code} recorded.`} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {s.role === "PROCESSOR" && (mine.length >= 2
        ? <div className="mt-6 max-w-2xl"><BlendForm batchCodes={mine.map((r) => r.b.code)} /></div>
        : <p className="t-small mt-6 text-ink2">To create a blend, take custody of at least two batches.</p>)}
    </>
  );
}
