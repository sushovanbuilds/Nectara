import { createHash } from "node:crypto";

/** Deterministic JSON: object keys sorted recursively. */
export function canonicalJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const GENESIS = "0".repeat(64);

export interface EventHashInput {
  batchId: string;
  type: string;
  payload: unknown;
  actorId: string;
  createdAt: Date;
  prevHash: string;
}

export const eventHash = (e: EventHashInput) =>
  sha256(canonicalJson({ batchId: e.batchId, type: e.type, payload: e.payload, actorId: e.actorId, createdAt: e.createdAt, prevHash: e.prevHash }));
