// Sample data. Every row here is fictional and is labelled "Sample data" in the UI.
// Typed against the Prisma models so demo mode and database mode cannot drift apart.
import type {
  Alert, Batch, BatchEvent, BatchLineage, BlockchainAnchor, CustodyTransfer, Document, Farm, Harvest, Hive, HiveReading,
  Incident, Inspection, InvestigationCase, Organisation, QualityTest, QRScan, QRToken, RiskScore, Role, Shipment, User,
} from "@prisma/client";
import { eventHash, GENESIS } from "./hash";
import { merkleRoot } from "./merkle";

export const DEMO_PASSWORD = "demo1234"; // demo mode and local seed only

const d = (s: string) => new Date(s);

const orgs: Organisation[] = (
  [
    ["org-keeper", "Kumar Apiaries", "KEEPER"], ["org-collector", "Doab Honey Collection", "COLLECTOR"],
    ["org-lab", "Himalayan Honey Lab", "LAB"], ["org-proc", "Doon Honey Processors", "PROCESSOR"],
    ["org-dist", "Gangetic Distribution", "DISTRIBUTOR"], ["org-invest", "Nectara Integrity Desk", "INVESTIGATOR"],
    ["org-admin", "Nectara Admin", "ADMIN"],
  ] as [string, string, Role][]
).map(([id, name, kind]) => ({ id, name, kind, createdAt: d("2026-01-01") }));

// passwordHash is only set for users created at runtime; the seeded ones share the demo password.
const users: (Omit<User, "passwordHash"> & { passwordHash?: string })[] = (
  [
    ["u-ravi", "ravi@demo.nectara", "Ravi Kumar", "KEEPER", "org-keeper"],
    ["u-collector", "collector@demo.nectara", "Meera Singh", "COLLECTOR", "org-collector"],
    ["u-lab", "lab@demo.nectara", "Dr. Anil Rawat", "LAB", "org-lab"],
    ["u-proc", "processor@demo.nectara", "Sunita Joshi", "PROCESSOR", "org-proc"],
    ["u-dist", "distributor@demo.nectara", "Karan Malhotra", "DISTRIBUTOR", "org-dist"],
    ["u-invest", "investigator@demo.nectara", "Farah Khan", "INVESTIGATOR", "org-invest"],
    ["u-admin", "admin@demo.nectara", "Admin", "ADMIN", "org-admin"],
  ] as [string, string, string, Role, string][]
).map(([id, email, name, role, orgId]) => ({ id, email, name, role, orgId, createdAt: d("2026-01-01") }));

const farms: Farm[] = [
  { id: "farm-sah", name: "Saharanpur Apiary", region: "Saharanpur", state: "Uttar Pradesh", orgId: "org-keeper" },
  { id: "farm-kas", name: "Kashmir Valley Apiary", region: "Srinagar", state: "Jammu and Kashmir", orgId: "org-keeper" },
  { id: "farm-sun", name: "Sundarbans Apiary", region: "South 24 Parganas", state: "West Bengal", orgId: "org-keeper" },
];

// Snapshot columns; the HIVEOS engine recomputes them whenever a reading or inspection is recorded.
const hives: Hive[] = [
  { id: "hive-a014", code: "HIVE-A014", farmId: "farm-sah", healthState: "STABLE", healthScore: 96, trustLevel: 3 },
  { id: "hive-a105", code: "A-105", farmId: "farm-sah", healthState: "STABLE", healthScore: 100, trustLevel: 4 },
  { id: "hive-a106", code: "A-106", farmId: "farm-sah", healthState: "WATCH", healthScore: 78, trustLevel: 2 },
  { id: "hive-k201", code: "K-201", farmId: "farm-kas", healthState: "STABLE", healthScore: 95, trustLevel: 2 },
  { id: "hive-s301", code: "S-301", farmId: "farm-sun", healthState: "STRESSED", healthScore: 45, trustLevel: 2 },
];

type Ch = number | null;
const reading = (id: string, hiveId: string, at: string, tempC: Ch, humidity: Ch, weightKg: Ch, activity: Ch, soundDb: Ch): HiveReading =>
  ({ id, hiveId, at: d(at), tempC, humidity, weightKg, activity, soundDb });
