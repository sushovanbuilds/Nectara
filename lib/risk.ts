import type { Alert, EventType, RiskBand } from "@prisma/client";
import type { BatchDetail } from "./repo/types";
import type { SealResult } from "./seal";

/** Bump when any rule, weight or threshold changes; stored on every RiskScore. */
export const RULE_SET_VERSION = "2026.1";

export type RiskGroup = "LAB" | "TRACE" | "SUPPLIER" | "GEO_TIMELINE" | "PROCESS";
/** Group weights are also the caps, so the maximum total is 100. */
export const WEIGHTS: Record<RiskGroup, number> = { LAB: 40, TRACE: 20, SUPPLIER: 15, GEO_TIMELINE: 15, PROCESS: 10 };
export const GROUP_LABEL: Record<RiskGroup, string> = {
  LAB: "Lab results", TRACE: "Traceability gaps", SUPPLIER: "Supplier history", GEO_TIMELINE: "Geo and timeline", PROCESS: "Process and sensors",
};

// Thresholds. Rule data, not science: have an apiculture or food-safety lead review before real use.
const HMF_LIMIT_MG_KG = 40;
const MOISTURE_RANGE: [number, number] = [13.5, 20];
const STORAGE_TEMP_LIMIT_C = 30;
/** Usual flowering windows, as inclusive month numbers (1 = January). */
const SEASONS: Record<string, [number, number, string]> = {
  mustard: [10, 4, "October to April"],
  litchi: [3, 5, "March to May"],
};

export interface RiskReason {
  group: RiskGroup;
  points: number;
  reason: string;
  /** If present, the engine raises an Alert of this kind for the batch. */
  signal?: { kind: string; severity: RiskBand };
}
export interface RiskResult {
  score: number;
  band: RiskBand;
  ruleSetVersion: string;
  reasons: RiskReason[];
  groups: { group: RiskGroup; weight: number; points: number; capped: boolean }[];
  /** Rules that could not run because the data does not exist yet. Shown, never silently skipped. */
  notEvaluated: string[];
}
export interface RiskInput {
  batch: BatchDetail;
  seal: SealResult;
  alerts: Alert[]; // alerts already raised for this batch
  farmFailedBatches: number; // other batches from the same farm with a failed lab test
}

export const bandFor = (score: number): RiskBand => (score < 30 ? "LOW" : score < 60 ? "MEDIUM" : "HIGH");

const has = (b: BatchDetail, ...types: EventType[]) => b.events.some((e) => types.includes(e.type));
const NOT_EVALUATED = ["Impossible travel speed between custody steps (no location data is recorded yet)"];

// Pairs where the first must not appear after the second.
const ORDER: [EventType, EventType][] = [["HIVE", "HARVEST"], ["HARVEST", "COLLECTION"], ["HARVEST", "PROCESSING"], ["PACKAGING", "SHIPMENT"]];

