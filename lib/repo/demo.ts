import bcrypt from "bcryptjs";
import type { AuditLog, Batch, User } from "@prisma/client";
import { demoQrFixtures } from "@/lib/qr";
import { DEMO_PASSWORD, sample } from "@/lib/sample";
import type { BatchDetail, Repository } from "./types";

const byTime = <T extends { createdAt: Date }>(a: T, b: T) => +a.createdAt - +b.createdAt;

// Hash once, lazily, so every demo account verifies through the same bcrypt path as real ones.
let demoHash: string | undefined;
const g = globalThis as unknown as { __nectaraAudit?: AuditLog[]; __nectaraQr?: boolean };
const audit = (g.__nectaraAudit ??= []);

// QR fixtures are signed with QR_SECRET, so they are built on first use rather than at import time.
function ensureQr() {
  if (g.__nectaraQr) return;
  g.__nectaraQr = true;
  const f = demoQrFixtures(sample.batches);
  sample.qrTokens.push(...f.tokens);
  sample.qrScans.push(...f.scans);
}

function detail(batch: Batch | undefined): BatchDetail | null {
  if (!batch) return null;
  return {
    ...batch,
    farm: sample.farms.find((f) => f.id === batch.farmId)!,
    events: sample.events.filter((e) => e.batchId === batch.id).sort(byTime),
    tests: sample.tests.filter((t) => t.batchId === batch.id),
    anchors: sample.anchors.filter((a) => a.batchId === batch.id),
    custody: sample.custody.filter((c) => c.batchId === batch.id).sort((a, b) => +a.at - +b.at),
    shipments: sample.shipments.filter((s) => s.batchId === batch.id),
    parentLinks: sample.lineage.filter((l) => l.childId === batch.id),
    childLinks: sample.lineage.filter((l) => l.parentId === batch.id),
  };
}

export const demoRepo: Repository = {
  async listFarms() { return sample.farms; },
  async listHives() { return sample.hives; },
  async getHive(code) { return sample.hives.find((h) => h.code === code) ?? null; },
  async listBatches() { return sample.batches; },
  async getBatch(code) { return detail(sample.batches.find((b) => b.code === code)); },
  async getBatchById(id) { return detail(sample.batches.find((b) => b.id === id)); },
  async listIncidents() {
    return sample.incidents.map((i) => ({ ...i, alerts: sample.alerts.filter((a) => a.incidentId === i.id) }));
  },
  async findUserByEmail(email) {
    const u = sample.users.find((x) => x.email === email.toLowerCase());
    if (!u) return null;
    demoHash ??= bcrypt.hashSync(DEMO_PASSWORD, 4);
    return { ...u, passwordHash: u.passwordHash ?? demoHash } satisfies User;
  },
  async writeAudit(e) {
    audit.push({ id: `audit-${audit.length + 1}`, ...e, createdAt: new Date() });
  },
  async listAudit() { return [...audit].reverse(); },

  async lastEvent(batchId) {
    const evs = sample.events.filter((e) => e.batchId === batchId).sort(byTime);
    return evs[evs.length - 1] ?? null;
  },
  async insertEvent(e) {
    if (sample.events.some((x) => x.batchId === e.batchId && x.prevHash === e.prevHash)) throw new Error("CHAIN_CONFLICT");
    sample.events.push(e);
  },
  async insertHarvest(h) { sample.harvests.push(h); },
  async insertBatch(b) { sample.batches.push(b); },
  async insertCustody(c) { sample.custody.push(c); },
  async insertShipment(s) { sample.shipments.push(s); },
  async insertLineage(l) { sample.lineage.push(l); },
  async insertAnchor(a) { sample.anchors.push(a); },

  async findQr(token) { ensureQr(); return sample.qrTokens.find((t) => t.token === token) ?? null; },
  async listQrForBatch(batchId) { ensureQr(); return sample.qrTokens.filter((t) => t.batchId === batchId); },
  async insertQr(t) { sample.qrTokens.push(t); },
  async revokeQr(id, at) { const t = sample.qrTokens.find((x) => x.id === id); if (t) t.revokedAt = at; },
  async insertScan(s) { sample.qrScans.push(s); },
  async recentScans(tokenId, since) { return sample.qrScans.filter((s) => s.tokenId === tokenId && s.scannedAt >= since); },
  async insertAlert(a) { sample.alerts.push(a); },
  async hasRecentAlert(kind, batchId, since) { return sample.alerts.some((a) => a.kind === kind && a.batchId === batchId && a.createdAt >= since); },

  async listAlerts() { return sample.alerts; },
  async listRiskScores() { return [...sample.risks].sort(byTime).reverse(); },
  async insertRiskScore(r) { sample.risks.push(r); },
  async insertIncident(i) { sample.incidents.push(i); },
  async getIncident(id) {
    const i = sample.incidents.find((x) => x.id === id);
    return i ? { ...i, alerts: sample.alerts.filter((a) => a.incidentId === id) } : null;
  },
  async assignAlerts(ids, incidentId) { for (const a of sample.alerts) if (ids.includes(a.id)) a.incidentId = incidentId; },
  async updateIncidentBand(id, band) { const i = sample.incidents.find((x) => x.id === id); if (i) i.band = band; },
  async findUserById(id) {
    const u = sample.users.find((x) => x.id === id);
    return u ? { ...u, passwordHash: "" } : null;
  },
  async listCases(incidentId) { return sample.cases.filter((c) => c.incidentId === incidentId); },
  async getCase(id) { return sample.cases.find((c) => c.id === id) ?? null; },
  async insertCase(c) { sample.cases.push(c); },
  async updateCase(id, patch) { const c = sample.cases.find((x) => x.id === id); if (c) Object.assign(c, patch); },

  async listReadings(hiveId) { return sample.readings.filter((r) => r.hiveId === hiveId).sort((a, b) => +a.at - +b.at); },
  async listInspections(hiveId) { return sample.inspections.filter((i) => i.hiveId === hiveId).sort((a, b) => +a.at - +b.at); },
  async listHarvests() { return sample.harvests; },
  async insertReading(r) { sample.readings.push(r); },
  async insertInspection(i) { sample.inspections.push(i); },
  async updateHiveHealth(id, h) { const x = sample.hives.find((v) => v.id === id); if (x) Object.assign(x, h); },

  async findTestByLabRef(labRef) { return sample.tests.find((t) => t.labRef === labRef) ?? null; },
  async findTestByCertificate(ref) { return sample.tests.find((t) => t.certificateRef === ref) ?? null; },
  async insertTest(t) { sample.tests.push(t); },
  async updateTest(id, patch) { const t = sample.tests.find((x) => x.id === id); if (t) Object.assign(t, patch); },
  async insertDocument(doc) { sample.documents.push(doc); },
  async findDocumentBySha(sha) { return sample.documents.find((x) => x.sha256 === sha) ?? null; },
  async listShipments() { return sample.shipments; },
  async listOrgs() { return sample.orgs; },
  async listUsers() {
    demoHash ??= bcrypt.hashSync(DEMO_PASSWORD, 4);
    return sample.users.map((u) => ({ ...u, passwordHash: u.passwordHash ?? demoHash! }));
  },
  async insertUser(u) { sample.users.push(u); },
};
