import { randomUUID } from "node:crypto";
import type { Batch, RiskScore } from "@prisma/client";
import { clusterAlerts, entitiesForBatch, incidentTitle, topBand } from "./incidents";
import type { BatchDetail, Repository } from "./repo/types";
import { scoreBatch, type RiskResult } from "./risk";
import { verifySeal } from "./seal";

/** Score one batch from live data. Pure given the repository state, so the same data always gives the same score. */
export async function scoreFromRepo(repo: Repository, batch: BatchDetail, all?: Batch[]): Promise<RiskResult> {
  const others = (all ?? (await repo.listBatches())).filter((b) => b.farmId === batch.farmId && b.id !== batch.id);
  let farmFailedBatches = 0;
  for (const o of others) if ((await repo.getBatchById(o.id))?.tests.some((t) => t.status === "FAILED")) farmFailedBatches++;
  const alerts = (await repo.listAlerts()).filter((a) => a.batchId === batch.id);
  return scoreBatch({ batch, seal: verifySeal(batch.events, batch.anchors), alerts, farmFailedBatches });
}

export interface RunSummary { scored: number; alertsRaised: number; incidentsCreated: number; incidentsUpdated: number }

/** One pass: score every batch and store it, raise alerts for new signals, then cluster alerts into incidents. */
export async function runRiskEngine(repo: Repository, now = new Date()): Promise<RunSummary> {
  const summary: RunSummary = { scored: 0, alertsRaised: 0, incidentsCreated: 0, incidentsUpdated: 0 };
  const batches = await repo.listBatches();

  for (const b of batches) {
    const detail = (await repo.getBatchById(b.id))!;
    const res = await scoreFromRepo(repo, detail, batches);
    const row: RiskScore = { id: `rs-${randomUUID().slice(0, 8)}`, batchId: b.id, score: res.score, band: res.band, ruleSetVersion: res.ruleSetVersion, reasons: res as never, createdAt: now };
    await repo.insertRiskScore(row);
    summary.scored++;
    for (const r of res.reasons) {
      if (!r.signal) continue;
      // One alert per signal per batch, ever: re-running must not flood the queue.
      if (await repo.hasRecentAlert(r.signal.kind, b.id, new Date(0))) continue;
      await repo.insertAlert({ id: `al-${randomUUID().slice(0, 8)}`, kind: r.signal.kind, severity: r.signal.severity, message: `${b.code}: ${r.reason}`, batchId: b.id, incidentId: null, createdAt: now });
      summary.alertsRaised++;
    }
  }

  const alerts = (await repo.listAlerts()).filter((a) => a.batchId);
  const cache = new Map<string, string[]>();
  const nodes = [];
  for (const a of alerts) {
    if (!cache.has(a.batchId!)) cache.set(a.batchId!, await entitiesForBatch(repo, a.batchId!));
    nodes.push({ id: a.id, createdAt: a.createdAt, entities: cache.get(a.batchId!)! });
  }
  const byId = new Map(alerts.map((a) => [a.id, a]));

  for (const ids of clusterAlerts(nodes)) {
    const members = ids.map((id) => byId.get(id)!);
    const existing = members.find((m) => m.incidentId)?.incidentId;
    const unassigned = members.filter((m) => !m.incidentId || m.incidentId !== existing).map((m) => m.id);
    const band = topBand(members);
    if (existing) {
      if (unassigned.length) await repo.assignAlerts(unassigned, existing);
      const inc = await repo.getIncident(existing);
      if (inc && inc.band !== band) await repo.updateIncidentBand(existing, band);
      if (unassigned.length) summary.incidentsUpdated++;
    } else {
      const id = `inc-${randomUUID().slice(0, 8)}`;
      await repo.insertIncident({ id, title: incidentTitle(members), band, status: "OPEN", openedAt: now });
      await repo.assignAlerts(ids, id);
      summary.incidentsCreated++;
    }
  }
  return summary;
}
