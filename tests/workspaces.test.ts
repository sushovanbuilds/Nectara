import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { createUser } from "@/lib/admin";
import { recordLabResult } from "@/lib/lab";
import { demoRepo as repo } from "@/lib/repo/demo";
import { sample } from "@/lib/sample";
import { stepsFor } from "@/lib/step-defs";
import { verifySeal } from "@/lib/seal";
import { recordHarvest } from "@/lib/trace";
import { summariseLab } from "@/lib/verify";
import { CAPABILITIES } from "@/lib/auth/capabilities";

const lab = { uid: "u-lab", role: "LAB" as const, name: "Lab", orgId: "org-lab", exp: 9e9 };
const keeper = { uid: "u-ravi", role: "KEEPER" as const, name: "Ravi", orgId: "org-keeper", exp: 9e9 };
const alerts = (kind: string) => sample.alerts.filter((a) => a.kind === kind);

describe("lab results", () => {
  it("finalises the sample in-progress test and appends a chained event", async () => {
    const before = (await repo.getBatch("HC-2026-00124"))!;
    const t = await recordLabResult(repo, lab, { batchCode: "HC-2026-00124", labRef: "LAB-2026-441", status: "PASSED", certificateRef: "CERT-9001", results: { moisturePct: 17.2, hmfMgKg: 12 } });
    expect(t).toMatchObject({ status: "PASSED", certificateRef: "CERT-9001" });
    const after = (await repo.getBatch("HC-2026-00124"))!;
    expect(summariseLab(after.tests)).toBe("PASSED");
    expect(after.events.length).toBe(before.events.length + 1);
    expect(after.events.at(-1)?.type).toBe("QUALITY_TEST");
    expect(verifySeal(after.events, after.anchors).state).toBe("INTACT"); // new events extend, not break, the sealed chain
    expect(after.anchors.length).toBe(1);
  });

  it("rejects a final result: it cannot be changed", async () => {
    await expect(recordLabResult(repo, lab, { batchCode: "HC-2026-00124", labRef: "LAB-2026-441", status: "FAILED", certificateRef: "CERT-9002", results: { moisturePct: 30 } })).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a certificate issued for another batch and raises an alert", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "Mustard", kg: 5 });
    const before = alerts("CERTIFICATE_REUSE").length;
    await expect(recordLabResult(repo, lab, { batchCode: b.code, labRef: "LAB-NEW-1", status: "PASSED", certificateRef: "CERT-9001", results: { moisturePct: 17 } })).rejects.toMatchObject({ status: 409 });
    expect(alerts("CERTIFICATE_REUSE").length).toBe(before + 1);
    expect(await repo.findTestByLabRef("LAB-NEW-1")).toBeNull(); // nothing stored
  });

  it("rejects a lab reference that belongs to another batch and raises an alert", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "Mustard", kg: 5 });
    await expect(recordLabResult(repo, lab, { batchCode: b.code, labRef: "LAB-2026-377", status: "IN_PROGRESS" })).rejects.toMatchObject({ status: 409 });
    expect(alerts("LAB_REF_REUSE").length).toBeGreaterThan(0);
  });

  it("validates input", async () => {
    const ok = { batchCode: "HC-2026-00131", labRef: "LAB-V-1", status: "PASSED", certificateRef: "CERT-V1", results: { moisturePct: 17 } };
    await expect(recordLabResult(repo, lab, { ...ok, status: "GREAT" })).rejects.toMatchObject({ status: 400 });
    await expect(recordLabResult(repo, lab, { ...ok, certificateRef: "" })).rejects.toMatchObject({ status: 400 });
    await expect(recordLabResult(repo, lab, { ...ok, results: {} })).rejects.toMatchObject({ status: 400 });
    await expect(recordLabResult(repo, lab, { ...ok, results: { moisturePct: 400 } })).rejects.toMatchObject({ status: 400 });
    await expect(recordLabResult(repo, lab, { ...ok, batchCode: "HC-NOPE" })).rejects.toMatchObject({ status: 404 });
  });
});

