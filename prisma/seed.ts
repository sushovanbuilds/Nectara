import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { demoQrFixtures } from "../lib/qr";
import { DEMO_PASSWORD, sample as s } from "../lib/sample";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  // Wipe in dependency order so the seed is repeatable.
  for (const m of ["qRScan", "qRToken", "alert", "investigationCase", "incident", "riskScore", "document", "qualityTest", "blockchainAnchor",
    "custodyTransfer", "batchLineage", "shipment", "batchEvent", "batch", "harvest", "inspection", "hiveReading", "hive", "farm",
    "notification", "user", "organisation", "auditLog", "aIAnalysis"] as const) {
    await (db[m] as unknown as { deleteMany(): Promise<unknown> }).deleteMany();
  }
  await db.organisation.createMany({ data: s.orgs });
  await db.user.createMany({ data: s.users.map((u) => ({ ...u, passwordHash })) });
  await db.farm.createMany({ data: s.farms });
  await db.hive.createMany({ data: s.hives });
  await db.hiveReading.createMany({ data: s.readings });
  await db.inspection.createMany({ data: s.inspections });
  await db.harvest.createMany({ data: s.harvests });
  await db.batch.createMany({ data: s.batches });
  await db.batchEvent.createMany({ data: s.events as Prisma.BatchEventCreateManyInput[] });
  await db.blockchainAnchor.createMany({ data: s.anchors });
  await db.qualityTest.createMany({ data: s.tests as Prisma.QualityTestCreateManyInput[] });
  await db.custodyTransfer.createMany({ data: s.custody });
  await db.shipment.createMany({ data: s.shipments });
  await db.batchLineage.createMany({ data: s.lineage });
  await db.incident.createMany({ data: s.incidents });
  await db.alert.createMany({ data: s.alerts });
  const qr = demoQrFixtures(s.batches);
  await db.qRToken.createMany({ data: qr.tokens });
  await db.qRScan.createMany({ data: qr.scans });
  console.log("Seeded sample data.");
}

main().finally(() => db.$disconnect());