export function scoreBatch({ batch: b, seal, alerts, farmFailedBatches }: RiskInput): RiskResult {
  const r: RiskReason[] = [];
  const add = (group: RiskGroup, points: number, reason: string, signal?: RiskReason["signal"]) => r.push({ group, points, reason, signal });
  const moved = has(b, "PROCESSING", "PACKAGING", "SHIPMENT", "BLENDING");

  // Lab results
  const failed = b.tests.filter((t) => t.status === "FAILED");
  if (failed.length) add("LAB", 40, `Lab test ${failed[0].labRef} failed`, { kind: "LAB_FAILED", severity: "HIGH" });
  else if (!b.tests.length) {
    if (moved) add("LAB", 25, "Batch has moved past collection with no lab test recorded");
    else add("LAB", 5, "No lab test recorded yet");
  }
  else if (b.tests.some((t) => t.status === "IN_PROGRESS") && has(b, "PACKAGING", "SHIPMENT")) add("LAB", 15, "Packaged or shipped while a lab test is still in progress");
  for (const t of b.tests) {
    const hmf = (t.results as { hmfMgKg?: number } | null)?.hmfMgKg;
    if (typeof hmf === "number" && hmf > HMF_LIMIT_MG_KG) add("LAB", 15, `${t.labRef}: HMF ${hmf} mg/kg is above the ${HMF_LIMIT_MG_KG} mg/kg limit`);
  }
  if (alerts.some((a) => a.kind === "CERTIFICATE_REUSE")) add("LAB", 30, "A lab certificate was submitted for this batch that was already issued for another");

  // Traceability gaps
  if (seal.state === "BROKEN") add("TRACE", 20, `Record changed after sealing (first mismatch: event ${seal.firstMismatch?.eventId})`, { kind: "RECORD_SEAL_BROKEN", severity: "HIGH" });
  if (!b.harvestId && b.parentLinks.length === 0) add("TRACE", 10, "No harvest link and no parent batches");
  if (moved && b.custody.length === 0) add("TRACE", 10, "Processed or shipped with no custody hand-off recorded", { kind: "CUSTODY_GAP", severity: "MEDIUM" });
  if (b.parentLinks.length) {
    const total = b.parentLinks.reduce((t, l) => t + l.ratioPct, 0);
    if (Math.abs(total - 100) > 0.01) add("TRACE", 10, `Blend ratios sum to ${total}%, not 100%`, { kind: "LINEAGE_MISMATCH", severity: "MEDIUM" });
  }

  // Supplier history
  if (farmFailedBatches >= 2) add("SUPPLIER", 15, `${b.farm.name} has ${farmFailedBatches} other batches with failed lab tests`, { kind: "REPEAT_OFFENDER", severity: "MEDIUM" });
  else if (farmFailedBatches === 1) add("SUPPLIER", 8, `${b.farm.name} has 1 other batch with a failed lab test`);

  // Geo and timeline
  const idx = (t: EventType) => b.events.findIndex((e) => e.type === t);
  const disorder = ORDER.find(([a, z]) => idx(a) !== -1 && idx(z) !== -1 && idx(z) < idx(a));
  if (disorder) add("GEO_TIMELINE", 10, `${disorder[1].toLowerCase()} recorded before ${disorder[0].toLowerCase()}`, { kind: "TIMELINE_DISORDER", severity: "MEDIUM" });
  const harvest = b.events.find((e) => e.type === "HARVEST");
  const floral = String((harvest?.payload as { floralSource?: string } | null)?.floralSource ?? "").toLowerCase();
  const season = Object.entries(SEASONS).find(([k]) => floral.includes(k))?.[1];
  if (harvest && season) {
    const on = (harvest.payload as { harvestedOn?: string } | null)?.harvestedOn;
    const m = (on ? new Date(`${on}T00:00:00Z`) : harvest.createdAt).getUTCMonth() + 1;
    const [from, to, label] = season;
    const inSeason = from <= to ? m >= from && m <= to : m >= from || m <= to;
    if (!inSeason) add("GEO_TIMELINE", 8, `${floral} harvested in month ${m}, outside its usual flowering window (${label})`);
  }

  // Process and sensors
  for (const e of b.events) {
    const t = (e.payload as { storageTempC?: number } | null)?.storageTempC;
    if (typeof t === "number" && t > STORAGE_TEMP_LIMIT_C) add("PROCESS", 5, `Storage temperature ${t}°C above ${STORAGE_TEMP_LIMIT_C}°C during ${e.type.toLowerCase()}`, { kind: "TEMPERATURE_EXCURSION", severity: "MEDIUM" });
  }
  for (const t of b.tests) {
    const m = (t.results as { moisturePct?: number } | null)?.moisturePct;
    if (typeof m === "number" && (m < MOISTURE_RANGE[0] || m > MOISTURE_RANGE[1])) add("PROCESS", 10, `${t.labRef}: moisture ${m}% outside ${MOISTURE_RANGE[0]}–${MOISTURE_RANGE[1]}%`);
  }

  const groups = (Object.keys(WEIGHTS) as RiskGroup[]).map((group) => {
    const raw = r.filter((x) => x.group === group).reduce((t, x) => t + x.points, 0);
    return { group, weight: WEIGHTS[group], points: Math.min(raw, WEIGHTS[group]), capped: raw > WEIGHTS[group] };
  });
  const score = groups.reduce((t, g) => t + g.points, 0);
  return { score, band: bandFor(score), ruleSetVersion: RULE_SET_VERSION, reasons: r, groups, notEvaluated: NOT_EVALUATED };
}
