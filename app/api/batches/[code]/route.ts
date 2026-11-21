import { authorize } from "@/lib/auth/guard";
import { getRepo } from "@/lib/repo";

// Read-only. Events are append-only, so this route (and every other) exports no PUT, PATCH or DELETE.
export async function GET(_req: Request, ctx: RouteContext<"/api/batches/[code]">) {
  const a = await authorize("batch:read");
  if (!a.ok) return a.res;
  const { code } = await ctx.params;
  const batch = await (await getRepo()).getBatch(code);
  return batch ? Response.json(batch) : Response.json({ error: "Batch not found" }, { status: 404 });
}
