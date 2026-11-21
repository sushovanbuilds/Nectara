import Link from "next/link";
import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/states";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDate } from "@/lib/format";
import { getRepo } from "@/lib/repo";
import { holderOrgId } from "@/lib/trace";

export const metadata = { title: "Shipments · Nectara" };

export default async function Shipments() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "batch:read")) return <Denied who="signed-in staff" />;
  const repo = await getRepo();
  const batches = await repo.listBatches();
  const code = new Map(batches.map((b) => [b.id, b.code]));
  const shipments = (await repo.listShipments()).sort((a, b) => +b.shippedAt - +a.shippedAt);
  const ships = can(s.role, "shipment:record");
  const ready = [];
  if (ships) for (const b of batches) if (holderOrgId((await repo.getBatchById(b.id))!) === s.orgId) ready.push(b);

  return (
    <>
      <PageHeader title="Shipments" description="Each shipment is a hand-off in the batch record: carrier, origin and destination." />
      {ships && (
        <Card as="section" aria-labelledby="ready-h" className="mb-6">
          <h2 id="ready-h" className="t-h3">Ready to ship</h2>
          {ready.length === 0 ? <p className="t-small mt-3 text-ink2">Nothing in your custody. Take custody of a batch first.</p> : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {ready.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="t-small font-medium">{b.code}</span>
                  <Link href={`/batches/${b.code}`} className="t-small text-amber-ink underline">Record shipment</Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
      {shipments.length === 0 ? <EmptyState message="No shipments recorded yet. Distributors record them from a batch in their custody." action={ships ? { label: "Open custody", href: "/custody" } : undefined} /> : (
        <div role="region" aria-label="Shipments, scrollable" tabIndex={0} className="overflow-x-auto rounded-[10px] border border-line bg-paper">
          <table className="t-small w-full min-w-[40rem] text-left">
            <thead className="t-caption text-ink3"><tr className="border-b border-line"><th scope="col" className="px-4 py-2.5 font-medium">Batch</th><th scope="col" className="px-4 py-2.5 font-medium">Route</th><th scope="col" className="px-4 py-2.5 font-medium">Carrier</th><th scope="col" className="px-4 py-2.5 font-medium">Shipped</th><th scope="col" className="px-4 py-2.5 font-medium">Status</th></tr></thead>
            <tbody>
              {shipments.map((sh) => (
                <tr key={sh.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><Link href={`/batches/${code.get(sh.batchId)}`} className="font-medium underline-offset-2 hover:underline">{code.get(sh.batchId) ?? sh.batchId}</Link></td>
                  <td className="px-4 py-3 text-ink2">{sh.origin} → {sh.destination}</td>
                  <td className="px-4 py-3 text-ink2">{sh.carrier}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink3">{fmtDate(sh.shippedAt)}</td>
                  <td className="px-4 py-3"><Chip tone="amber">{sh.status === "IN_TRANSIT" ? "In transit" : sh.status.toLowerCase()}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
