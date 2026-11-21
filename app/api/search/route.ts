import { authorize } from "@/lib/auth/guard";
import { can } from "@/lib/auth/capabilities";
import { navItems } from "@/lib/nav";
import { getRepo } from "@/lib/repo";
import type { Hit } from "@/components/shell/command-palette";

// Command palette index: only what the signed-in role may open.
export async function GET() {
  const a = await authorize("batch:read");
  if (!a.ok) return a.res;
  const repo = await getRepo();
  const hits: Hit[] = navItems(a.session.role).map((n) => ({ group: "Pages", label: n.label, href: n.href }));
  for (const b of await repo.listBatches()) hits.push({ group: "Batches", label: b.code, sub: `${b.honeyType} · ${b.kg} kg`, href: `/batches/${b.code}` });
  if (can(a.session.role, "hiveos:view")) {
    const farms = new Map((await repo.listFarms()).map((f) => [f.id, f.name]));
    for (const h of await repo.listHives()) hits.push({ group: "Hives", label: h.code, sub: farms.get(h.farmId), href: `/hives/${h.code}` });
  }
  return Response.json(hits);
}
