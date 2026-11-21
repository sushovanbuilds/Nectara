// HIVEOS engine. Pure and client-safe (no Node imports): rows in, plain observation, rule-based health out.
// Thresholds are general beekeeping rules of thumb stored as data below; have a beekeeping lead review them before real use.
import type { HiveReading, Inspection } from "@prisma/client";

export type HealthState = "STABLE" | "WATCH" | "STRESSED" | "CRITICAL";
export type FactorId = "temp" | "humidity" | "weight" | "activity" | "sound" | "queen" | "brood" | "overdue" | "noinspection" | "stale" | "nodata";

const DAY = 86_400_000;
const INSPECTION_OVERDUE_DAYS = 21;
const STALE_READING_DAYS = 3;
const CORROBORATION_DAYS = 21;

/** What the hive looks like right now, as plain numbers. Everything the engine needs, nothing else. */
export interface Observation {
  tempC: number | null;
  humidity: number | null;
  activity: number | null; // 0..1 index
  soundDb: number | null;
  weightChangeKg: number | null; // newest minus oldest weight reading
  queenSeen: boolean | null;
  brood: string | null; // solid | patchy | spotty
  inspectionAgeDays: number | null;
  readingAgeDays: number | null;
  channels: number; // sensor channels with data
  corroborated: boolean; // an inspection within 21 days of the newest reading
}

export interface Factor {
  id: FactorId;
  effect: "reassuring" | "concerning";
  label: string;
  detail: string;
  penalty: number;
  severe: boolean;
}
export interface Action { priority: "high" | "medium" | "low"; text: string }
export type Confidence = "high" | "medium" | "low" | "none";
export interface HealthResult {
  score: number;
  state: HealthState;
  factors: Factor[];
  /** 0 none, 1 manual observation, 2 basic sensor, 3 multiple sensors, 4 sensors plus corroborating inspection. */
  trustLevel: 0 | 1 | 2 | 3 | 4;
  confidence: Confidence;
  actions: Action[];
}

export const stateFor = (score: number): HealthState => (score >= 85 ? "STABLE" : score >= 65 ? "WATCH" : score >= 40 ? "STRESSED" : "CRITICAL");

/** Latest non-null value per channel, so a partial reading does not erase older data. */
export function observe(readings: HiveReading[], inspections: Inspection[], now: Date): Observation {
  const rs = [...readings].sort((a, b) => +b.at - +a.at);
  const pick = (k: "tempC" | "humidity" | "weightKg" | "activity" | "soundDb") => rs.find((r) => r[k] != null)?.[k] ?? null;
  const weights = rs.filter((r) => r.weightKg != null);
  const insp = [...inspections].sort((a, b) => +b.at - +a.at)[0];
  const obs: Observation = {
    tempC: pick("tempC"), humidity: pick("humidity"), activity: pick("activity"), soundDb: pick("soundDb"),
    weightChangeKg: weights.length >= 2 ? weights[0].weightKg! - weights[weights.length - 1].weightKg! : null,
    queenSeen: insp ? insp.queenSeen : null,
    brood: insp ? insp.broodPattern : null,
    inspectionAgeDays: insp ? (+now - +insp.at) / DAY : null,
    readingAgeDays: rs[0] ? (+now - +rs[0].at) / DAY : null,
    channels: 0,
    corroborated: !!(insp && rs[0] && Math.abs(+rs[0].at - +insp.at) <= CORROBORATION_DAYS * DAY),
  };
  obs.channels = [obs.tempC, obs.humidity, pick("weightKg"), obs.activity, obs.soundDb].filter((v) => v != null).length;
  return obs;
}

const f = (id: FactorId, effect: Factor["effect"], label: string, detail: string, penalty = 0, severe = false): Factor => ({ id, effect, label, detail, penalty, severe });

