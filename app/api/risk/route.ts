import { authorize } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";
import { scoreFromRepo } from "@/lib/risk-engine";

// Live scores from current data. A score orders the investigation queue; it is not a verdict.
export async function GET() {
  const a = await authorize("risk:read");
  if (!a.ok) return a.res;
  const repo = await getRepo();
  const batches = await repo.listBatches();
  const out = [];
  for (const b of batches) out.push({ batch: b.code, ...(await scoreFromRepo(repo, (await repo.getBatchById(b.id))!, batches)) });
  return Response.json(out.sort((x, y) => y.score - x.score));
}
