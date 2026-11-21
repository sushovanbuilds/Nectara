import { describe, expect, it } from "vitest";
import type { BatchEvent, EventType } from "@prisma/client";
import { eventHash, GENESIS } from "@/lib/hash";
import { merkleRoot } from "@/lib/merkle";
import { demoRepo as repo } from "@/lib/repo/demo";
import { sample } from "@/lib/sample";
import { anchorBatch, verifySeal } from "@/lib/seal";
import { appendEvent, recordHarvest, TraceError } from "@/lib/trace";

const TYPES: EventType[] = ["HIVE", "HARVEST", "COLLECTION", "PROCESSING"];
function makeChain(): BatchEvent[] {
  let prev = GENESIS;
  return TYPES.map((type, i) => {
    const e = { batchId: "bx", type, payload: { n: i, nested: { a: 1 } }, actorId: "u1", createdAt: new Date(2026, 0, i + 1), prevHash: prev };
    const hash = eventHash(e);
    prev = hash;
    return { id: `ev${i}`, ...e, hash };
  });
}
const anchorOf = (evs: BatchEvent[]) => ({
  id: "an", batchId: "bx", merkleRoot: merkleRoot(evs.map((e) => e.hash)), eventIds: evs.map((e) => e.id),
  network: "SIMULATED" as const, txRef: null, anchoredAt: new Date(2026, 1, 1),
});

describe("merkleRoot", () => {
  it("is deterministic, order-sensitive, and handles odd counts", () => {
    expect(merkleRoot(["a", "b", "c"])).toBe(merkleRoot(["a", "b", "c"]));
    expect(merkleRoot(["a", "b", "c"])).not.toBe(merkleRoot(["c", "b", "a"]));
    expect(merkleRoot(["a"])).toBe("a");
    expect(() => merkleRoot([])).toThrow();
  });
});

describe("verifySeal tamper detection", () => {
  it("is intact for an untouched sealed chain", () => {
    const evs = makeChain();
    expect(verifySeal(evs, [anchorOf(evs)])).toMatchObject({ state: "INTACT", newSinceAnchor: 0 });
  });

  it("is unsealed (not broken) when there is no anchor", () => {
    expect(verifySeal(makeChain(), []).state).toBe("UNSEALED");
  });

  // Editing ANY field of ANY event must break the seal and name that event.
  const edits: Record<string, (e: BatchEvent) => BatchEvent> = {
    batchId: (e) => ({ ...e, batchId: "other" }),
    type: (e) => ({ ...e, type: e.type === "HIVE" ? "RETAIL" : "HIVE" }),
    payload: (e) => ({ ...e, payload: { n: 99, nested: { a: 1 } } }),
    "payload (nested)": (e) => ({ ...e, payload: { n: (e.payload as { n: number }).n, nested: { a: 2 } } }),
    actorId: (e) => ({ ...e, actorId: "mallory" }),
    createdAt: (e) => ({ ...e, createdAt: new Date(+e.createdAt + 1) }),
    prevHash: (e) => ({ ...e, prevHash: "f".repeat(64) }),
    hash: (e) => ({ ...e, hash: "f".repeat(64) }),
  };
  for (const [field, edit] of Object.entries(edits)) {
    for (let i = 0; i < TYPES.length; i++) {
      it(`breaks when ${field} of event ${i} is edited`, () => {
        const evs = makeChain();
        const anchor = anchorOf(evs);
        evs[i] = edit(evs[i]);
        const r = verifySeal(evs, [anchor]);
        expect(r.state).toBe("BROKEN");
        expect(r.firstMismatch?.eventId).toBe(`ev${i}`);
      });
    }
  }

  it("breaks when an event is removed, reordered, or the stored root is altered", () => {
    const evs = makeChain();
    const anchor = anchorOf(evs);
    expect(verifySeal(evs.slice(0, 3), [anchor]).state).toBe("BROKEN"); // last event removed
    expect(verifySeal([evs[0], evs[2], evs[3]], [anchor]).state).toBe("BROKEN"); // middle removed
    expect(verifySeal([evs[1], evs[0], evs[2], evs[3]], [anchor]).state).toBe("BROKEN"); // reordered
    expect(verifySeal(evs, [{ ...anchor, merkleRoot: "0".repeat(64) }]).state).toBe("BROKEN");
  });

  it("keeps a sealed chain intact when newer events are appended, and reports them", () => {
    const evs = makeChain();
    const anchor = anchorOf(evs);
    const e = { batchId: "bx", type: "SHIPMENT" as const, payload: {}, actorId: "u1", createdAt: new Date(2026, 2, 1), prevHash: evs[3].hash };
    expect(verifySeal([...evs, { id: "ev4", ...e, hash: eventHash(e) }], [anchor])).toMatchObject({ state: "INTACT", newSinceAnchor: 1 });
  });
});

describe("sample batches", () => {
  const seal = (id: string) => verifySeal(sample.events.filter((e) => e.batchId === id), sample.anchors.filter((a) => a.batchId === id));
  it("HC-2026-00124 is intact, HC-2026-00118 is broken at its edited event, HC-2026-00131 is unsealed", () => {
    expect(seal("b-124").state).toBe("INTACT");
    expect(seal("b-118")).toMatchObject({ state: "BROKEN", firstMismatch: { eventId: "b-118-e2" } });
    expect(seal("b-131").state).toBe("UNSEALED");
  });
});

describe("anchorBatch", () => {
  const keeper = { uid: "u-ravi", role: "KEEPER" as const, name: "r", orgId: "org-keeper", exp: 9e9 };
  it("seals a batch, stays intact as events are added, and refuses a broken record", async () => {
    const b = await recordHarvest(repo, keeper, { hiveCode: "A-105", honeyType: "x", floralSource: "x", kg: 5 });
    const a = await anchorBatch(repo, b.code);
    expect(a.network).toBe("SIMULATED");
    let d = (await repo.getBatch(b.code))!;
    expect(verifySeal(d.events, d.anchors).state).toBe("INTACT");
    await appendEvent(repo, b.id, "RETAIL", {}, "u-ravi");
    d = (await repo.getBatch(b.code))!;
    expect(verifySeal(d.events, d.anchors)).toMatchObject({ state: "INTACT", newSinceAnchor: 1 });

    const err = await anchorBatch(repo, "HC-2026-00118").catch((e) => e);
    expect(err).toBeInstanceOf(TraceError);
    expect(err.status).toBe(409);
  });
});
