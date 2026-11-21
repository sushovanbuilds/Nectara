import { writeRoute } from "@/lib/api";
import { openCase } from "@/lib/cases";

export async function POST(req: Request, ctx: RouteContext<"/api/incidents/[id]/case">) {
  const { id } = await ctx.params;
  return writeRoute(req, "case:manage", "open-case", async (repo, s) => ({ target: id, result: await openCase(repo, s, id) }));
}
