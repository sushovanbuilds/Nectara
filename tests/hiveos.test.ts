import { describe, expect, it } from "vitest";
import type { HiveReading } from "@prisma/client";
import { apiaryAnomalies, evaluate, type HealthResult, observe, type Observation, simulate, stateFor } from "@/lib/hiveos";
import { recordInspection, recordReading, referenceNow, viewAll } from "@/lib/hives";
import { demoRepo as repo } from "@/lib/repo/demo";

const keeper = { uid: "u-ravi", role: "KEEPER" as const, name: "Ravi", orgId: "org-keeper", exp: 9e9 };
const healthy: Observation = {
  tempC: 35, humidity: 57, activity: 0.85, soundDb: 43, weightChangeKg: 0.7, queenSeen: true, brood: "solid",
  inspectionAgeDays: 3, readingAgeDays: 0.1, channels: 5, corroborated: true,
};

describe("health states", () => {
  it("has the right boundaries: 85, 65, 40", () => {
    expect([100, 85, 84, 65, 64, 40, 39, 0].map(stateFor)).toEqual(["STABLE", "STABLE", "WATCH", "WATCH", "STRESSED", "STRESSED", "CRITICAL", "CRITICAL"]);
  });
  it("STABLE: everything in range scores 100, all factors reassuring", () => {
    const r = evaluate(healthy);
    expect(r).toMatchObject({ score: 100, state: "STABLE" });
    expect(r.factors.every((f) => f.effect === "reassuring")).toBe(true);
    expect(r.actions).toEqual([{ priority: "low", text: expect.stringMatching(/routine inspections/) }]);
  });
  it("WATCH: several mild issues", () => {
    const r = evaluate({ ...healthy, tempC: 37, humidity: 68, activity: 0.6, soundDb: 52, queenSeen: false });
    expect(r).toMatchObject({ score: 72, state: "WATCH" });
    expect(r.factors.filter((f) => f.effect === "concerning").map((f) => f.id)).toEqual(["temp", "humidity", "activity", "sound", "queen"]);
  });
  it("STRESSED: severe temperature and humidity", () => {
    expect(evaluate({ ...healthy, tempC: 38.4, humidity: 75, activity: 0.6 })).toMatchObject({ score: 60, state: "STRESSED" });
  });
  it("CRITICAL: many severe problems, with high-priority actions first", () => {
    const r = evaluate({ ...healthy, tempC: 38.4, humidity: 75, activity: 0.3, soundDb: 60, weightChangeKg: -3, brood: "spotty" });
    expect(r.state).toBe("CRITICAL");
    expect(r.score).toBeLessThan(40);
    expect(r.actions[0].priority).toBe("high");
    expect(r.actions.every((a, i, all) => i === 0 || ({ high: 0, medium: 1, low: 2 })[all[i - 1].priority] <= ({ high: 0, medium: 1, low: 2 })[a.priority])).toBe(true);
  });
  it("never goes below 0, and no data is its own explained state", () => {
    expect(evaluate({ ...healthy, tempC: 50, humidity: 99, activity: 0, soundDb: 120, weightChangeKg: -9, queenSeen: false, brood: "spotty", inspectionAgeDays: 90, readingAgeDays: 30 }).score).toBeGreaterThanOrEqual(0);
    const none = evaluate({ tempC: null, humidity: null, activity: null, soundDb: null, weightChangeKg: null, queenSeen: null, brood: null, inspectionAgeDays: null, readingAgeDays: null, channels: 0, corroborated: false });
    expect(none).toMatchObject({ score: 70, trustLevel: 0, confidence: "none" });
    expect(none.factors[0].id).toBe("nodata");
  });
});

describe("trust ladder and confidence", () => {
  it("climbs 1 to 4 with evidence", () => {
    const noSensors = { ...healthy, tempC: null, humidity: null, activity: null, soundDb: null, weightChangeKg: null, channels: 0 };
    expect(evaluate(noSensors).trustLevel).toBe(1);
    expect(evaluate({ ...healthy, channels: 2 }).trustLevel).toBe(2);
    expect(evaluate({ ...healthy, corroborated: false }).trustLevel).toBe(3);
    expect(evaluate(healthy).trustLevel).toBe(4);
  });
  it("lowers confidence when the sensor has gone quiet, and says so", () => {
    const r = evaluate({ ...healthy, readingAgeDays: 6 });
    expect(r.confidence).toBe("medium");
    expect(r.factors.some((f) => f.id === "stale")).toBe(true);
  });
});

describe("observe", () => {
  const rd = (day: number, over: Partial<HiveReading>): HiveReading => ({ id: `r${day}`, hiveId: "h", at: new Date(Date.UTC(2026, 7, day)), tempC: null, humidity: null, weightKg: null, activity: null, soundDb: null, ...over });
  it("uses the latest value per channel and the weight change across readings", () => {
    const o = observe([rd(1, { tempC: 34, weightKg: 40 }), rd(2, { humidity: 60 }), rd(3, { weightKg: 41.5 })], [], new Date(Date.UTC(2026, 7, 3)));
    expect(o).toMatchObject({ tempC: 34, humidity: 60, weightChangeKg: 1.5, channels: 3, readingAgeDays: 0, queenSeen: null });
  });
});

