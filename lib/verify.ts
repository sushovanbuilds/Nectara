import { randomUUID } from "node:crypto";
import type { LabStatus, QRToken, RiskBand } from "@prisma/client";
import type { Session } from "./auth/session";
import { formatCode, newToken, parseCode, sigEqual, signToken } from "./qr";
import type { Repository } from "./repo/types";
import { type SealResult, verifySeal } from "./seal";
import { holderOrgId, TraceError } from "./trace";

export type LabSummary = "PASSED" | "FAILED" | "IN_PROGRESS" | "NONE";

/** What a stranger with a jar may see: no actor ids, no payload internals, no organisation names. */
export interface PublicView {
  batchCode: string;
  honeyType: string;
  origin: string;
  harvestDate: Date | null;
  hive: string | null;
  lab: { status: LabSummary; refs: string[]; tests: { labRef: string; certificateRef: string | null; status: LabStatus; testedAt: Date | null }[] }; // answers "is the honey genuine?"
  seal: SealResult; // answers "has the record been rewritten?" Never merged with lab.
  journey: { type: string; at: Date }[];
}

export type VerifyResult =
  | { status: "INVALID" }
  | { status: "REVOKED"; batchCode: string; revokedAt: Date }
  | { status: "VERIFIED"; warning?: "CLONE_PATTERN"; view: PublicView };

/** Worst result wins: any failed test fails the batch; otherwise any unfinished test keeps it in progress. */
export const summariseLab = (tests: { status: LabStatus }[]): LabSummary =>
  !tests.length ? "NONE" : tests.some((t) => t.status === "FAILED") ? "FAILED" : tests.some((t) => t.status === "IN_PROGRESS") ? "IN_PROGRESS" : "PASSED";

/** The keeper-entered harvest date when present, otherwise when the harvest was recorded. */
export const harvestedOn = (e: { payload: unknown; createdAt: Date } | undefined): Date | null => {
  if (!e) return null;
  const d = (e.payload as { harvestedOn?: string } | null)?.harvestedOn;
  return d ? new Date(`${d}T00:00:00Z`) : e.createdAt;
};

export async function issueQr(repo: Repository, s: Session, code: string): Promise<{ token: QRToken; code: string }> {
  const b = await repo.getBatch(code);
  if (!b) throw new TraceError(404, "Batch not found");
  if (holderOrgId(b) !== s.orgId) throw new TraceError(403, "This batch is not in your organisation's custody");
  if ((await repo.listQrForBatch(b.id)).some((t) => !t.revokedAt)) throw new TraceError(409, "An active QR label already exists; revoke it first");
  const token = newToken();
  const row: QRToken = { id: `qr-${token}`, batchId: b.id, token, signature: signToken(token, b.id), issuedAt: new Date(), revokedAt: null };
  await repo.insertQr(row);
  return { token: row, code: formatCode(row) };
}

export async function revokeQr(repo: Repository, token: string): Promise<QRToken> {
  const t = await repo.findQr(token);
  if (!t) throw new TraceError(404, "QR label not found");
  if (t.revokedAt) throw new TraceError(409, "Already revoked");
  await repo.revokeQr(t.id, new Date());
  return { ...t, revokedAt: new Date() };
}

const CLONE_WINDOW_MS = 6 * 60 * 60_000;
const ALERT_DEDUPE_MS = 60 * 60_000;

async function raise(repo: Repository, kind: string, severity: RiskBand, message: string, batchId: string | null, now: Date) {
  if (await repo.hasRecentAlert(kind, batchId, new Date(+now - ALERT_DEDUPE_MS))) return;
  await repo.insertAlert({ id: `al-${randomUUID().slice(0, 8)}`, kind, severity, message, batchId, incidentId: null, createdAt: now });
}

/**
 * Public check of a scanned code. Invalid signatures raise an Alert only when the token really exists
 * (someone tampering with a real label); random junk would only create noise.
 */
export async function verifyCode(repo: Repository, code: string, ctx: { city?: string | null; now?: Date } = {}): Promise<VerifyResult> {
  const now = ctx.now ?? new Date();
  const parsed = parseCode(code);
  if (!parsed) return { status: "INVALID" };
  const rec = await repo.findQr(parsed.token);
  if (!rec) return { status: "INVALID" };

  const expected = signToken(rec.token, rec.batchId);
  if (!sigEqual(parsed.signature, expected) || !sigEqual(rec.signature, expected)) {
    await raise(repo, "QR_INVALID_SIGNATURE", "HIGH", "A QR label was presented with a signature that does not match.", rec.batchId, now);
    return { status: "INVALID" };
  }

  const batch = await repo.getBatchById(rec.batchId);
  if (!batch) return { status: "INVALID" };
  await repo.insertScan({ id: `sc-${randomUUID().slice(0, 8)}`, tokenId: rec.id, city: ctx.city?.trim() || null, scannedAt: now });

  if (rec.revokedAt) {
    await raise(repo, "QR_REVOKED_SCAN", "MEDIUM", `A revoked QR label for ${batch.code} was scanned.`, batch.id, now);
    return { status: "REVOKED", batchCode: batch.code, revokedAt: rec.revokedAt };
  }

  // shortcut: "far apart" is approximated as two different city names inside the window; add distances if false alarms appear.
  const cities = new Set((await repo.recentScans(rec.id, new Date(+now - CLONE_WINDOW_MS))).map((x) => x.city?.toLowerCase()).filter(Boolean));
  const clone = cities.size >= 2;
  if (clone) await raise(repo, "QR_CLONE_PATTERN", "HIGH", `The QR label for ${batch.code} was scanned in different cities within a short time.`, batch.id, now);

  const tests = batch.tests;
  const lab = summariseLab(tests);
  const harvest = batch.events.find((e) => e.type === "HARVEST");
  const hive = batch.events.find((e) => e.type === "HIVE")?.payload as { hive?: string } | undefined;
  return {
    status: "VERIFIED",
    warning: clone ? "CLONE_PATTERN" : undefined,
    view: {
      batchCode: batch.code, honeyType: batch.honeyType, origin: `${batch.farm.region}, ${batch.farm.state}`,
      harvestDate: harvestedOn(harvest), hive: hive?.hive ?? null,
      lab: { status: lab, refs: tests.map((t) => t.labRef), tests: tests.map(({ labRef, certificateRef, status, testedAt }) => ({ labRef, certificateRef, status, testedAt })) },
      seal: verifySeal(batch.events, batch.anchors),
      journey: batch.events.map((e) => ({ type: e.type, at: e.createdAt })),
    },
  };
}
