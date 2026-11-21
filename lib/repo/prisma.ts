import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Repository } from "./types";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export const prismaRepo: Repository = {
  listFarms: () => db.farm.findMany({ orderBy: { name: "asc" } }),
  listHives: () => db.hive.findMany({ orderBy: { code: "asc" } }),
  getHive: (code) => db.hive.findUnique({ where: { code } }),
  listBatches: () => db.batch.findMany({ orderBy: { code: "asc" } }),
  async getBatch(code) {
    const b = await db.batch.findUnique({
      where: { code },
      include: {
        farm: true, events: { orderBy: { createdAt: "asc" } }, tests: true, anchors: true, custody: { orderBy: { at: "asc" } },
        shipments: true, asChild: true, asParent: true,
      },
    });
    if (!b) return null;
    const { asChild, asParent, ...rest } = b;
    return { ...rest, parentLinks: asChild, childLinks: asParent };
  },
  listIncidents: () => db.incident.findMany({ include: { alerts: true }, orderBy: { openedAt: "desc" } }),
  findUserByEmail: (email) => db.user.findUnique({ where: { email: email.toLowerCase() } }),
  async writeAudit(e) { await db.auditLog.create({ data: e }); },
  listAudit: () => db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),

  lastEvent: (batchId) => db.batchEvent.findFirst({ where: { batchId }, orderBy: { createdAt: "desc" } }),
  async insertEvent(e) {
    try {
      await db.batchEvent.create({ data: e as Prisma.BatchEventUncheckedCreateInput });
    } catch (err) {
      // Unique (batchId, prevHash): a concurrent writer already extended this chain tip.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new Error("CHAIN_CONFLICT");
      throw err;
    }
  },
  async insertHarvest(h) { await db.harvest.create({ data: h }); },
  async insertBatch(b) { await db.batch.create({ data: b }); },
  async insertCustody(c) { await db.custodyTransfer.create({ data: c }); },
  async insertShipment(s) { await db.shipment.create({ data: s }); },
  async insertLineage(l) { await db.batchLineage.create({ data: l }); },
  async insertAnchor(a) { await db.blockchainAnchor.create({ data: a }); },

  async getBatchById(id) {
    const b = await db.batch.findUnique({ where: { id }, select: { code: true } });
    return b ? prismaRepo.getBatch(b.code) : null;
  },
  findQr: (token) => db.qRToken.findUnique({ where: { token } }),
  listQrForBatch: (batchId) => db.qRToken.findMany({ where: { batchId }, orderBy: { issuedAt: "asc" } }),
  async insertQr(t) { await db.qRToken.create({ data: t }); },
  async revokeQr(id, at) { await db.qRToken.update({ where: { id }, data: { revokedAt: at } }); },
  async insertScan(s) { await db.qRScan.create({ data: s }); },
  recentScans: (tokenId, since) => db.qRScan.findMany({ where: { tokenId, scannedAt: { gte: since } } }),
  async insertAlert(a) { await db.alert.create({ data: a }); },
  async hasRecentAlert(kind, batchId, since) {
    return (await db.alert.count({ where: { kind, batchId, createdAt: { gte: since } } })) > 0;
  },

  listAlerts: () => db.alert.findMany({ orderBy: { createdAt: "asc" } }),
  listRiskScores: () => db.riskScore.findMany({ orderBy: { createdAt: "desc" } }),
  async insertRiskScore(r) { await db.riskScore.create({ data: r as Prisma.RiskScoreUncheckedCreateInput }); },
  async insertIncident(i) { await db.incident.create({ data: i }); },
  getIncident: (id) => db.incident.findUnique({ where: { id }, include: { alerts: true } }),
  async assignAlerts(ids, incidentId) { await db.alert.updateMany({ where: { id: { in: ids } }, data: { incidentId } }); },
  async updateIncidentBand(id, band) { await db.incident.update({ where: { id }, data: { band } }); },
  findUserById: (id) => db.user.findUnique({ where: { id } }),
  listCases: (incidentId) => db.investigationCase.findMany({ where: { incidentId } }),
  getCase: (id) => db.investigationCase.findUnique({ where: { id } }),
  async insertCase(c) { await db.investigationCase.create({ data: c }); },
  async updateCase(id, patch) { await db.investigationCase.update({ where: { id }, data: patch }); },

  listReadings: (hiveId) => db.hiveReading.findMany({ where: { hiveId }, orderBy: { at: "asc" } }),
  listInspections: (hiveId) => db.inspection.findMany({ where: { hiveId }, orderBy: { at: "asc" } }),
  listHarvests: () => db.harvest.findMany({ orderBy: { harvestedAt: "asc" } }),
  async insertReading(r) { await db.hiveReading.create({ data: r }); },
  async insertInspection(i) { await db.inspection.create({ data: i }); },
  async updateHiveHealth(id, h) { await db.hive.update({ where: { id }, data: h }); },

  findTestByLabRef: (labRef) => db.qualityTest.findUnique({ where: { labRef } }),
  findTestByCertificate: (ref) => db.qualityTest.findUnique({ where: { certificateRef: ref } }),
  async insertTest(t) { await db.qualityTest.create({ data: t as Prisma.QualityTestUncheckedCreateInput }); },
  async updateTest(id, patch) { await db.qualityTest.update({ where: { id }, data: patch as Prisma.QualityTestUncheckedUpdateInput }); },
  async insertDocument(doc) { await db.document.create({ data: doc }); },
  findDocumentBySha: (sha256) => db.document.findFirst({ where: { sha256 } }),
  listShipments: () => db.shipment.findMany({ orderBy: { shippedAt: "desc" } }),
  listOrgs: () => db.organisation.findMany({ orderBy: { name: "asc" } }),
  listUsers: () => db.user.findMany({ orderBy: { name: "asc" } }),
  async insertUser(u) { await db.user.create({ data: u }); },
};
