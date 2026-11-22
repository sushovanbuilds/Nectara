import type { Action } from "./auth/capabilities";
import { authorize } from "./auth/guard";
import type { Session } from "./auth/session";
import { hit, tooMany } from "./rate-limit";
import { getRepo, type Repository } from "./repo";
import { TraceError } from "./trace";

/** Guard + JSON body + error mapping + audit for every TRACE write route. */
export async function writeRoute(
  req: Request,
  action: Action,
  auditTarget: string,
  run: (repo: Repository, s: Session, body: Record<string, unknown>) => Promise<{ target: string; result: unknown }>,
): Promise<Response> {
  const a = await authorize(action);
  if (!a.ok) return a.res;
  const w = hit("write", a.session.uid);
  if (!w.ok) return tooMany(w.retryAfter, "changes at once");
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "JSON body required" }, { status: 400 });
  const repo = await getRepo();
  try {
    const { target, result } = await run(repo, a.session, body);
    await repo.writeAudit({ actorId: a.session.uid, action: `${action}:${auditTarget}`, target });
    return Response.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof TraceError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
