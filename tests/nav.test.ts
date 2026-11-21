import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { CAPABILITIES } from "@/lib/auth/capabilities";
import { breadcrumbs, navItems } from "@/lib/nav";

const labels = (r: Role) => navItems(r).map((i) => i.label);

describe("role-aware navigation", () => {
  it("shows each role only the workspaces it can use", () => {
    expect(labels("KEEPER")).toEqual(["Dashboard", "Hives", "Batches", "Shipments", "Verify a jar"]);
    expect(labels("LAB")).toEqual(["Dashboard", "Batches", "Lab", "Shipments", "Verify a jar"]);
    expect(labels("PROCESSOR")).toEqual(["Dashboard", "Batches", "Custody", "Shipments", "Verify a jar"]);
    expect(labels("INVESTIGATOR")).toEqual(["Dashboard", "Batches", "Shipments", "Risk", "Verify a jar"]);
    expect(labels("ADMIN")).toEqual(["Dashboard", "Batches", "Shipments", "Admin", "Verify a jar"]);
  });
  it("never offers Lab, Risk or Admin to a role without the capability", () => {
    for (const r of Object.keys(CAPABILITIES) as Role[]) {
      const l = labels(r);
      if (!CAPABILITIES[r].includes("lab:publish")) expect(l).not.toContain("Lab");
      if (!CAPABILITIES[r].includes("risk:read")) expect(l).not.toContain("Risk");
      if (!CAPABILITIES[r].includes("user:manage")) expect(l).not.toContain("Admin");
    }
  });
});

describe("breadcrumbs", () => {
  it("builds a trail from the path, with readable labels and real links", () => {
    expect(breadcrumbs("/batches/HC-2026-00124")).toEqual([{ label: "Batches", href: "/batches" }, { label: "HC-2026-00124", href: "/batches/HC-2026-00124" }]);
    expect(breadcrumbs("/incidents/inc-1")[0]).toEqual({ label: "Incidents", href: "/risk" });
    expect(breadcrumbs("/harvests/new").map((b) => b.label)).toEqual(["Harvests", "New"]);
    expect(breadcrumbs("/")).toEqual([]);
  });
});
