import { writeRoute } from "@/lib/api";
import { updateCase } from "@/lib/cases";

// POST, not PATCH: this app exposes no PUT/PATCH/DELETE handlers anywhere.
export async function POST(req: Request, ctx: RouteContext<"/api/cases/[id]">) {
  const { id } = await ctx.params;
  return writeRoute(req, "case:manage", "update-case", async (repo, s, body) => ({ target: id, result: await updateCase(repo, s, id, body) }));
}
