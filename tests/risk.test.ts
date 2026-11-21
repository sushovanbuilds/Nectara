import { describe, expect, it } from "vitest";
import type { Alert, BatchEvent, QualityTest } from "@prisma/client";
import { can } from "@/lib/auth/capabilities";
import { openCase, updateCase } from "@/lib/cases";
import { clusterAlerts, WINDOW_MS } from "@/lib/incidents";
import { bandFor, scoreBatch, WEIGHTS } from "@/lib/risk";
import { runRiskEngine, scoreFromRepo } from "@/lib/risk-engine";
import { demoRepo as repo } from "@/lib/repo/demo";
import type { BatchDetail } from "@/lib/repo/types";
import { verifySeal } from "@/lib/seal";

const detail = async (code: string) => (await repo.getBatch(code))!;
// Synthetic events carry no real hashes, so they get a neutral seal; sample batches use the real check.
const UNSEALED = { state: "UNSEALED" as const, newSinceAnchor: 0 };
const score = (b: BatchDetail, extra: { alerts?: Alert[]; farmFailedBatches?: number; realSeal?: boolean } = {}) =>
  scoreBatch({ batch: b, seal: extra.realSeal ? verifySeal(b.events, b.anchors) : UNSEALED, alerts: extra.alerts ?? [], farmFailedBatches: extra.farmFailedBatches ?? 0 });
const ev = (type: BatchEvent["type"], payload: object = {}): BatchEvent =>
  ({ id: `e-${type}-${Math.random()}`, batchId: "bx", type, payload, actorId: "u", createdAt: new Date("2026-01-10"), prevHash: "", hash: "" });
const test = (status: QualityTest["status"], results: object = {}): QualityTest =>
  ({ id: "t", batchId: "bx", labRef: "LAB-X", status, certificateRef: null, results, testedAt: null });
// A clean base batch: harvest link, intact (no anchor), mustard in season, one custody hand-off.
async function base(over: Partial<BatchDetail> = {}): Promise<BatchDetail> {
  const d = await detail("HC-2026-00124");
  return { ...d, tests: [test("PASSED", { moisturePct: 17 })], events: [ev("HIVE"), ev("HARVEST", { floralSource: "Mustard" })], anchors: [], ...over };
}

