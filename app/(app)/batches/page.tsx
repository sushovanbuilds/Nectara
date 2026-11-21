import Link from "next/link";
import { connection } from "next/server";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { verifySeal } from "@/lib/seal";
import { holderOrgId } from "@/lib/trace";
import { summariseLab } from "@/lib/verify";

export const metadata = { title: "Batches · Nectara" };

const LAB = { PASSED: ["green", "Passed"], FAILED: ["terra", "Failed"], IN_PROGRESS: ["amber", "In progress"], NONE: ["neutral", "No test"] } as const;
const SEAL = { INTACT: ["green", "Intact"], BROKEN: ["terra", "Broken"], UNSEALED: ["amber", "Not sealed"] } as const;

export default async function Batches() {
  await connection();
  const s = await currentSession();
  const repo = await getRepo();
  const orgs = new Map((await repo.listOrgs()).map((o) => [o.id, o.name]));
  const rows = [];
  for (const b of await repo.listBatches()) {
    const d = (await repo.getBatchById(b.id))!;
    rows.push({ d, lab: summariseLab(d.tests), seal: verifySeal(d.events, d.anchors).state, holder: orgs.get(holderOrgId(d)) ?? "" });
  }
  rows.sort((a, b) => +b.d.createdAt - +a.d.createdAt);
  const canLog = !!s && can(s.role, "harvest:create");
  const th = "px-4 py-2.5 font-medium";

  return (
    <>
      <PageHeader title="Batches" description="Every batch with its lab evidence and record seal, newest first." action={canLog ? <Button href="/harvests/new">Log harvest</Button> : undefined} />
      {rows.length === 0 ? <EmptyState message="No batches yet. A batch is created when a keeper logs a harvest." action={canLog ? { label: "Log harvest", href: "/harvests/new" } : undefined} /> : (
        <div role="region" aria-label="Batches, scrollable" tabIndex={0} className="overflow-x-auto rounded-[10px] border border-line bg-paper">
          <table className="t-small w-full min-w-[46rem] text-left">
            <thead className="t-caption text-ink3"><tr className="border-b border-line"><th scope="col" className={th}>Batch</th><th scope="col" className={th}>Honey</th><th scope="col" className={th}>Lab evidence</th><th scope="col" className={th}>Record seal</th><th scope="col" className={th}>Held by</th><th scope="col" className={th}>Created</th></tr></thead>
            <tbody>
              {rows.map(({ d, lab, seal, holder }) => (
                <tr key={d.id} className="border-b border-line last:border-0 hover:bg-panel/60">
                  <td className="px-4 py-3"><Link href={`/batches/${d.code}`} className="font-medium underline-offset-2 hover:underline">{d.code}</Link></td>
                  <td className="px-4 py-3 text-ink2">{d.honeyType} · {d.kg} kg</td>
                  <td className="px-4 py-3"><Chip tone={LAB[lab][0]}>{LAB[lab][1]}</Chip></td>
                  <td className="px-4 py-3"><Chip tone={SEAL[seal][0]}>{SEAL[seal][1]}</Chip></td>
                  <td className="px-4 py-3 text-ink2">{holder}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink3">{fmtDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
