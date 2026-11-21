import type { Role } from "@prisma/client";

/**
 * The single reviewable access table. Every API route checks `can()` server-side;
 * hiding a button in the UI is never the control.
 */
export const ACTIONS = [
  "batch:read", "hiveos:view",
  "hive:manage", "inspection:log", "harvest:create", "batch:create",
  "collection:record", "custody:transfer",
  "lab:publish", // the only way purity evidence enters the system
  "processing:record", "blending:record", "packaging:record", "qr:issue",
  "shipment:record",
  "risk:read", "incident:review", "case:manage",
  "user:manage", "audit:read",
  "seal:anchor", "qr:revoke", "risk:run",
] as const;
export type Action = (typeof ACTIONS)[number];

export const CAPABILITIES: Record<Role, readonly Action[]> = {
  KEEPER: ["batch:read", "hiveos:view", "hive:manage", "inspection:log", "harvest:create", "batch:create", "seal:anchor"],
  COLLECTOR: ["batch:read", "collection:record", "custody:transfer"],
  LAB: ["batch:read", "lab:publish"],
  PROCESSOR: ["batch:read", "processing:record", "blending:record", "packaging:record", "qr:issue", "qr:revoke", "custody:transfer", "seal:anchor"],
  DISTRIBUTOR: ["batch:read", "shipment:record", "custody:transfer"],
  INVESTIGATOR: ["batch:read", "risk:read", "incident:review", "case:manage", "qr:revoke", "risk:run"],
  ADMIN: ["batch:read", "user:manage", "audit:read", "seal:anchor", "qr:revoke"],
};

export const can = (role: Role, action: Action): boolean => CAPABILITIES[role].includes(action);