describe("bands", () => {
  it("is low below 30, medium from 30, high from 60", () => {
    expect([0, 29, 30, 59, 60, 100].map(bandFor)).toEqual(["LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "HIGH"]);
  });
});

describe("rule groups", () => {
  it("scores a clean batch at 0 with no reasons", async () => {
    const r = score(await base());
    expect(r).toMatchObject({ score: 0, band: "LOW", reasons: [], ruleSetVersion: "2026.1" });
  });
  it("lab: failed test 40, missing test 25 once it has moved, 5 before", async () => {
    expect(score(await base({ tests: [test("FAILED")] })).score).toBe(40);
    const moved = await base({ tests: [], events: [ev("HARVEST", { floralSource: "Mustard" }), ev("PROCESSING")] });
    expect(score(moved).reasons[0]).toMatchObject({ group: "LAB", points: 25 });
    expect(score(await base({ tests: [] })).score).toBe(5);
  });
  it("lab: unfinished test while packaged is 15; HMF over limit is 15", async () => {
    expect(score(await base({ tests: [test("IN_PROGRESS")], events: [ev("HARVEST", { floralSource: "Mustard" }), ev("PACKAGING")] })).score).toBe(15);
    expect(score(await base({ tests: [test("PASSED", { hmfMgKg: 55, moisturePct: 17 })] })).score).toBe(15);
  });
  it("lab: certificate reuse adds 30 and the group never exceeds its 40-point weight", async () => {
    const reuse = { kind: "CERTIFICATE_REUSE" } as Alert;
    const r = score(await base({ tests: [test("FAILED")] }), { alerts: [reuse] });
    expect(r.reasons.filter((x) => x.group === "LAB").reduce((t, x) => t + x.points, 0)).toBe(70);
    expect(r.groups.find((g) => g.group === "LAB")).toMatchObject({ points: 40, capped: true });
    expect(r.score).toBe(40);
  });
  it("traceability: custody gap, broken seal and lineage mismatch each raise a signal", async () => {
    const gap = score(await base({ custody: [], events: [ev("HARVEST", { floralSource: "Mustard" }), ev("PROCESSING")] }));
    expect(gap.reasons.find((r) => r.signal?.kind === "CUSTODY_GAP")?.points).toBe(10);
    const d = await detail("HC-2026-00118"); // sample with an edited event
    expect(score(d, { realSeal: true }).reasons.find((r) => r.signal?.kind === "RECORD_SEAL_BROKEN")).toMatchObject({ group: "TRACE", points: 20 });
    const lin = score(await base({ parentLinks: [{ id: "l", parentId: "a", childId: "bx", ratioPct: 60 }, { id: "m", parentId: "b", childId: "bx", ratioPct: 30 }] }));
    expect(lin.reasons.find((r) => r.signal?.kind === "LINEAGE_MISMATCH")).toBeTruthy();
  });
  it("supplier history: 1 failed sibling is 8, 2 or more is 15", async () => {
    expect(score(await base(), { farmFailedBatches: 1 }).score).toBe(8);
    expect(score(await base(), { farmFailedBatches: 3 }).score).toBe(15);
  });
  it("timeline: out-of-order events and out-of-season harvests", async () => {
    const disorder = score(await base({ events: [ev("HARVEST", { floralSource: "Mustard" }), ev("HIVE")] }));
    expect(disorder.reasons[0].signal?.kind).toBe("TIMELINE_DISORDER");
    const aug = ev("HARVEST", { floralSource: "Mustard" });
    aug.createdAt = new Date("2026-08-21");
    expect(score(await base({ events: [ev("HIVE"), aug] })).reasons[0]).toMatchObject({ group: "GEO_TIMELINE", points: 8 });
  });
  it("process: storage temperature and moisture out of range", async () => {
    const hot = score(await base({ events: [ev("HARVEST", { floralSource: "Mustard" }), ev("PROCESSING", { storageTempC: 36 })] }));
    expect(hot.reasons[0]).toMatchObject({ group: "PROCESS", points: 5 });
    expect(score(await base({ tests: [test("PASSED", { moisturePct: 23 })] })).score).toBe(10);
  });
  it("can never exceed the weights, and weights add to 100", async () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
    const worst = score(await base({ tests: [test("FAILED", { moisturePct: 30, hmfMgKg: 90 })], custody: [], events: [ev("PACKAGING"), ev("SHIPMENT"), ev("HARVEST", { floralSource: "Mustard" }), ev("HIVE"), ev("PROCESSING", { storageTempC: 40 })] }), { farmFailedBatches: 5, alerts: [{ kind: "CERTIFICATE_REUSE" } as Alert] });
    expect(worst.score).toBeLessThanOrEqual(100);
    for (const g of worst.groups) expect(g.points).toBeLessThanOrEqual(g.weight);
  });
  it("says what it could not evaluate", async () => {
    expect(score(await base()).notEvaluated.join()).toMatch(/travel speed/);
  });
});

describe("sample batches", () => {
  it("scores are reproducible and explained point by point", async () => {
    const batches = await repo.listBatches();
    const run = async (code: string) => scoreFromRepo(repo, await detail(code), batches);
    for (const code of ["HC-2026-00124", "HC-2026-00131", "HC-2026-00118"]) expect(await run(code)).toEqual(await run(code));

    const a = await run("HC-2026-00124");
    expect(a).toMatchObject({ score: 8, band: "LOW" });
    expect(a.reasons.map((r) => [r.group, r.points])).toEqual([["GEO_TIMELINE", 8]]); // mustard harvested in August

    const f = await run("HC-2026-00131");
    expect(f).toMatchObject({ score: 50, band: "MEDIUM" });
    expect(f.reasons.map((r) => [r.group, r.points])).toEqual([["LAB", 40], ["LAB", 30], ["PROCESS", 10]]);
    expect(f.groups.find((g) => g.group === "LAB")?.capped).toBe(true);

    expect(await run("HC-2026-00118")).toMatchObject({ score: 20, band: "LOW" });
  });
});

describe("clusterAlerts (72-hour window)", () => {
  const h = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 3_600_000);
  const n = (id: string, hours: number, ...entities: string[]) => ({ id, createdAt: h(hours), entities });
  it("groups alerts that share an entity within 72 hours", () => {
    expect(clusterAlerts([n("a", 0, "farm:1"), n("b", 10, "farm:1", "org:x")])).toEqual([["a", "b"]]);
  });
  it("keeps the 72h boundary inclusive and splits beyond it", () => {
    expect(clusterAlerts([n("a", 0, "f"), n("b", 72, "f")])).toHaveLength(1);
    expect(clusterAlerts([{ ...n("a", 0, "f") }, { id: "b", createdAt: new Date(+h(72) + 1), entities: ["f"] }])).toHaveLength(0);
    expect(WINDOW_MS).toBe(72 * 3_600_000);
  });
  it("does not group alerts with nothing in common", () => {
    expect(clusterAlerts([n("a", 0, "farm:1"), n("b", 1, "farm:2")])).toEqual([]);
  });
  it("chains transitively and leaves singletons out", () => {
    const c = clusterAlerts([n("a", 0, "x"), n("b", 60, "x", "y"), n("c", 120, "y"), n("d", 130, "z")]);
    expect(c).toHaveLength(1);
    expect([...c[0]].sort()).toEqual(["a", "b", "c"]);
  });
});

