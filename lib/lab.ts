import { randomUUID } from "node:crypto";
import type { LabStatus, QualityTest } from "@prisma/client";
import type { Session } from "./auth/session";
import type { Repository } from "./repo/types";
import { appendEvent, TraceError } from "./trace";

const STATUSES: LabStatus[] = ["IN_PROGRESS", "PASSED", "FAILED"];
const num = (v: unknown, name: string, lo: number, hi: number): number | undefined => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "number" || !Number.isFinite(v) || v < lo || v > hi) throw new TraceError(400, `${name} must be a number between ${lo} and ${hi}`);
  return v;
};

/**
 * Quality lab publishes a result for one batch. Only the LAB role reaches this (the route checks `lab:publish`).
 * A certificate or lab reference can belong to one batch only: reuse is rejected and raises an Alert.
 */
export async function recordLabResult(repo: Repository, s: Session, input: Record<string, unknown>): Promise<QualityTest> {
  const str = (v: unknown, n: string) => { if (typeof v !== "string" || !v.trim()) throw new TraceError(400, `${n} is required`); return v.trim(); };
  const code = str(input.batchCode, "batchCode");
  const labRef = str(input.labRef, "labRef");
  const status = input.status as LabStatus;
  if (!STATUSES.includes(status)) throw new TraceError(400, "status must be IN_PROGRESS, PASSED or FAILED");
  const final = status !== "IN_PROGRESS";
  const cert = typeof input.certificateRef === "string" && input.certificateRef.trim() ? input.certificateRef.trim() : null;
  if (final && !cert) throw new TraceError(400, "A final result needs a certificateRef");
  const r = (input.results ?? {}) as Record<string, unknown>;
  const results = { moisturePct: num(r.moisturePct, "moisturePct", 5, 40), hmfMgKg: num(r.hmfMgKg, "hmfMgKg", 0, 500) };
  if (final && results.moisturePct === undefined) throw new TraceError(400, "A final result needs moisturePct");

  const batch = await repo.getBatch(code);
  if (!batch) throw new TraceError(404, "Batch not found");

  const raise = async (kind: string, message: string) => {
    if (!(await repo.hasRecentAlert(kind, batch.id, new Date(Date.now() - 3_600_000)))) {
      await repo.insertAlert({ id: `al-${randomUUID().slice(0, 8)}`, kind, severity: "HIGH", message, batchId: batch.id, incidentId: null, createdAt: new Date() });
    }
  };

  const byRef = await repo.findTestByLabRef(labRef);
  if (byRef && byRef.batchId !== batch.id) {
    await raise("LAB_REF_REUSE", `Lab reference ${labRef} was submitted for ${code} but already belongs to another batch. Submission rejected.`);
    throw new TraceError(409, "That lab reference already belongs to another batch");
  }
  if (cert) {
    const byCert = await repo.findTestByCertificate(cert);
    if (byCert && byCert.id !== byRef?.id) {
      if (byCert.batchId !== batch.id) await raise("CERTIFICATE_REUSE", `Certificate ${cert} was submitted for ${code} but was already issued for another batch. Submission rejected.`);
      throw new TraceError(409, byCert.batchId !== batch.id ? "That certificate was issued for another batch" : "That certificate is already attached to another test on this batch");
    }
  }
  // Optional certificate file fingerprint, hashed in the browser. Only the hash is stored, never the file.
  const file = input.certificateFile as { filename?: unknown; sha256?: unknown } | undefined;
  let doc: { filename: string; sha256: string } | null = null;
  if (file) {
    if (typeof file.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(file.sha256)) throw new TraceError(400, "certificateFile.sha256 must be a SHA-256 hex digest");
    const filename = typeof file.filename === "string" ? file.filename.trim().slice(0, 200) : "";
    if (!filename) throw new TraceError(400, "certificateFile.filename is required");
    const same = await repo.findDocumentBySha(file.sha256);
    if (same && same.batchId !== batch.id) {
      await raise("CERTIFICATE_REUSE", `The same certificate file was submitted for ${code} after being attached to another batch. Submission rejected.`);
      throw new TraceError(409, "That certificate file is already attached to another batch");
    }
    doc = { filename, sha256: file.sha256 };
  }
  if (byRef && byRef.status !== "IN_PROGRESS") throw new TraceError(409, "This result is already final and cannot be changed");

  const testedAt = final ? new Date() : null;
  const stored = JSON.parse(JSON.stringify(results)) as QualityTest["results"]; // drops undefined
  let test: QualityTest;
  if (byRef) {
    await repo.updateTest(byRef.id, { status, certificateRef: cert, results: stored, testedAt });
    test = { ...byRef, status, certificateRef: cert, results: stored, testedAt };
  } else {
    test = { id: `t-${randomUUID().slice(0, 8)}`, batchId: batch.id, labRef, status, certificateRef: cert, results: stored, testedAt };
    await repo.insertTest(test);
  }
  if (doc) await repo.insertDocument({ id: `doc-${randomUUID().slice(0, 8)}`, batchId: batch.id, qualityTestId: test.id, kind: "LAB_CERTIFICATE", ...doc });
  await appendEvent(repo, batch.id, "QUALITY_TEST", { labRef, status, certificateRef: cert, certificateSha256: doc?.sha256 ?? null }, s.uid);
  return test;
}

/** Pre-check for the lab form: which batch, if any, already holds this certificate. The save is still refused server-side. */
export async function certificateInUse(repo: Repository, cert: string): Promise<string | null> {
  const t = await repo.findTestByCertificate(cert.trim());
  return t ? ((await repo.getBatchById(t.batchId))?.code ?? "another batch") : null;
}
