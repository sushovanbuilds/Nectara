import type { Alert, RiskBand } from "@prisma/client";
import type { Repository } from "./repo/types";

export const WINDOW_MS = 72 * 60 * 60_000;

export interface AlertNode {
  id: string;
  createdAt: Date;
  /** Things this alert touches: batch, farm, organisations in its custody chain, lab, lineage relatives. */
  entities: string[];
}

/**
 * Group alerts into clusters: two alerts are linked when they share an entity and were raised
 * within 72 hours of each other; links chain transitively. Clusters of one alert are not incidents.
 */
export function clusterAlerts(nodes: AlertNode[], windowMs = WINDOW_MS): string[][] {
  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const close = Math.abs(+nodes[i].createdAt - +nodes[j].createdAt) <= windowMs;
      if (close && nodes[i].entities.some((e) => nodes[j].entities.includes(e))) parent[find(i)] = find(j);
    }
  }
  const groups = new Map<number, string[]>();
  nodes.forEach((n, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), n.id]));
  return [...groups.values()].filter((g) => g.length > 1);
}

const RANK: Record<RiskBand, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
export const topBand = (alerts: Pick<Alert, "severity">[]): RiskBand =>
  alerts.reduce<RiskBand>((m, a) => (RANK[a.severity] > RANK[m] ? a.severity : m), "LOW");

export const incidentTitle = (alerts: Pick<Alert, "kind">[]): string =>
  `${alerts.length} linked alerts: ${[...new Set(alerts.map((a) => a.kind.toLowerCase().replaceAll("_", " ")))].join(", ")}`;

/** Entities an alert's batch touches. The farm's own organisation is left out: it owns every farm and would link everything. */
export async function entitiesForBatch(repo: Repository, batchId: string): Promise<string[]> {
  const b = await repo.getBatchById(batchId);
  if (!b) return [`batch:${batchId}`];
  const out = new Set<string>([`batch:${b.id}`, `farm:${b.farmId}`]);
  for (const c of b.custody) for (const o of [c.fromOrgId, c.toOrgId]) if (o !== b.farm.orgId) out.add(`org:${o}`);
  for (const e of b.events.filter((x) => x.type === "QUALITY_TEST")) {
    const u = await repo.findUserById(e.actorId);
    if (u) out.add(`org:${u.orgId}`);
  }
  for (const l of [...b.parentLinks, ...b.childLinks]) { out.add(`batch:${l.parentId}`); out.add(`batch:${l.childId}`); }
  return [...out];
}