describe("risk engine run", () => {
  it("raises signal alerts once, joins them to the incident around the shared lab, and is idempotent", async () => {
    const now = new Date("2026-08-26T12:00:00Z"); // within 72h of the sample alerts
    const first = await runRiskEngine(repo, now);
    expect(first).toMatchObject({ scored: 3, alertsRaised: 1, incidentsCreated: 0, incidentsUpdated: 1 }); // LAB_FAILED on 131 joins inc-1
    const inc = (await repo.getIncident("inc-1"))!;
    expect(inc.band).toBe("HIGH");
    expect(inc.alerts.map((a) => a.kind).sort()).toEqual(["CERTIFICATE_REUSE", "LAB_FAILED", "RECORD_SEAL_BROKEN"]);

    const second = await runRiskEngine(repo, new Date(+now + 60_000));
    expect(second).toMatchObject({ alertsRaised: 0, incidentsCreated: 0, incidentsUpdated: 0 });
    const stored = await repo.listRiskScores();
    expect(stored.length).toBe(6);
    expect(stored.every((s) => s.ruleSetVersion === "2026.1")).toBe(true);
  });
});

describe("cases and access", () => {
  const inv = { uid: "u-invest", role: "INVESTIGATOR" as const, name: "Farah Khan", orgId: "org-invest", exp: 9e9 };
  it("opens one case per incident, records status and notes, rejects bad input", async () => {
    const c = await openCase(repo, inv, "inc-1");
    expect(c).toMatchObject({ status: "OPEN", assigneeId: "u-invest" });
    await expect(openCase(repo, inv, "inc-1")).rejects.toMatchObject({ status: 409 });
    await expect(openCase(repo, inv, "nope")).rejects.toMatchObject({ status: 404 });
    const u = await updateCase(repo, inv, c.id, { status: "IN_REVIEW", note: "Called the lab." });
    expect(u.status).toBe("IN_REVIEW");
    expect(u.notes).toMatch(/Farah Khan: Called the lab\./);
    await expect(updateCase(repo, inv, c.id, { status: "FRAUD" })).rejects.toMatchObject({ status: 400 });
    await expect(updateCase(repo, inv, c.id, { note: "  " })).rejects.toMatchObject({ status: 400 });
    await updateCase(repo, inv, c.id, { status: "RESOLVED" });
    await expect(openCase(repo, inv, "inc-1")).resolves.toMatchObject({ status: "OPEN" }); // resolved cases can be reopened as new
  });
  it("only investigators read risk and run the engine", () => {
    for (const role of ["KEEPER", "COLLECTOR", "LAB", "PROCESSOR", "DISTRIBUTOR", "ADMIN"] as const) {
      expect(can(role, "risk:read")).toBe(false);
      expect(can(role, "risk:run")).toBe(false);
      expect(can(role, "case:manage")).toBe(false);
    }
    expect(can("INVESTIGATOR", "risk:run")).toBe(true);
  });
});