// A-106 reports only temperature and humidity; HIVE-A014 and K-201 report fewer channels too, so trust levels differ.
const readings: HiveReading[] = [
  reading("r1", "hive-a105", "2026-08-20T06:00:00Z", 34.8, 58, 41.2, 0.82, 44),
  reading("r2", "hive-a105", "2026-08-21T06:00:00Z", 35.0, 57, 41.9, 0.85, 43),
  reading("r3", "hive-a106", "2026-08-20T06:00:00Z", 36.9, 66, null, null, null),
  reading("r4", "hive-a106", "2026-08-21T06:00:00Z", 37.2, 68, null, null, null),
  reading("r5", "hive-a014", "2026-08-20T06:00:00Z", 34.9, 59, 38.0, null, null),
  reading("r6", "hive-a014", "2026-08-21T06:00:00Z", 35.1, 58, 38.6, null, null),
  reading("r7", "hive-k201", "2026-08-21T06:00:00Z", 35.2, 60, null, null, null),
  reading("r8", "hive-s301", "2026-08-21T06:00:00Z", 38.4, 75, null, null, null),
];
const inspections: Inspection[] = [
  { id: "i1", hiveId: "hive-a105", at: d("2026-08-18"), queenSeen: true, broodPattern: "solid", notes: "Strong colony, ample stores." },
  { id: "i2", hiveId: "hive-a106", at: d("2026-08-18"), queenSeen: false, broodPattern: "patchy", notes: "Queen not sighted; monitor brood." },
  { id: "i3", hiveId: "hive-k201", at: d("2026-07-30"), queenSeen: true, broodPattern: "solid", notes: "Healthy at harvest." },
  { id: "i4", hiveId: "hive-s301", at: d("2026-08-10"), queenSeen: false, broodPattern: "spotty", notes: "Weak colony after storm." },
];

const harvests: Harvest[] = [
  { id: "hv-124", hiveId: "hive-a014", farmId: "farm-sah", harvestedAt: d("2026-08-21"), kg: 420, floralSource: "Mustard" },
  { id: "hv-131", hiveId: "hive-s301", farmId: "farm-sun", harvestedAt: d("2026-08-14"), kg: 300, floralSource: "Khalsi mangrove" },
  { id: "hv-118", hiveId: "hive-k201", farmId: "farm-kas", harvestedAt: d("2026-07-30"), kg: 260, floralSource: "Acacia" },
];

const batches: Batch[] = [
  { id: "b-124", code: "HC-2026-00124", honeyType: "Mustard honey", kg: 420, farmId: "farm-sah", harvestId: "hv-124", createdAt: d("2026-08-21T12:00:00Z") },
  { id: "b-131", code: "HC-2026-00131", honeyType: "Khalsi honey", kg: 300, farmId: "farm-sun", harvestId: "hv-131", createdAt: d("2026-08-14T12:00:00Z") },
  { id: "b-118", code: "HC-2026-00118", honeyType: "Acacia honey", kg: 260, farmId: "farm-kas", harvestId: "hv-118", createdAt: d("2026-07-30T12:00:00Z") },
];

// Build a hash chain per batch, the same way Phase 4 will for real writes.
function chain(batchId: string, rows: [BatchEvent["type"], object, string, string][]): BatchEvent[] {
  let prev = GENESIS;
  return rows.map(([type, payload, actorId, at], i) => {
    const e = { batchId, type, payload, actorId, createdAt: d(at), prevHash: prev };
    const hash = eventHash(e);
    prev = hash;
    return { id: `${batchId}-e${i + 1}`, ...e, hash };
  });
}