export function evaluate(o: Observation): HealthResult {
  const fs: Factor[] = [];
  const noData = o.channels === 0 && o.queenSeen === null;
  if (noData) fs.push(f("nodata", "concerning", "No data", "No sensor readings or inspections yet, so health cannot be judged.", 30));

  if (o.tempC !== null) {
    const t = o.tempC;
    if (t >= 33 && t <= 36) fs.push(f("temp", "reassuring", "Brood temperature", `${t}°C is within the healthy 33–36°C range.`));
    else if ((t >= 31 && t < 33) || (t > 36 && t <= 37.5)) fs.push(f("temp", "concerning", "Brood temperature", `${t}°C is slightly outside 33–36°C.`, 7));
    else fs.push(f("temp", "concerning", "Brood temperature", `${t}°C is far outside 33–36°C.`, 22, true));
  }
  if (o.humidity !== null) {
    const h = o.humidity;
    if (h >= 50 && h <= 65) fs.push(f("humidity", "reassuring", "Humidity", `${h}% is within 50–65%.`));
    else if ((h >= 45 && h < 50) || (h > 65 && h <= 72)) fs.push(f("humidity", "concerning", "Humidity", `${h}% is slightly outside 50–65%.`, 5));
    else fs.push(f("humidity", "concerning", "Humidity", `${h}% is far outside 50–65%.`, 12, true));
  }
  if (o.weightChangeKg !== null) {
    const w = o.weightChangeKg;
    if (w < -1.5) fs.push(f("weight", "concerning", "Hive weight", `Down ${Math.abs(w).toFixed(1)} kg over the readings: stores or bees are being lost.`, 10, true));
    else if (w < -0.5) fs.push(f("weight", "concerning", "Hive weight", `Down ${Math.abs(w).toFixed(1)} kg over the readings.`, 4));
    else fs.push(f("weight", "reassuring", "Hive weight", `${w >= 0 ? "Up" : "Down"} ${Math.abs(w).toFixed(1)} kg: stable or growing.`));
  }
  if (o.activity !== null) {
    const a = o.activity;
    if (a >= 0.7) fs.push(f("activity", "reassuring", "Foraging activity", `Activity index ${a} is strong.`));
    else if (a >= 0.5) fs.push(f("activity", "concerning", "Foraging activity", `Activity index ${a} is lower than usual.`, 6));
    else fs.push(f("activity", "concerning", "Foraging activity", `Activity index ${a} is very low.`, 18, true));
  }
  if (o.soundDb !== null) {
    const s = o.soundDb;
    if (s <= 48) fs.push(f("sound", "reassuring", "Colony sound", `${s} dB is a calm level.`));
    else if (s <= 55) fs.push(f("sound", "concerning", "Colony sound", `${s} dB is somewhat elevated.`, 4));
    else fs.push(f("sound", "concerning", "Colony sound", `${s} dB is loud, which can mean a disturbed or queenless colony.`, 12, true));
  }
  if (o.queenSeen !== null) {
    fs.push(o.queenSeen ? f("queen", "reassuring", "Queen", "Queen seen at the last inspection.") : f("queen", "concerning", "Queen", "Queen was not seen at the last inspection.", 6));
    if (o.brood === "solid") fs.push(f("brood", "reassuring", "Brood pattern", "Solid brood pattern."));
    else if (o.brood === "patchy") fs.push(f("brood", "concerning", "Brood pattern", "Patchy brood pattern.", 4));
    else if (o.brood) fs.push(f("brood", "concerning", "Brood pattern", `${o.brood} brood pattern.`, 15, true));
  } else if (!noData) fs.push(f("noinspection", "concerning", "Inspection", "No inspection on record.", 4));
  if (o.inspectionAgeDays !== null && o.inspectionAgeDays > INSPECTION_OVERDUE_DAYS) {
    fs.push(f("overdue", "concerning", "Inspection overdue", `Last inspection was ${Math.round(o.inspectionAgeDays)} days ago.`, 5));
  }
  if (o.readingAgeDays !== null && o.readingAgeDays > STALE_READING_DAYS) {
    fs.push(f("stale", "concerning", "Sensor silent", `No sensor reading for ${Math.round(o.readingAgeDays)} days.`, 10));
  }

  const score = Math.max(0, 100 - fs.reduce((t, x) => t + x.penalty, 0));
  const state = stateFor(score);
  const trustLevel: HealthResult["trustLevel"] = o.channels === 0 ? (o.queenSeen !== null ? 1 : 0) : o.channels < 3 ? 2 : o.corroborated ? 4 : 3;
  const stale = o.readingAgeDays !== null && o.readingAgeDays > STALE_READING_DAYS;
  const base: Confidence = trustLevel === 4 ? "high" : trustLevel === 3 ? "medium" : trustLevel === 0 ? "none" : "low";
  const confidence: Confidence = stale && base === "high" ? "medium" : stale && base === "medium" ? "low" : base;
  return { score, state, factors: fs, trustLevel, confidence, actions: actionsFor(fs, state) };
}

