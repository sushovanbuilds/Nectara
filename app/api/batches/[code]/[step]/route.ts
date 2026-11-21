import type { Action } from "@/lib/auth/capabilities";
import { writeRoute } from "@/lib/api";
import { recordStep, STEPS, type Step } from "@/lib/trace";

const ACTION: Record<Step, Action> = {
  collection: "collection:record",
  custody: "custody:transfer",
  processing: "processing:record",
  packaging: "packaging:record",
  shipment: "shipment:record",
};

export async function POST(req: Request, ctx: RouteContext<"/api/batches/[code]/[step]">) {
  const { code, step } = await ctx.params;
  if (!(STEPS as readonly string[]).includes(step)) return Response.json({ error: "Unknown step" }, { status: 404 });
  const st = step as Step;
  return writeRoute(req, ACTION[st], st, async (repo, s, body) => ({ target: code, result: await recordStep(repo, s, code, st, body) }));
}
