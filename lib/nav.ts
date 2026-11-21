import type { Role } from "@prisma/client";
import type { IconName } from "@/components/ui/icons";
import { can } from "./auth/capabilities";

export interface NavItem { href: string; label: string; icon: IconName }

/** Only the pages a role can actually use. Pages and APIs still enforce access themselves. */
export function navItems(role: Role): NavItem[] {
  const out: NavItem[] = [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }];
  if (can(role, "hiveos:view")) out.push({ href: "/hives", label: "Hives", icon: "hive" });
  out.push({ href: "/batches", label: "Batches", icon: "batch" });
  if (can(role, "lab:publish")) out.push({ href: "/lab", label: "Lab", icon: "lab" });
  if (can(role, "custody:transfer") || can(role, "collection:record")) out.push({ href: "/custody", label: "Custody", icon: "custody" });
  out.push({ href: "/shipments", label: "Shipments", icon: "shipments" });
  if (can(role, "risk:read")) out.push({ href: "/risk", label: "Risk", icon: "risk" });
  if (can(role, "user:manage")) out.push({ href: "/admin", label: "Admin", icon: "admin" });
  out.push({ href: "/verify", label: "Verify a jar", icon: "verify" });
  return out;
}

const SEGMENT: Record<string, string> = {
  dashboard: "Dashboard", hives: "Hives", batches: "Batches", harvests: "Harvests", new: "New", lab: "Lab",
  custody: "Custody", shipments: "Shipments", risk: "Risk and incidents", incidents: "Incidents", admin: "Admin",
};
// Segments without their own page link to the closest one that exists.
const PARENT: Record<string, string> = { "/incidents": "/risk", "/harvests": "/batches" };

/** Breadcrumb trail for an app path, e.g. /batches/HC-2026-00124 → Batches › HC-2026-00124. */
export function breadcrumbs(path: string): { label: string; href: string }[] {
  const parts = path.split("/").filter(Boolean);
  return parts.map((p, i) => {
    const href = "/" + parts.slice(0, i + 1).join("/");
    return { label: SEGMENT[p] ?? decodeURIComponent(p), href: PARENT[href] ?? href };
  });
}
