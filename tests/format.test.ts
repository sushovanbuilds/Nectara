import { describe, expect, it } from "vitest";
import { describePayload, EVENT_LABEL, fmtDate } from "@/lib/format";

describe("describePayload", () => {
  it("turns event payloads into one readable line", () => {
    expect(describePayload({ kg: 420, floralSource: "Mustard", harvestId: "hv-124" })).toBe("420 kg · Mustard");
    expect(describePayload({ labRef: "LAB-2026-441", status: "IN_PROGRESS", certificateRef: null })).toBe("LAB-2026-441 · in progress");
    expect(describePayload({ carrier: "BlueDart", origin: "Dehradun", destination: "Delhi" })).toBe("via BlueDart · from Dehradun · to Delhi");
    expect(describePayload({ custodyTransfer: true, fromOrgId: "org-a", toOrgId: "org-b", note: "" })).toBe("custody received");
  });
  it("never shows internal ids or unknown keys", () => {
    const line = describePayload({ hive: "A-105", actorId: "u-ravi", secretThing: "x", parents: [{}, {}] });
    expect(line).toBe("hive A-105 · blend of 2 batches");
    expect(describePayload(null)).toBe("");
  });
  it("formats dates in UTC and labels every event type", () => {
    expect(fmtDate(new Date("2026-08-21T23:30:00Z"))).toBe("21 Aug 2026");
    expect(Object.keys(EVENT_LABEL)).toHaveLength(9);
  });
});
