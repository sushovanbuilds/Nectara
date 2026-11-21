import type { Role } from "@prisma/client";

export interface Field { name: string; label: string; type: "text" | "number"; required?: boolean; defaultValue?: string | number }
export interface StepDef { key: "collection" | "custody" | "processing" | "packaging" | "shipment"; label: string; fields: Field[] }

const DEFS: Record<StepDef["key"], StepDef> = {
  collection: { key: "collection", label: "Record collection", fields: [{ name: "kg", label: "Quantity collected (kg)", type: "number", required: true }, { name: "note", label: "Note", type: "text" }] },
  custody: { key: "custody", label: "Take custody", fields: [{ name: "note", label: "Note", type: "text" }] },
  processing: { key: "processing", label: "Record processing", fields: [{ name: "process", label: "Process (e.g. filtering)", type: "text", required: true }, { name: "storageTempC", label: "Storage temperature (°C)", type: "number" }, { name: "note", label: "Note", type: "text" }] },
  packaging: { key: "packaging", label: "Record packaging", fields: [{ name: "units", label: "Jars", type: "number", required: true }, { name: "unitSizeG", label: "Jar size (g)", type: "number", required: true, defaultValue: 500 }] },
  shipment: { key: "shipment", label: "Record shipment", fields: [{ name: "carrier", label: "Carrier", type: "text", required: true }, { name: "origin", label: "From", type: "text", required: true }, { name: "destination", label: "To", type: "text", required: true }] },
};

/** Which step forms a role sees on a batch: taking custody when it does not hold the batch, working on it when it does. */
export function stepsFor(role: Role, holdsBatch: boolean): StepDef[] {
  switch (role) {
    case "COLLECTOR": return holdsBatch ? [] : [DEFS.collection];
    case "PROCESSOR": return holdsBatch ? [DEFS.processing, DEFS.packaging] : [DEFS.custody];
    case "DISTRIBUTOR": return holdsBatch ? [DEFS.shipment] : [DEFS.custody];
    default: return [];
  }
}
