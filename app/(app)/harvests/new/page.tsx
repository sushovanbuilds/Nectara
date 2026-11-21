import { connection } from "next/server";
import { Denied } from "@/components/denied";
import { HarvestWizard } from "@/components/harvest-wizard";
import { PageHeader } from "@/components/shell/page-header";
import { can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";

export const metadata = { title: "Log harvest · Nectara" };

export default async function NewHarvest() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "harvest:create")) return <Denied who="honey keepers" />;
  const repo = await getRepo();
  const farms = (await repo.listFarms()).filter((f) => f.orgId === s.orgId);
  const name = new Map(farms.map((f) => [f.id, f.name]));
  const hives = (await repo.listHives()).filter((h) => name.has(h.farmId)).map((h) => ({ code: h.code, farm: name.get(h.farmId)! }));
  return (
    <>
      <PageHeader title="Log harvest" description="Four short steps. Logging creates a batch and the first two entries in its sealed record." />
      <HarvestWizard hives={hives} today={new Date().toISOString().slice(0, 10)} />
    </>
  );
}
