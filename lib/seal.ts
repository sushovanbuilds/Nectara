import { randomUUID } from "node:crypto";
import type { BatchEvent, BlockchainAnchor } from "@prisma/client";
import { eventHash, GENESIS } from "./hash";
import { merkleRoot } from "./merkle";
import type { Repository } from "./repo/types";
import { TraceError } from "./trace";

export type SealState = "INTACT" | "BROKEN" | "UNSEALED";
export interface SealResult {
  state: SealState;
  /** First event that no longer matches, and why. Set only when BROKEN. */
  firstMismatch?: { eventId: string; reason: string };
  /** Events appended after the latest anchor (they are chained but not yet sealed). */
  newSinceAnchor: number;
  anchor?: BlockchainAnchor;
}

const broken = (eventId: string, reason: string, anchor?: BlockchainAnchor): SealResult => ({ state: "BROKEN", firstMismatch: { eventId, reason }, newSinceAnchor: 0, anchor });

/**
 * Answers one question only: has this record been rewritten since it was sealed?
 * It says nothing about whether the honey is genuine; that is lab evidence.
 */
export function verifySeal(events: BatchEvent[], anchors: BlockchainAnchor[]): SealResult {
  const anchor = [...anchors].sort((a, b) => +b.anchoredAt - +a.anchoredAt)[0];

  let prev = GENESIS;
  for (const e of events) {
    if (e.prevHash !== prev) return broken(e.id, "Chain link broken: this event does not follow the one before it", anchor);
    if (eventHash(e) !== e.hash) return broken(e.id, "Record changed after sealing: contents no longer match the stored hash", anchor);
    prev = e.hash;
  }
  if (!anchor) return { state: "UNSEALED", newSinceAnchor: 0 };

  const byId = new Map(events.map((e) => [e.id, e]));
  const sealed: BatchEvent[] = [];
  for (const id of anchor.eventIds) {
    const e = byId.get(id);
    if (!e) return broken(id, "Event removed after sealing", anchor);
    sealed.push(e);
  }
  if (merkleRoot(sealed.map((e) => e.hash)) !== anchor.merkleRoot) return broken(anchor.eventIds[0], "Merkle root does not match the sealed events", anchor);
  return { state: "INTACT", newSinceAnchor: events.length - sealed.length, anchor };
}

/** Seal a batch's current events into a Merkle root. SIMULATED network: nothing is written to a public chain. */
export async function anchorBatch(repo: Repository, code: string): Promise<BlockchainAnchor> {
  const b = await repo.getBatch(code);
  if (!b) throw new TraceError(404, "Batch not found");
  if (b.events.length === 0) throw new TraceError(422, "Nothing to seal yet");
  const current = verifySeal(b.events, b.anchors);
  if (current.state === "BROKEN") throw new TraceError(409, "Record is already broken; it cannot be sealed again");
  const anchor: BlockchainAnchor = {
    id: `an-${randomUUID().slice(0, 8)}`, batchId: b.id, merkleRoot: merkleRoot(b.events.map((e) => e.hash)),
    eventIds: b.events.map((e) => e.id), network: "SIMULATED", txRef: null, anchoredAt: new Date(),
  };
  await repo.insertAnchor(anchor);
  return anchor;
}
