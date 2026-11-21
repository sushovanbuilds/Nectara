import { randomUUID } from "node:crypto";
import type { Farm, Hive, HiveReading, Inspection } from "@prisma/client";
import type { Session } from "./auth/session";
import { isDemo } from "./demo";
import { apiaryAnomalies, evaluate, observe, type HealthResult, type Observation } from "./hiveos";
import type { Repository } from "./repo/types";
import { TraceError } from "./trace";

export interface HiveView { hive: Hive; farm: Farm; obs: Observation; health: HealthResult; asOf: Date }

/**
 * Reference time for "how old is this data". Real mode uses the wall clock. Demo mode uses the newest
 * reading in the sample, otherwise every sample hive would look months stale.
 */
export async function referenceNow(repo: Repository): Promise<Date> {
  if (!isDemo()) return new Date();
  let newest = 0;
  for (const h of await repo.listHives()) for (const r of await repo.listReadings(h.id)) newest = Math.max(newest, +r.at);
  return newest ? new Date(newest) : new Date();
}

export async function viewHive(repo: Repository, hive: Hive, farms: Farm[], now: Date): Promise<HiveView> {
  const obs = observe(await repo.listReadings(hive.id), await repo.listInspections(hive.id), now);
  return { hive, farm: farms.find((f) => f.id === hive.farmId)!, obs, health: evaluate(obs), asOf: now };
}

export async function viewAll(repo: Repository): Promise<{ views: HiveView[]; anomalies: ReturnType<typeof apiaryAnomalies> }> {
  const now = await referenceNow(repo);
  const farms = await repo.listFarms();
  const views = [];
  for (const h of await repo.listHives()) views.push(await viewHive(repo, h, farms, now));
  const anomalies = apiaryAnomalies(views.map((v) => ({ farmId: v.farm.id, farmName: v.farm.name, code: v.hive.code, result: v.health })));
  return { views, anomalies };
}

async function ownHive(repo: Repository, s: Session, code: string): Promise<{ hive: Hive; farms: Farm[] }> {
  const hive = await repo.getHive(code);
  if (!hive) throw new TraceError(404, "Hive not found");
  const farms = await repo.listFarms();
  if (farms.find((f) => f.id === hive.farmId)?.orgId !== s.orgId) throw new TraceError(403, "That hive belongs to another organisation");
  return { hive, farms };
}

async function refreshSnapshot(repo: Repository, hive: Hive, farms: Farm[]) {
  const v = await viewHive(repo, hive, farms, await referenceNow(repo));
  await repo.updateHiveHealth(hive.id, { healthState: v.health.state, healthScore: v.health.score, trustLevel: v.health.trustLevel });
}

const channel = (v: unknown, name: string, lo: number, hi: number): number | null => {
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v) || v < lo || v > hi) throw new TraceError(400, `${name} must be a number between ${lo} and ${hi}`);
  return v;
};

/** Sensor reading. Every channel is optional, at least one is required. */
export async function recordReading(repo: Repository, s: Session, code: string, input: Record<string, unknown>): Promise<HiveReading> {
  const { hive, farms } = await ownHive(repo, s, code);
  const r: HiveReading = {
    id: `rd-${randomUUID().slice(0, 8)}`, hiveId: hive.id, at: new Date(),
    tempC: channel(input.tempC, "tempC", -20, 60), humidity: channel(input.humidity, "humidity", 0, 100),
    weightKg: channel(input.weightKg, "weightKg", 0, 300), activity: channel(input.activity, "activity", 0, 1), soundDb: channel(input.soundDb, "soundDb", 0, 140),
  };
  if ([r.tempC, r.humidity, r.weightKg, r.activity, r.soundDb].every((v) => v === null)) throw new TraceError(400, "Send at least one sensor channel");
  await repo.insertReading(r);
  await refreshSnapshot(repo, hive, farms);
  return r;
}

export async function recordInspection(repo: Repository, s: Session, code: string, input: Record<string, unknown>): Promise<Inspection> {
  const { hive, farms } = await ownHive(repo, s, code);
  if (typeof input.queenSeen !== "boolean") throw new TraceError(400, "queenSeen must be true or false");
  if (!["solid", "patchy", "spotty"].includes(input.broodPattern as string)) throw new TraceError(400, "broodPattern must be solid, patchy or spotty");
  const notes = typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "";
  const i: Inspection = { id: `in-${randomUUID().slice(0, 8)}`, hiveId: hive.id, at: new Date(), queenSeen: input.queenSeen, broodPattern: input.broodPattern as string, notes };
  await repo.insertInspection(i);
  await refreshSnapshot(repo, hive, farms);
  return i;
}