const ACTION: Partial<Record<FactorId, string>> = {
  temp: "Check ventilation, shade and the entrance; recheck brood temperature within 24 hours.",
  humidity: "Check for condensation or a damp floor and improve airflow.",
  weight: "Inspect food stores; consider feeding if the weight keeps falling.",
  activity: "Look for robbing, disease or a missing queen; compare with neighbouring hives.",
  sound: "Open the hive calmly and check for the queen and signs of disturbance.",
  queen: "Re-inspect for the queen or eggs within a week; plan to re-queen if absent.",
  brood: "Examine the brood frames for disease and queen quality.",
  overdue: "Schedule an inspection.",
  noinspection: "Record a first inspection so sensor data can be corroborated.",
  stale: "Check the sensor battery and connection.",
  nodata: "Log an inspection or connect a sensor.",
};

function actionsFor(fs: Factor[], state: HealthState): Action[] {
  const out = fs.filter((x) => x.effect === "concerning" && ACTION[x.id])
    .map<Action>((x) => ({ priority: x.severe || state === "CRITICAL" ? "high" : "medium", text: ACTION[x.id]! }));
  if (!out.length) out.push({ priority: "low", text: "Keep routine inspections about every two weeks." });
  return out.sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.priority] - ({ high: 0, medium: 1, low: 2 })[b.priority]);
}

export interface Scenario { tempDeltaC: number; humidityDelta: number; activityDelta: number; days: number }

/**
 * What-if projection. Rule-of-thumb, not a forecast: each change ramps in over three days, so a 1-day
 * change applies a third of the way. Pure; nothing is stored.
 */
export function simulate(o: Observation, s: Scenario): { before: HealthResult; after: HealthResult; projected: Observation } {
  const ramp = Math.min(1, Math.max(0, s.days) / 3);
  const shift = (v: number | null, d: number, lo: number, hi: number) => (v === null ? null : Math.min(hi, Math.max(lo, +(v + d * ramp).toFixed(2))));
  const projected: Observation = {
    ...o,
    tempC: shift(o.tempC, s.tempDeltaC, 0, 50),
    humidity: shift(o.humidity, s.humidityDelta, 0, 100),
    activity: shift(o.activity, s.activityDelta, 0, 1),
  };
  return { before: evaluate(o), after: evaluate(projected), projected };
}

export interface ApiaryAnomaly { farmId: string; farmName: string; hives: string[]; sharedFactors: FactorId[]; message: string }

/** Flag an apiary when at least two hives, and half or more of it, are below Stable together. */
export function apiaryAnomalies(items: { farmId: string; farmName: string; code: string; result: HealthResult }[]): ApiaryAnomaly[] {
  const byFarm = new Map<string, typeof items>();
  for (const i of items) byFarm.set(i.farmId, [...(byFarm.get(i.farmId) ?? []), i]);
  const out: ApiaryAnomaly[] = [];
  for (const [farmId, hs] of byFarm) {
    const bad = hs.filter((h) => h.result.state !== "STABLE");
    if (bad.length < 2 || bad.length / hs.length < 0.5) continue;
    const counts = new Map<FactorId, number>();
    for (const h of bad) for (const x of h.result.factors) if (x.effect === "concerning") counts.set(x.id, (counts.get(x.id) ?? 0) + 1);
    const sharedFactors = [...counts].filter(([, n]) => n >= 2).map(([id]) => id);
    out.push({ farmId, farmName: hs[0].farmName, hives: bad.map((h) => h.code), sharedFactors,
      message: `${bad.length} of ${hs.length} hives at ${hs[0].farmName} are below Stable together${sharedFactors.length ? `, sharing: ${sharedFactors.join(", ")}` : ""}.` });
  }
  return out;
}
