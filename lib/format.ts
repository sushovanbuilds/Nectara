import type { EventType } from "@prisma/client";

export const EVENT_LABEL: Record<EventType, string> = {
  HIVE: "Hive registered", HARVEST: "Harvested", COLLECTION: "Collected", QUALITY_TEST: "Lab test", PROCESSING: "Processing",
  BLENDING: "Blended", PACKAGING: "Packed", SHIPMENT: "Shipped", RETAIL: "On shelf",
};

/** "21 Aug 2026", always in UTC so server and client agree. */
export const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fmtDateTime = (d: Date) => `${fmtDate(d)}, ${d.toISOString().slice(11, 16)} UTC`;

const KEY_LABEL: Record<string, string> = {
  kg: "kg", floralSource: "", hive: "hive", labRef: "", status: "", certificateRef: "cert", process: "", units: "jars", unitSizeG: "g each",
  carrier: "via", origin: "from", destination: "to", collector: "", harvestedOn: "harvested", storageTempC: "°C storage", note: "",
};

/** One readable line for an event payload, without internal ids. */
export function describePayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const o = payload as Record<string, unknown>;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined || v === "" || typeof v === "object" || /Id$/.test(k) || k === "custodyTransfer") continue;
    const label = KEY_LABEL[k];
    if (label === undefined) continue;
    const val = k === "status" ? String(v).replace("_", " ").toLowerCase() : String(v);
    parts.push(label === "" ? val : ["kg", "jars", "g each", "°C storage"].includes(label) ? `${val} ${label}` : `${label} ${val}`);
  }
  if (o.custodyTransfer) parts.unshift("custody received");
  if (Array.isArray(o.parents)) parts.push(`blend of ${o.parents.length} batches`);
  return parts.join(" · ");
}
