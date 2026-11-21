import { randomUUID } from "node:crypto";
import type { Batch, BatchEvent, EventType } from "@prisma/client";
import type { Session } from "./auth/session";
import { eventHash, GENESIS } from "./hash";
import type { BatchDetail, Repository } from "./repo/types";

/** Thrown for any caller mistake; routes turn it into an HTTP status. */
export class TraceError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 422, message: string) {
    super(message);
  }
}

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;
const str = (v: unknown, name: string): string => {
  if (typeof v !== "string" || !v.trim()) throw new TraceError(400, `${name} is required`);
  return v.trim();
};
const pos = (v: unknown, name: string): number => {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) throw new TraceError(400, `${name} must be a positive number`);
  return v;
};

/** Optional harvest date (YYYY-MM-DD): not in the future, not more than a year back. */
function harvestDate(v: unknown): Date | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new TraceError(400, "harvestedOn must be a date like 2026-08-21");
  const d = new Date(`${v}T00:00:00Z`);
  const today = new Date(); today.setUTCHours(23, 59, 59, 999);
  if (Number.isNaN(+d) || d > today) throw new TraceError(400, "The harvest date cannot be in the future");
  if (+today - +d > 366 * 86_400_000) throw new TraceError(400, "The harvest date is more than a year ago");
  return d;
}

/** Append one event to a batch's hash chain. The only way events are ever written. */
export async function appendEvent(repo: Repository, batchId: string, type: EventType, payload: object, actorId: string): Promise<BatchEvent> {
  const last = await repo.lastEvent(batchId);
  const e = { batchId, type, payload, actorId, createdAt: new Date(), prevHash: last?.hash ?? GENESIS };
  const row: BatchEvent = { id: newId("ev"), ...e, hash: eventHash(e) };
  try {
    await repo.insertEvent(row);
  } catch (err) {
    if (err instanceof Error && err.message === "CHAIN_CONFLICT") throw new TraceError(409, "Batch was updated at the same time; try again");
    throw err;
  }
  return row;
}

async function load(repo: Repository, code: string): Promise<BatchDetail> {
  const b = await repo.getBatch(code);
  if (!b) throw new TraceError(404, "Batch not found");
  return b;
}

/** Who holds the honey now: the last custody receiver, or the farm's organisation if none yet. */
export const holderOrgId = (b: BatchDetail): string => b.custody[b.custody.length - 1]?.toOrgId ?? b.farm.orgId;

function requireHolder(b: BatchDetail, s: Session) {
  if (holderOrgId(b) !== s.orgId) throw new TraceError(403, "This batch is not in your organisation's custody");
}

async function nextBatchCode(repo: Repository, now: Date): Promise<string> {
  const year = now.getUTCFullYear();
  const re = new RegExp(`^HC-${year}-(\\d+)$`);
  const max = (await repo.listBatches()).reduce((m, b) => Math.max(m, Number(re.exec(b.code)?.[1] ?? 0)), 0);
  return `HC-${year}-${String(max + 1).padStart(5, "0")}`;
}

/** Keeper: hive -> harvest -> new batch, with its first two chained events. */
export async function recordHarvest(repo: Repository, s: Session, input: Record<string, unknown>): Promise<Batch> {
  const hiveCode = str(input.hiveCode, "hiveCode");
  const kg = pos(input.kg, "kg");
  const floralSource = str(input.floralSource, "floralSource");
  const honeyType = str(input.honeyType, "honeyType");
  const harvestedOn = harvestDate(input.harvestedOn);
  const hive = await repo.getHive(hiveCode);
  if (!hive) throw new TraceError(404, "Hive not found");
  const farm = (await repo.listFarms()).find((f) => f.id === hive.farmId);
  if (!farm || farm.orgId !== s.orgId) throw new TraceError(403, "That hive belongs to another organisation");

  const now = new Date();
  const harvest = { id: newId("hv"), hiveId: hive.id, farmId: farm.id, harvestedAt: harvestedOn ?? now, kg, floralSource };
  const batch: Batch = { id: newId("b"), code: await nextBatchCode(repo, now), honeyType, kg, farmId: farm.id, harvestId: harvest.id, createdAt: now };
  await repo.insertHarvest(harvest);
  await repo.insertBatch(batch);
  await appendEvent(repo, batch.id, "HIVE", { hive: hive.code }, s.uid);
  await appendEvent(repo, batch.id, "HARVEST", { kg, floralSource, harvestedOn: harvest.harvestedAt.toISOString().slice(0, 10), harvestId: harvest.id }, s.uid);
  return batch;
}

