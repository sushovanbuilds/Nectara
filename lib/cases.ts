import { randomUUID } from "node:crypto";
import type { InvestigationCase } from "@prisma/client";
import type { Session } from "./auth/session";
import type { Repository } from "./repo/types";
import { TraceError } from "./trace";

import { CASE_STATUSES } from "./cases-constants";

/** A person opens a case; the engine never does. One open case per incident. */
export async function openCase(repo: Repository, s: Session, incidentId: string): Promise<InvestigationCase> {
  if (!(await repo.getIncident(incidentId))) throw new TraceError(404, "Incident not found");
  if ((await repo.listCases(incidentId)).some((c) => c.status !== "RESOLVED")) throw new TraceError(409, "This incident already has an open case");
  const c: InvestigationCase = { id: `case-${randomUUID().slice(0, 8)}`, incidentId, assigneeId: s.uid, status: "OPEN", notes: "" };
  await repo.insertCase(c);
  return c;
}

export async function updateCase(repo: Repository, s: Session, id: string, input: { status?: unknown; note?: unknown }): Promise<InvestigationCase> {
  const c = await repo.getCase(id);
  if (!c) throw new TraceError(404, "Case not found");
  const patch: { status?: string; notes?: string } = {};
  if (input.status !== undefined) {
    if (!(CASE_STATUSES as readonly string[]).includes(input.status as string)) throw new TraceError(400, "Unknown status");
    patch.status = input.status as string;
  }
  if (input.note !== undefined) {
    const n = typeof input.note === "string" ? input.note.trim() : "";
    if (!n || n.length > 2000) throw new TraceError(400, "A note must be 1 to 2000 characters");
    patch.notes = `${c.notes}${c.notes ? "\n" : ""}${new Date().toISOString().slice(0, 16).replace("T", " ")} ${s.name}: ${n}`;
  }
  if (!Object.keys(patch).length) throw new TraceError(400, "Nothing to update");
  await repo.updateCase(id, patch);
  return { ...c, ...patch };
}
