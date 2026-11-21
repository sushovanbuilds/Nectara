import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import type { Session } from "@/lib/auth/session";
import { eventHash, GENESIS } from "@/lib/hash";
import { demoRepo as repo } from "@/lib/repo/demo";
import { appendEvent, holderOrgId, recordBlend, recordHarvest, recordStep, TraceError } from "@/lib/trace";

const as = (role: Role, uid: string, orgId: string): Session => ({ uid, role, name: uid, orgId, exp: 9e9 });
const keeper = as("KEEPER", "u-ravi", "org-keeper");
const collector = as("COLLECTOR", "u-collector", "org-collector");
const processor = as("PROCESSOR", "u-proc", "org-proc");
const distributor = as("DISTRIBUTOR", "u-dist", "org-dist");

const chainIntact = async (code: string) => {
  let prev = GENESIS;
  for (const e of (await repo.getBatch(code))!.events) {
    if (e.prevHash !== prev || eventHash(e) !== e.hash) return false;
    prev = e.hash;
  }
  return true;
};
const status = async (p: Promise<unknown>) => p.then(() => 200, (e) => (e instanceof TraceError ? e.status : 500));

describe("hive to shelf", () => {
  it("runs the full flow on a new harvest with an intact hash chain", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "Mustard honey", floralSource: "Mustard", kg: 50 });
    expect(b.code).toMatch(/^HC-\d{4}-\d{5}$/);
    await recordStep(repo, collector, b.code, "collection", { kg: 50 });
    await recordStep(repo, processor, b.code, "custody", {});
    await recordStep(repo, processor, b.code, "processing", { process: "Filtering" });
    await recordStep(repo, processor, b.code, "packaging", { units: 100, unitSizeG: 500 });
    await recordStep(repo, distributor, b.code, "custody", {});
    await recordStep(repo, distributor, b.code, "shipment", { carrier: "BlueDart", origin: "Dehradun", destination: "Delhi" });
    const d = (await repo.getBatch(b.code))!;
    expect(d.events.map((e) => e.type)).toEqual(["HIVE", "HARVEST", "COLLECTION", "PROCESSING", "PROCESSING", "PACKAGING", "SHIPMENT", "SHIPMENT"]);
    expect(d.custody).toHaveLength(3);
    expect(d.shipments).toHaveLength(1);
    expect(holderOrgId(d)).toBe("org-dist");
    expect(await chainIntact(b.code)).toBe(true);
  });

  it("runs the flow on the sample batch HC-2026-00124", async () => {
    const code = "HC-2026-00124"; // sample custody: collector already holds it
    await recordStep(repo, processor, code, "custody", {});
    await recordStep(repo, processor, code, "processing", { process: "Settling" });
    await recordStep(repo, distributor, code, "custody", {});
    expect((await repo.getBatch(code))!.events.length).toBeGreaterThanOrEqual(5);
    expect(await chainIntact(code)).toBe(true);
  });

  it("enforces custody and ownership", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-106", honeyType: "Wildflower", floralSource: "Mixed", kg: 20 });
    expect(await status(recordStep(repo, processor, b.code, "processing", { process: "x" }))).toBe(403); // not in custody
    expect(await status(recordHarvest(repo, as("KEEPER", "u-x", "org-other"), { hiveCode: "A-106", honeyType: "x", floralSource: "x", kg: 1 }))).toBe(403);
    expect(await status(recordStep(repo, keeper, b.code, "collection", {}))).toBe(409); // already holds it
    expect(await status(recordHarvest(repo, keeper, { hiveCode: "A-106", honeyType: "x", floralSource: "x", kg: -3 }))).toBe(400);
    expect(await status(recordStep(repo, processor, "HC-NOPE", "custody", {}))).toBe(404);
  });

  it("blends batches with ratios that sum to 100% and records lineage", async () => {
    const a = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "Mustard", floralSource: "Mustard", kg: 10 });
    const c = await recordHarvest(repo, keeper, { hiveCode: "A-106", honeyType: "Wildflower", floralSource: "Mixed", kg: 10 });
    for (const x of [a, c]) await recordStep(repo, processor, x.code, "custody", {});
    expect(await status(recordBlend(repo, processor, { honeyType: "Blend", kg: 20, parents: [{ code: a.code, ratioPct: 60 }, { code: c.code, ratioPct: 30 }] }))).toBe(422);
    const child = await recordBlend(repo, processor, { honeyType: "Blend", kg: 20, parents: [{ code: a.code, ratioPct: 60 }, { code: c.code, ratioPct: 40 }] });
    const d = (await repo.getBatch(child.code))!;
    expect(d.parentLinks.map((l) => l.ratioPct).sort()).toEqual([40, 60]);
    expect(d.events[0].type).toBe("BLENDING");
    expect(holderOrgId(d)).toBe("org-proc");
  });
});

describe("append-only events", () => {
  it("refuses a second event on the same chain tip", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "x", kg: 1 });
    const first = (await repo.getBatch(b.code))!.events[0];
    await expect(repo.insertEvent({ ...first, id: "dup" })).rejects.toThrow("CHAIN_CONFLICT");
    expect((await appendEvent(repo, b.id, "RETAIL", {}, "u-ravi")).prevHash).not.toBe(GENESIS);
  });

  it("exposes no way to update or delete an event", () => {
    const names = Object.keys(repo).filter((k) => /event/i.test(k));
    expect(names).toEqual(["lastEvent", "insertEvent"]);
  });

  it("has no PUT, PATCH or DELETE handler in any API route", () => {
    const files: string[] = [];
    const walk = (d: string) => readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f === "route.ts" && files.push(join(d, f))));
    walk("app/api");
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) expect(readFileSync(f, "utf8"), f).not.toMatch(/export\s+(async\s+)?(function|const)\s+(PUT|PATCH|DELETE)\b/);
  });
});

describe("harvest date", () => {
  const keeperS = { uid: "u-ravi", role: "KEEPER" as const, name: "Ravi", orgId: "org-keeper", exp: 9e9 };
  const base = { hiveCode: "A-105", honeyType: "Mustard honey", floralSource: "Mustard", kg: 3 };
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  it("records the keeper's harvest date in the harvest and its event", async () => {
    const on = day(-3);
    const b = await recordHarvest(repo, keeperS, { ...base, harvestedOn: on });
    const d = (await repo.getBatch(b.code))!;
    expect((d.events.find((e) => e.type === "HARVEST")!.payload as { harvestedOn: string }).harvestedOn).toBe(on);
  });
  it("rejects future dates, dates over a year old and malformed dates", async () => {
    for (const harvestedOn of [day(2), day(-400), "21-08-2026", "2026-13-45"]) {
      await expect(recordHarvest(repo, keeperS, { ...base, harvestedOn })).rejects.toMatchObject({ status: 400 });
    }
  });
});
