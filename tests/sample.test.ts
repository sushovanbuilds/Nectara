import { describe, expect, it } from "vitest";
import { eventHash, GENESIS } from "@/lib/hash";
import { merkleRoot } from "@/lib/merkle";
import { sample } from "@/lib/sample";
import { demoRepo } from "@/lib/repo/demo";

const chainOk = (batchId: string) => {
  let prev = GENESIS;
  return sample.events.filter((e) => e.batchId === batchId).every((e) => {
    const ok = e.prevHash === prev && eventHash(e) === e.hash;
    prev = e.hash;
    return ok;
  });
};
const sealOk = (batchId: string) => {
  const a = sample.anchors.find((x) => x.batchId === batchId)!;
  return merkleRoot(sample.events.filter((e) => e.batchId === batchId).map((e) => e.hash)) === a.merkleRoot;
};

describe("sample data story", () => {
  it("has the keeper's batch with a lab test still in progress", async () => {
    const b = await demoRepo.getBatch("HC-2026-00124");
    expect(b?.kg).toBe(420);
    expect(b?.farm.name).toBe("Saharanpur Apiary");
    expect(b?.tests[0]).toMatchObject({ labRef: "LAB-2026-441", status: "IN_PROGRESS" });
  });
  it("includes a failed lab test, a high-risk incident and hives A-105 / A-106", async () => {
    expect(sample.tests.some((t) => t.status === "FAILED")).toBe(true);
    expect((await demoRepo.listIncidents())[0]).toMatchObject({ band: "HIGH" });
    expect((await demoRepo.getHive("A-105"))?.healthScore).toBe(100);
    expect((await demoRepo.getHive("A-106"))?.healthState).toBe("WATCH");
  });
  it("keeps hash chains valid for the intact batch and exposes the tampered seal", () => {
    expect(chainOk("b-124")).toBe(true);
    expect(sealOk("b-124")).toBe(true);
    expect(chainOk("b-118")).toBe(false);
    expect(sealOk("b-118")).toBe(true); // stored root is the original; the chain recompute is what breaks
  });
  it("never reuses a certificate across batches", () => {
    const refs = sample.tests.map((t) => t.certificateRef).filter(Boolean);
    expect(new Set(refs).size).toBe(refs.length);
  });
});