const events: BatchEvent[] = [
  ...chain("b-124", [
    ["HIVE", { hive: "HIVE-A014", note: "Hive registered to batch" }, "u-ravi", "2026-08-21T08:00:00Z"],
    ["HARVEST", { kg: 420, floralSource: "Mustard" }, "u-ravi", "2026-08-21T10:00:00Z"],
    ["COLLECTION", { collector: "Doab Honey Collection", kg: 420 }, "u-collector", "2026-08-22T09:00:00Z"],
  ]),
  ...chain("b-131", [
    ["HIVE", { hive: "S-301" }, "u-ravi", "2026-08-14T08:00:00Z"],
    ["HARVEST", { kg: 300, floralSource: "Khalsi mangrove" }, "u-ravi", "2026-08-14T10:00:00Z"],
    ["QUALITY_TEST", { labRef: "LAB-2026-377", status: "FAILED", reason: "Moisture above limit" }, "u-lab", "2026-08-18T11:00:00Z"],
  ]),
  ...chain("b-118", [
    ["HIVE", { hive: "K-201" }, "u-ravi", "2026-07-30T08:00:00Z"],
    ["HARVEST", { kg: 260, floralSource: "Acacia" }, "u-ravi", "2026-07-30T10:00:00Z"],
    ["QUALITY_TEST", { labRef: "LAB-2026-312", status: "PASSED" }, "u-lab", "2026-08-03T11:00:00Z"],
  ]),
];

const anchorFor = (batchId: string, id: string): BlockchainAnchor => {
  const evs = events.filter((e) => e.batchId === batchId);
  return { id, batchId, merkleRoot: merkleRoot(evs.map((e) => e.hash)), eventIds: evs.map((e) => e.id), network: "SIMULATED", txRef: null, anchoredAt: d("2026-08-25T00:00:00Z") };
};
const anchors: BlockchainAnchor[] = [anchorFor("b-124", "an-124"), anchorFor("b-118", "an-118")];

// Deliberate demo of a broken seal: a harvest quantity edited after sealing, hash left unchanged.
events.find((e) => e.id === "b-118-e2")!.payload = { kg: 360, floralSource: "Acacia" };

const tests: QualityTest[] = [
  { id: "t-124", batchId: "b-124", labRef: "LAB-2026-441", status: "IN_PROGRESS", certificateRef: null, results: {}, testedAt: null },
  { id: "t-131", batchId: "b-131", labRef: "LAB-2026-377", status: "FAILED", certificateRef: "CERT-7781", results: { moisturePct: 22.4 }, testedAt: d("2026-08-18") },
  { id: "t-118", batchId: "b-118", labRef: "LAB-2026-312", status: "PASSED", certificateRef: "CERT-7702", results: { moisturePct: 17.8, hmfMgKg: 14 }, testedAt: d("2026-08-03") },
];

const custody: CustodyTransfer[] = [
  { id: "c-124", batchId: "b-124", fromOrgId: "org-keeper", toOrgId: "org-collector", at: d("2026-08-22T09:00:00Z"), note: "Collected at apiary gate" },
];
const shipments: Shipment[] = [];
const qrTokens: QRToken[] = []; // filled lazily: tokens are signed with QR_SECRET
const qrScans: QRScan[] = [];
const documents: Document[] = []; // certificate fingerprints added by the lab at runtime
const lineage: BatchLineage[] = []; // no blends in the sample story yet

const incidents: Incident[] = [
  { id: "inc-1", title: "Certificate reuse and timeline gap around Himalayan Honey Lab", band: "HIGH", status: "OPEN", openedAt: d("2026-08-25T09:00:00Z") },
];
const alerts: Alert[] = [
  { id: "al-1", kind: "CERTIFICATE_REUSE", severity: "HIGH", message: "CERT-7702 was submitted for HC-2026-00131 after being issued for HC-2026-00118. Submission rejected.", batchId: "b-131", incidentId: "inc-1", createdAt: d("2026-08-24T10:00:00Z") },
  { id: "al-2", kind: "RECORD_SEAL_BROKEN", severity: "HIGH", message: "HC-2026-00118 record changed after sealing.", batchId: "b-118", incidentId: "inc-1", createdAt: d("2026-08-25T08:00:00Z") },
];
const risks: RiskScore[] = []; // scores are computed by the risk engine, never hand-written
const cases: InvestigationCase[] = [];

const built = { orgs, users, farms, hives, readings, inspections, harvests, batches, events, anchors, tests, custody, shipments, qrTokens, qrScans, documents, lineage, incidents, alerts, risks, cases };

// Routes and pages are bundled separately in production; a global keeps demo-mode writes visible to both.
const g = globalThis as unknown as { __nectaraSample?: typeof built };
export const sample = (g.__nectaraSample ??= built);
