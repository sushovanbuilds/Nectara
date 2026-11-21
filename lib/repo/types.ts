import type {
  Alert, AuditLog, Batch, BatchEvent, BatchLineage, BlockchainAnchor, CustodyTransfer, Document, Farm, Harvest, Hive, HiveReading, Incident, Inspection,
  InvestigationCase, Organisation, QualityTest, QRScan, QRToken, RiskBand, RiskScore, Shipment, User,
} from "@prisma/client";

// Both repositories return exactly these shapes (types come from the Prisma schema).
export type BatchDetail = Batch & {
  farm: Farm;
  events: BatchEvent[];
  tests: QualityTest[];
  anchors: BlockchainAnchor[];
  custody: CustodyTransfer[];
  shipments: Shipment[];
  parentLinks: BatchLineage[];
  childLinks: BatchLineage[];
};
export type IncidentWithAlerts = Incident & { alerts: Alert[] };

/**
 * Deliberately has no update or delete for events: BatchEvent is append-only.
 * `insertEvent` throws Error("CHAIN_CONFLICT") if another event already follows the same prevHash.
 */
export interface Repository {
  listFarms(): Promise<Farm[]>;
  listHives(): Promise<Hive[]>;
  getHive(code: string): Promise<Hive | null>;
  listBatches(): Promise<Batch[]>;
  getBatch(code: string): Promise<BatchDetail | null>;
  listIncidents(): Promise<IncidentWithAlerts[]>;
  findUserByEmail(email: string): Promise<User | null>;
  writeAudit(e: { actorId: string; action: string; target: string }): Promise<void>;
  listAudit(): Promise<AuditLog[]>;

  lastEvent(batchId: string): Promise<BatchEvent | null>;
  insertEvent(e: BatchEvent): Promise<void>;
  insertHarvest(h: Harvest): Promise<void>;
  insertBatch(b: Batch): Promise<void>;
  insertCustody(c: CustodyTransfer): Promise<void>;
  insertShipment(s: Shipment): Promise<void>;
  insertLineage(l: BatchLineage): Promise<void>;
  insertAnchor(a: BlockchainAnchor): Promise<void>;

  getBatchById(id: string): Promise<BatchDetail | null>;
  findQr(token: string): Promise<QRToken | null>;
  listQrForBatch(batchId: string): Promise<QRToken[]>;
  insertQr(t: QRToken): Promise<void>;
  revokeQr(id: string, at: Date): Promise<void>;
  insertScan(s: QRScan): Promise<void>;
  recentScans(tokenId: string, since: Date): Promise<QRScan[]>;
  insertAlert(a: Alert): Promise<void>;
  hasRecentAlert(kind: string, batchId: string | null, since: Date): Promise<boolean>;

  listAlerts(): Promise<Alert[]>;
  listRiskScores(): Promise<RiskScore[]>; // newest first
  insertRiskScore(r: RiskScore): Promise<void>;
  insertIncident(i: Incident): Promise<void>;
  getIncident(id: string): Promise<IncidentWithAlerts | null>;
  assignAlerts(ids: string[], incidentId: string): Promise<void>;
  updateIncidentBand(id: string, band: RiskBand): Promise<void>;
  findUserById(id: string): Promise<User | null>;
  listCases(incidentId: string): Promise<InvestigationCase[]>;
  getCase(id: string): Promise<InvestigationCase | null>;
  insertCase(c: InvestigationCase): Promise<void>;
  updateCase(id: string, patch: { status?: string; notes?: string }): Promise<void>;

  listReadings(hiveId: string): Promise<HiveReading[]>; // oldest first
  listInspections(hiveId: string): Promise<Inspection[]>; // oldest first
  listHarvests(): Promise<Harvest[]>;
  insertReading(r: HiveReading): Promise<void>;
  insertInspection(i: Inspection): Promise<void>;
  findTestByLabRef(labRef: string): Promise<QualityTest | null>;
  findTestByCertificate(ref: string): Promise<QualityTest | null>;
  insertTest(t: QualityTest): Promise<void>;
  updateTest(id: string, patch: Pick<QualityTest, "status" | "certificateRef" | "results" | "testedAt">): Promise<void>;
  insertDocument(d: Document): Promise<void>;
  findDocumentBySha(sha256: string): Promise<Document | null>;
  listShipments(): Promise<Shipment[]>;
  listOrgs(): Promise<Organisation[]>;
  listUsers(): Promise<User[]>; // includes passwordHash: never send these rows to a client
  insertUser(u: User): Promise<void>;
  updateHiveHealth(id: string, h: { healthState: Hive["healthState"]; healthScore: number; trustLevel: number }): Promise<void>;
}
