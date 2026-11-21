import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/capabilities";
import { formatCode, parseCode, qrSecret, signToken } from "@/lib/qr";
import { demoRepo as repo } from "@/lib/repo/demo";
import { sample } from "@/lib/sample";
import { recordHarvest, recordStep, TraceError } from "@/lib/trace";
import { issueQr, revokeQr, verifyCode } from "@/lib/verify";

const keeper = { uid: "u-ravi", role: "KEEPER" as const, name: "r", orgId: "org-keeper", exp: 9e9 };
const processor = { uid: "u-proc", role: "PROCESSOR" as const, name: "p", orgId: "org-proc", exp: 9e9 };
const alerts = (kind: string, batchId: string | null) => sample.alerts.filter((a) => a.kind === kind && a.batchId === batchId);

async function labelFor(kg: number) {
  const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "Mustard honey", floralSource: "Mustard", kg });
  await recordStep(repo, { ...processor, role: "PROCESSOR" }, b.code, "custody", {});
  const { code } = await issueQr(repo, processor, b.code);
  return { b, code };
}

describe("QR signing", () => {
  it("binds the signature to the token and the batch, and parses strictly", () => {
    const s = signToken("abcdefghijkl", "b1", "k");
    expect(s).toHaveLength(22);
    expect(signToken("abcdefghijkl", "b2", "k")).not.toBe(s);
    expect(signToken("abcdefghijkm", "b1", "k")).not.toBe(s);
    expect(signToken("abcdefghijkl", "b1", "other")).not.toBe(s);
    expect(parseCode(formatCode({ token: "abcdefghijkl", signature: s }))).toEqual({ token: "abcdefghijkl", signature: s });
    expect(parseCode("short.code")).toBeNull();
    expect(parseCode("")).toBeNull();
  });
  it("keeps QR_SECRET required in production and separate from AUTH_SECRET", () => {
    expect(() => qrSecret({ NODE_ENV: "production" })).toThrow();
    expect(() => qrSecret({ QR_SECRET: "x", AUTH_SECRET: "x" })).toThrow();
  });
  it("only processors can issue; processors, investigators and admins can revoke", () => {
    expect(can("PROCESSOR", "qr:issue")).toBe(true);
    expect(can("KEEPER", "qr:issue")).toBe(false);
    expect(can("LAB", "qr:revoke")).toBe(false);
    expect(can("INVESTIGATOR", "qr:revoke")).toBe(true);
  });
});

describe("verifyCode", () => {
  it("verifies a valid label with lab evidence and record seal as separate answers", async () => {
    const { b, code } = await labelFor(11);
    const r = await verifyCode(repo, code, { city: "Dehradun" });
    expect(r.status).toBe("VERIFIED");
    if (r.status !== "VERIFIED") return;
    expect(r.warning).toBeUndefined();
    expect(r.view).toMatchObject({ batchCode: b.code, hive: "A-105", lab: { status: "NONE" }, seal: { state: "UNSEALED" } });
    expect(JSON.stringify(r.view)).not.toMatch(/u-ravi|u-proc|actorId|orgId/); // nothing internal leaks to the public
  });

  it("rejects a forged signature, raises an alert for a real token, and shows no batch data", async () => {
    const { b, code } = await labelFor(12);
    const forged = code.slice(0, -1) + (code.endsWith("A") ? "B" : "A");
    expect(await verifyCode(repo, forged)).toEqual({ status: "INVALID" });
    expect(alerts("QR_INVALID_SIGNATURE", b.id)).toHaveLength(1);
    await verifyCode(repo, forged); // deduped within the hour
    expect(alerts("QR_INVALID_SIGNATURE", b.id)).toHaveLength(1);
  });

  it("treats junk and unknown tokens as invalid without raising alerts", async () => {
    const before = sample.alerts.length;
    expect(await verifyCode(repo, "not-a-code")).toEqual({ status: "INVALID" });
    expect(await verifyCode(repo, "AAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAA")).toEqual({ status: "INVALID" });
    expect(sample.alerts.length).toBe(before);
  });

  it("shows a revoked label as revoked and raises an alert", async () => {
    const { b, code } = await labelFor(13);
    await revokeQr(repo, code.split(".")[0]);
    const r = await verifyCode(repo, code);
    expect(r).toMatchObject({ status: "REVOKED", batchCode: b.code });
    expect(alerts("QR_REVOKED_SCAN", b.id)).toHaveLength(1);
    await expect(revokeQr(repo, code.split(".")[0])).rejects.toBeInstanceOf(TraceError);
  });

  it("flags a clone when the same label is scanned in different cities within the window", async () => {
    const { b, code } = await labelFor(14);
    const t0 = new Date("2026-09-01T10:00:00Z");
    expect((await verifyCode(repo, code, { city: "Mumbai", now: t0 })).status).toBe("VERIFIED");
    const same = await verifyCode(repo, code, { city: "Mumbai", now: new Date(+t0 + 60_000) });
    expect(same).toMatchObject({ status: "VERIFIED", warning: undefined });
    const clone = await verifyCode(repo, code, { city: "Delhi", now: new Date(+t0 + 20 * 60_000) });
    expect(clone).toMatchObject({ status: "VERIFIED", warning: "CLONE_PATTERN" });
    expect(alerts("QR_CLONE_PATTERN", b.id)).toHaveLength(1);
  });

  it("does not flag two cities that are far apart in time", async () => {
    const { code } = await labelFor(15);
    await verifyCode(repo, code, { city: "Mumbai", now: new Date("2026-09-01T00:00:00Z") });
    const r = await verifyCode(repo, code, { city: "Delhi", now: new Date("2026-09-03T00:00:00Z") });
    expect(r).toMatchObject({ status: "VERIFIED", warning: undefined });
  });

  it("refuses a second active label and refuses issuing outside custody", async () => {
    const { b } = await labelFor(16);
    await expect(issueQr(repo, processor, b.code)).rejects.toMatchObject({ status: 409 });
    await expect(issueQr(repo, { ...processor, orgId: "org-other" }, b.code)).rejects.toMatchObject({ status: 403 });
  });
});

describe("sample labels", () => {
  it("valid, revoked and clone demo codes each render their own state", async () => {
    const code = async (batch: string, token: string) => {
      const b = (await repo.getBatch(batch))!;
      return formatCode((await repo.listQrForBatch(b.id)).find((t) => t.token === token)!);
    };
    const valid = await verifyCode(repo, await code("HC-2026-00124", "demoValid001"));
    expect(valid).toMatchObject({ status: "VERIFIED", view: { lab: { status: "IN_PROGRESS" }, seal: { state: "INTACT" } } });
    expect(await verifyCode(repo, await code("HC-2026-00118", "demoRevoke01"))).toMatchObject({ status: "REVOKED" });
    expect(await verifyCode(repo, await code("HC-2026-00131", "demoClone001"))).toMatchObject({ status: "VERIFIED", warning: "CLONE_PATTERN", view: { lab: { status: "FAILED" } } });
  });
});