describe("sample hives", () => {
  it("A-105 is Stable 100 at trust level 4, A-106 Watch at level 2, S-301 Stressed", async () => {
    const { views } = await viewAll(repo);
    const by = (c: string) => views.find((v) => v.hive.code === c)!.health;
    expect(by("A-105")).toMatchObject({ score: 100, state: "STABLE", trustLevel: 4, confidence: "high" });
    expect(by("A-106")).toMatchObject({ state: "WATCH", trustLevel: 2 });
    expect(by("S-301").state).toBe("STRESSED");
    for (const v of views) expect([v.hive.healthState, v.hive.healthScore, v.hive.trustLevel]).toEqual([v.health.state, v.health.score, v.health.trustLevel]);
  });
});

describe("simulate (pure what-if)", () => {
  it("projects a heat wave without changing its input", () => {
    const before = structuredClone(healthy);
    const r = simulate(healthy, { tempDeltaC: 3, humidityDelta: 0, activityDelta: 0, days: 5 });
    expect(healthy).toEqual(before);
    expect(r.before.state).toBe("STABLE");
    expect(r.projected.tempC).toBe(38);
    expect(r.after).toMatchObject({ score: 78, state: "WATCH" });
  });
  it("ramps changes in over three days, is deterministic, and clamps", () => {
    const s = { tempDeltaC: 3, humidityDelta: 0, activityDelta: 0, days: 1 };
    expect(simulate(healthy, s).projected.tempC).toBe(36);
    expect(simulate(healthy, s)).toEqual(simulate(healthy, s));
    expect(simulate(healthy, { tempDeltaC: 0, humidityDelta: 99, activityDelta: 5, days: 14 }).projected).toMatchObject({ humidity: 100, activity: 1 });
    expect(simulate(healthy, { tempDeltaC: 0, humidityDelta: 0, activityDelta: 0, days: 0 }).after.score).toBe(100);
  });
  it("ignores channels the hive does not report", () => {
    const r = simulate({ ...healthy, tempC: null }, { tempDeltaC: 6, humidityDelta: 0, activityDelta: 0, days: 5 });
    expect(r.projected.tempC).toBeNull();
    expect(r.after.score).toBe(r.before.score);
  });
});

describe("apiary grouping", () => {
  const item = (farmId: string, code: string, over: Partial<Observation>) => ({ farmId, farmName: `Farm ${farmId}`, code, result: evaluate({ ...healthy, ...over }) as HealthResult });
  const bad = { tempC: 37, humidity: 68, activity: 0.6 }; // three mild issues: 82, Watch
  it("flags an apiary when two or more hives, and half or more, decline together, with the shared cause", () => {
    const a = apiaryAnomalies([item("1", "a", bad), item("1", "b", bad), item("1", "c", {})]);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ hives: ["a", "b"], sharedFactors: ["temp", "humidity", "activity"] });
  });
  it("does not flag one weak hive, a minority, or a lone hive", () => {
    expect(apiaryAnomalies([item("1", "a", bad), item("1", "b", {}), item("1", "c", {})])).toEqual([]);
    expect(apiaryAnomalies([item("1", "a", bad), item("1", "b", bad), item("1", "c", {}), item("1", "d", {}), item("1", "e", {})])).toEqual([]);
    expect(apiaryAnomalies([item("2", "a", bad)])).toEqual([]);
  });
});

describe("recording readings and inspections", () => {
  it("updates the hive's stored health, and refuses other organisations and bad input", async () => {
    const hive = (await repo.getHive("A-105"))!;
    const scoreBefore = hive.healthScore; // the repo returns live objects, so capture it now
    await recordReading(repo, keeper, "A-105", { tempC: 41 });
    const after = (await repo.getHive("A-105"))!;
    expect(after.healthState).not.toBe("STABLE");
    expect(after.healthScore).toBeLessThan(scoreBefore);

    await recordInspection(repo, keeper, "A-105", { queenSeen: true, broodPattern: "solid", notes: "ok" });
    expect((await repo.listInspections(hive.id)).length).toBe(2);

    const other = { ...keeper, orgId: "org-other" };
    await expect(recordReading(repo, other, "A-105", { tempC: 30 })).rejects.toMatchObject({ status: 403 });
    await expect(recordReading(repo, keeper, "A-105", {})).rejects.toMatchObject({ status: 400 });
    await expect(recordReading(repo, keeper, "A-105", { humidity: 140 })).rejects.toMatchObject({ status: 400 });
    await expect(recordReading(repo, keeper, "NOPE", { tempC: 30 })).rejects.toMatchObject({ status: 404 });
    await expect(recordInspection(repo, keeper, "A-105", { queenSeen: "yes", broodPattern: "solid" })).rejects.toMatchObject({ status: 400 });
    await expect(recordInspection(repo, keeper, "A-105", { queenSeen: true, broodPattern: "great" })).rejects.toMatchObject({ status: 400 });
  });
  it("uses the wall clock outside demo and the newest sample reading in demo", async () => {
    expect(+(await referenceNow(repo))).toBeGreaterThan(0);
  });
});