describe("admin: create user", () => {
  const good = { name: "New Lab", email: "New.Lab@demo.nectara", password: "longenough", orgId: "org-lab", role: "LAB" };
  it("creates a user with a hashed password that can then sign in, and never returns the hash", async () => {
    const u = await createUser(repo, good);
    expect(u).toMatchObject({ email: "new.lab@demo.nectara", role: "LAB", orgId: "org-lab" });
    expect(JSON.stringify(u)).not.toMatch(/passwordHash|longenough/);
    const stored = (await repo.findUserByEmail("new.lab@demo.nectara"))!;
    const bcrypt = await import("bcryptjs");
    expect(await bcrypt.compare("longenough", stored.passwordHash)).toBe(true);
    expect(await bcrypt.compare("demo1234", stored.passwordHash)).toBe(false); // not the shared demo password
  });
  it("rejects duplicates, short passwords, bad roles, missing orgs and org/role mismatches", async () => {
    await expect(createUser(repo, good)).rejects.toMatchObject({ status: 409 });
    await expect(createUser(repo, { ...good, email: "a@b.co", password: "short" })).rejects.toMatchObject({ status: 400 });
    await expect(createUser(repo, { ...good, email: "a@b.co", role: "BOSS" })).rejects.toMatchObject({ status: 400 });
    await expect(createUser(repo, { ...good, email: "a@b.co", orgId: "nope" })).rejects.toMatchObject({ status: 404 });
    await expect(createUser(repo, { ...good, email: "a@b.co", role: "PROCESSOR" })).rejects.toMatchObject({ status: 422 });
    await expect(createUser(repo, { ...good, email: "not-an-email" })).rejects.toMatchObject({ status: 400 });
  });
  it("lists users including the new one", async () => {
    expect((await repo.listUsers()).some((u) => u.email === "new.lab@demo.nectara")).toBe(true);
  });
});

describe("role step forms", () => {
  const keys = (r: Role, holds: boolean) => stepsFor(r, holds).map((s) => s.key);
  it("shows each role only its own actions", () => {
    expect(keys("COLLECTOR", false)).toEqual(["collection"]);
    expect(keys("COLLECTOR", true)).toEqual([]);
    expect(keys("PROCESSOR", false)).toEqual(["custody"]);
    expect(keys("PROCESSOR", true)).toEqual(["processing", "packaging"]);
    expect(keys("DISTRIBUTOR", true)).toEqual(["shipment"]);
    for (const r of ["KEEPER", "LAB", "INVESTIGATOR", "ADMIN"] as Role[]) expect(keys(r, true)).toEqual([]);
  });
  it("never offers a step the role's capabilities forbid", () => {
    const need = { collection: "collection:record", custody: "custody:transfer", processing: "processing:record", packaging: "packaging:record", shipment: "shipment:record" } as const;
    for (const r of Object.keys(CAPABILITIES) as Role[]) for (const holds of [true, false]) for (const s of stepsFor(r, holds)) expect(CAPABILITIES[r]).toContain(need[s.key]);
  });
});

describe("certificate file fingerprints", () => {
  const sha = "a".repeat(64);
  it("stores only the fingerprint and refuses the same file on another batch", async () => {
    const one = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "Mustard", kg: 2 });
    const two = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "Mustard", kg: 2 });
    await recordLabResult(repo, lab, { batchCode: one.code, labRef: "LAB-F-1", status: "PASSED", certificateRef: "CERT-F-1", results: { moisturePct: 17 }, certificateFile: { filename: "cert.pdf", sha256: sha } });
    expect((await repo.findDocumentBySha(sha))?.kind).toBe("LAB_CERTIFICATE");
    const before = alerts("CERTIFICATE_REUSE").length;
    await expect(recordLabResult(repo, lab, { batchCode: two.code, labRef: "LAB-F-2", status: "PASSED", certificateRef: "CERT-F-2", results: { moisturePct: 17 }, certificateFile: { filename: "copy.pdf", sha256: sha } })).rejects.toMatchObject({ status: 409 });
    expect(alerts("CERTIFICATE_REUSE").length).toBe(before + 1);
  });
  it("rejects a malformed fingerprint", async () => {
    await expect(recordLabResult(repo, lab, { batchCode: "HC-2026-00131", labRef: "LAB-F-3", status: "IN_PROGRESS", certificateFile: { filename: "x.pdf", sha256: "nothex" } })).rejects.toMatchObject({ status: 400 });
  });
  it("tells the form which batch already holds a certificate", async () => {
    const { certificateInUse } = await import("@/lib/lab");
    expect(await certificateInUse(repo, "CERT-7702")).toBe("HC-2026-00118");
    expect(await certificateInUse(repo, "CERT-NOPE")).toBeNull();
  });
});
