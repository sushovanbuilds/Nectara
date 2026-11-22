import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sample } from "@/lib/sample";
import { ROLE_EMAIL, stopAt, TOUR } from "@/lib/tour";

// Maps a tour path to the page file that serves it, so a renamed route breaks this test, not the jury's tour.
const PAGE: Record<string, string> = {
  "/": "app/page.tsx", "/dashboard": "app/(app)/dashboard/page.tsx", "/hives/S-301": "app/(app)/hives/[code]/page.tsx",
  "/harvests/new": "app/(app)/harvests/new/page.tsx", "/batches/HC-2026-00124": "app/(app)/batches/[code]/page.tsx",
  "/lab": "app/(app)/lab/page.tsx", "/verify": "app/(public)/verify/page.tsx", "/risk": "app/(app)/risk/page.tsx", "/admin": "app/(app)/admin/page.tsx",
};

describe("guided tour", () => {
  it("signs in only as demo accounts that exist", () => {
    for (const s of TOUR) if (s.role) expect(sample.users.some((u) => u.email === ROLE_EMAIL[s.role!] && u.role === s.role), s.title).toBe(true);
  });

  it("opens only pages that exist, and records the sample data it names", () => {
    for (const s of TOUR) expect(existsSync(PAGE[s.path] ?? "missing"), `${s.title}: ${s.path}`).toBe(true);
    const codes = new Set(sample.batches.map((b) => b.code));
    for (const s of TOUR) for (const code of `${s.path} ${s.doThis.join(" ")}`.match(/HC-\d{4}-\d{5}/g) ?? []) expect(codes.has(code), code).toBe(true);
    expect(sample.hives.some((h) => h.code === "S-301")).toBe(true);
  });

  it("names a certificate that really belongs to another batch for the reuse demo", () => {
    expect(sample.tests.find((t) => t.certificateRef === "CERT-7702")?.batchId).not.toBe(sample.batches.find((b) => b.code === "HC-2026-00124")!.id);
  });

  it("finds stops by number and rejects anything else", () => {
    expect(stopAt(1)?.path).toBe("/");
    expect(stopAt(0)).toBeNull();
    expect(stopAt(TOUR.length + 1)).toBeNull();
    expect(stopAt(1.5)).toBeNull();
  });
});
