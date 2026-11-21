import type { Action } from "@/lib/auth/capabilities";
import { writeRoute } from "@/lib/api";
import { recordInspection, recordReading } from "@/lib/hives";
import type { Repository } from "@/lib/repo";
import type { Session } from "@/lib/auth/session";

type Run = (repo: Repository, s: Session, code: string, body: Record<string, unknown>) => Promise<unknown>;

// readings: sensor feed; inspections: manual log. Both keeper-only and limited to the keeper's own hives.
const KIND: Record<string, { action: Action; run: Run }> = {
  readings: { action: "hive:manage", run: recordReading },
  inspections: { action: "inspection:log", run: recordInspection },
};

export async function POST(req: Request, ctx: RouteContext<"/api/hives/[code]/[kind]">) {
  const { code, kind } = await ctx.params;
  const k = KIND[kind];
  if (!k) return Response.json({ error: "Unknown kind" }, { status: 404 });
  return writeRoute(req, k.action, kind, async (repo, s, body) => ({ target: code, result: await k.run(repo, s, code, body) }));
}