export const STEPS = ["collection", "custody", "processing", "packaging", "shipment"] as const;
export type Step = (typeof STEPS)[number];

async function takeCustody(repo: Repository, b: BatchDetail, s: Session, note: string) {
  const from = holderOrgId(b);
  if (from === s.orgId) throw new TraceError(409, "Your organisation already holds this batch");
  await repo.insertCustody({ id: newId("c"), batchId: b.id, fromOrgId: from, toOrgId: s.orgId, at: new Date(), note });
  return from;
}

const CUSTODY_EVENT: Record<string, EventType> = { COLLECTOR: "COLLECTION", PROCESSOR: "PROCESSING", DISTRIBUTOR: "SHIPMENT" };

/** Record one hand-off or processing step on an existing batch. The route has already checked the role capability. */
export async function recordStep(repo: Repository, s: Session, code: string, step: Step, input: Record<string, unknown>): Promise<BatchEvent> {
  const b = await load(repo, code);
  const note = typeof input.note === "string" ? input.note : "";
  switch (step) {
    case "collection": {
      const kg = pos(input.kg ?? b.kg, "kg");
      const from = await takeCustody(repo, b, s, note || "Collected");
      return appendEvent(repo, b.id, "COLLECTION", { kg, fromOrgId: from, toOrgId: s.orgId, note }, s.uid);
    }
    case "custody": {
      const type = CUSTODY_EVENT[s.role];
      if (!type) throw new TraceError(403, "Your role cannot take custody");
      const from = await takeCustody(repo, b, s, note || "Custody transfer");
      return appendEvent(repo, b.id, type, { custodyTransfer: true, fromOrgId: from, toOrgId: s.orgId, note }, s.uid);
    }
    case "processing":
      requireHolder(b, s);
      return appendEvent(repo, b.id, "PROCESSING", { process: str(input.process, "process"), note }, s.uid);
    case "packaging":
      requireHolder(b, s);
      return appendEvent(repo, b.id, "PACKAGING", { units: pos(input.units, "units"), unitSizeG: pos(input.unitSizeG, "unitSizeG") }, s.uid);
    case "shipment": {
      requireHolder(b, s);
      const carrier = str(input.carrier, "carrier"), origin = str(input.origin, "origin"), destination = str(input.destination, "destination");
      await repo.insertShipment({ id: newId("sh"), batchId: b.id, carrier, origin, destination, status: "IN_TRANSIT", shippedAt: new Date() });
      return appendEvent(repo, b.id, "SHIPMENT", { carrier, origin, destination }, s.uid);
    }
  }
}

/** Processor: blend batches into a new one. Ratios into the child must sum to 100%. */
export async function recordBlend(repo: Repository, s: Session, input: Record<string, unknown>): Promise<Batch> {
  const honeyType = str(input.honeyType, "honeyType");
  const kg = pos(input.kg, "kg");
  const raw = input.parents;
  if (!Array.isArray(raw) || raw.length < 2) throw new TraceError(400, "A blend needs at least two parent batches");
  const parents = raw.map((p: { code?: unknown; ratioPct?: unknown }) => ({ code: str(p?.code, "parent code"), ratioPct: pos(p?.ratioPct, "ratioPct") }));
  if (new Set(parents.map((p) => p.code)).size !== parents.length) throw new TraceError(400, "Each parent batch can appear once");
  const total = parents.reduce((t, p) => t + p.ratioPct, 0);
  if (Math.abs(total - 100) > 0.01) throw new TraceError(422, `Blend ratios must sum to 100% (got ${total})`);

  const details = await Promise.all(parents.map((p) => load(repo, p.code)));
  details.forEach((d) => requireHolder(d, s));

  const now = new Date();
  const child: Batch = { id: newId("b"), code: await nextBatchCode(repo, now), honeyType, kg, farmId: details[0].farmId, harvestId: null, createdAt: now };
  await repo.insertBatch(child);
  await repo.insertCustody({ id: newId("c"), batchId: child.id, fromOrgId: details[0].farm.orgId, toOrgId: s.orgId, at: now, note: "Blend created" });
  for (const [i, p] of parents.entries()) await repo.insertLineage({ id: newId("l"), parentId: details[i].id, childId: child.id, ratioPct: p.ratioPct });
  await appendEvent(repo, child.id, "BLENDING", { parents }, s.uid);
  return child;
}
