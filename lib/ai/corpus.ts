import type { Role } from "@prisma/client";
import { CAPABILITIES, can } from "@/lib/auth/capabilities";
import { EVENT_LABEL, describePayload, fmtDate } from "@/lib/format";
import { type HiveView, viewAll } from "@/lib/hives";
import type { IncidentWithAlerts, Repository } from "@/lib/repo";
import { GROUP_LABEL, WEIGHTS, type RiskGroup } from "@/lib/risk";
import { verifySeal } from "@/lib/seal";
import { summariseLab } from "@/lib/verify";

/** One retrievable record. `href` is the page a person opens to check the answer. */
export interface Doc { id: string; kind: "batch" | "hive" | "incident" | "guide"; title: string; href?: string; text: string }

const ROLE_NAME: Record<Role, string> = { KEEPER: "Honey keeper", COLLECTOR: "Collector", LAB: "Quality lab", PROCESSOR: "Processor", DISTRIBUTOR: "Distributor", INVESTIGATOR: "Investigator", ADMIN: "Admin" };
const LAB_WORD ={ PASSED: "passed", FAILED: "failed", IN_PROGRESS: "in progress", NONE: "no lab test recorded" } as const;
const SEAL_WORD = { INTACT: "intact: the record has not been rewritten since it was sealed", BROKEN: "broken: the record changed after it was sealed", UNSEALED: "not sealed yet" } as const;

/** How the product works, written from the same constants the engines use, so the assistant cannot drift from the code. */
function guides(): Doc[] {
  const weights = (Object.keys(WEIGHTS) as RiskGroup[]).map((g) => `${GROUP_LABEL[g]} ${WEIGHTS[g]}%`).join(", ");
  return [
    { id: "guide-integrity", kind: "guide", title: "Integrity principle", href: "/#integrity", text: "Two questions, two kinds of proof, never mixed. Is the honey genuine? Only laboratory evidence answers this: a certificate bound to the one batch it tested; reusing it on another batch is refused and flagged. Only the lab role can publish lab results. Has the record been rewritten? The cryptographic seal answers this: every event is written once and hash-chained with SHA-256, and the hashes roll into a Merkle root. A seal never proves purity. The ledger is simulated: roots are stored in the database, nothing is written to a public blockchain." },
    { id: "guide-risk", kind: "guide", title: "How a batch risk score works", href: "/risk", text: `A batch risk score is a weighted sum of named rules, each with a reason. Weights: ${weights}. Bands: low below 30, medium 30 to 59, high 60 and above. Related alerts that share a farm, organisation, lab or batch lineage within 72 hours are grouped into one incident. A score orders the investigation queue; it is not a verdict of fraud, and a person reviews every case.` },
    { id: "guide-hiveos", kind: "guide", title: "HIVEOS hive health and trust ladder", href: "/hives", text: "Each hive gets a health score from 0 to 100 and a state: Stable 85 and above, Watch 65 to 84, Stressed 40 to 64, Critical below 40. Every state lists the factors behind it (brood temperature, humidity, weight change, foraging activity, colony sound, queen seen, brood pattern, inspection age) and the next actions. The trust ladder shows how much evidence stands behind the state: 1 manual observation, 2 basic sensor, 3 multiple sensors, 4 sensors plus an inspection within 21 days. Trust level 4 is Nectara's own definition of verified evidence, not an external certification." },
    { id: "guide-qr", kind: "guide", title: "QR labels and the verify page", href: "/verify", text: "Each jar carries an HMAC-signed QR code. Anyone can scan it at /verify without an account and see origin, journey, lab status and seal state. A label can be revoked by a processor, investigator or admin; scans afterwards show it as revoked. A label scanned in two distant cities in a short time is flagged as possibly copied. A code with a wrong signature shows Not verified and reveals nothing about the batch." },
    { id: "guide-roles", kind: "guide", title: "What each role can do", href: "/dashboard", text: `Roles and their permissions in Nectara: ${(Object.keys(CAPABILITIES) as Role[]).map((r) => `${ROLE_NAME[r]}: ${CAPABILITIES[r].join(", ")}`).join(". ")}. Every API route checks these permissions on the server.` },
    { id: "guide-steps", kind: "guide", title: "Batch journey and who records each step", href: "/batches", text: "A batch moves through seven steps, each recorded once by one role: Hive and Harvest by the honey keeper, Collection by the collector, Lab test by the quality lab, Processing and Packaging by the processor, Shipment by the distributor. Custody passes between organisations at each hand-off. The app has no way to edit or delete an event." },
  ];
}

async function batchDocs(repo: Repository, role: Role): Promise<Doc[]> {
  const orgs = new Map((await repo.listOrgs()).map((o) => [o.id, o.name]));
  const scores = can(role, "risk:read") ? await repo.listRiskScores() : [];
  const docs: Doc[] = [];
  for (const b of await repo.listBatches()) {
    const d = await repo.getBatch(b.code);
    if (!d) continue;
    const lab = summariseLab(d.tests);
    const seal = verifySeal(d.events, d.anchors);
    const lines = [
      `Batch ${d.code}: ${d.honeyType}, ${d.kg} kg, from ${d.farm.name}, ${d.farm.region}, ${d.farm.state}. Created ${fmtDate(d.createdAt)}.`,
      `Lab evidence: ${LAB_WORD[lab]}.${d.tests.map((t) => ` Test ${t.labRef} is ${t.status.toLowerCase().replace("_", " ")}${t.certificateRef ? `, certificate ${t.certificateRef}` : ""}${t.testedAt ? `, tested ${fmtDate(t.testedAt)}` : ""}.`).join("")}`,
      `Record seal: ${SEAL_WORD[seal.state]}.`,
      `Events: ${d.events.map((e) => `${EVENT_LABEL[e.type]} on ${fmtDate(e.createdAt)} (${describePayload(e.payload)})`).join("; ") || "none"}.`,
    ];
    if (d.custody.length) lines.push(`Custody: ${d.custody.map((c) => `${orgs.get(c.fromOrgId) ?? "unknown"} to ${orgs.get(c.toOrgId) ?? "unknown"} on ${fmtDate(c.at)}${c.note ? ` (${c.note})` : ""}`).join("; ")}.`);
    if (d.shipments.length) lines.push(`Shipments: ${d.shipments.map((s) => `${s.origin} to ${s.destination} by ${s.carrier}, ${s.status.toLowerCase()}, ${fmtDate(s.shippedAt)}`).join("; ")}.`);
    const score = scores.find((s) => s.batchId === d.id);
    if (score) {
      const reasons = (score.reasons as { reason?: string; points?: number }[]).map((r) => `${r.reason} (${r.points} points)`).join("; ");
      lines.push(`Risk score ${score.score}, ${score.band.toLowerCase()} band. Reasons: ${reasons || "none"}.`);
    }
    docs.push({ id: `batch-${d.code}`, kind: "batch", title: `Batch ${d.code}`, href: `/batches/${d.code}`, text: lines.join("\n") });
  }
  return docs;
}

export function hiveDoc(v: HiveView): Doc {
  const { hive, farm, health, obs } = v;
  const concerning = health.factors.filter((f) => f.effect === "concerning");
  const reassuring = health.factors.filter((f) => f.effect === "reassuring");
  const readings = [obs.tempC != null && `brood temperature ${obs.tempC}°C`, obs.humidity != null && `humidity ${obs.humidity}%`, obs.activity != null && `activity index ${obs.activity}`, obs.soundDb != null && `sound ${obs.soundDb} dB`].filter(Boolean).join(", ");
  return {
    id: `hive-${hive.code}`, kind: "hive", title: `Hive ${hive.code}`, href: `/hives/${hive.code}`,
    text: [
      `Hive ${hive.code} at ${farm.name}, ${farm.region}, ${farm.state}. State ${health.state.toLowerCase()}, health ${health.score}/100, trust level ${health.trustLevel}, data confidence ${health.confidence}. Data as of ${fmtDate(v.asOf)}.`,
      // Plain words people ask with ("needs attention", "worst", "urgent") so keyword search finds the right hives.
      health.state === "STABLE" ? "This hive is fine for now; only routine checks are due."
        : health.state === "WATCH" ? "This hive needs attention soon: it is on watch."
        : `This hive needs attention first: it is ${health.state.toLowerCase()}, among the most urgent hives.`,
      readings && `Latest readings: ${readings}.`,
      concerning.length ? `Concerning: ${concerning.map((f) => `${f.label}: ${f.detail}`).join(" ")}` : "No concerning factors.",
      reassuring.length && `Reassuring: ${reassuring.map((f) => `${f.label}: ${f.detail}`).join(" ")}`,
      health.actions.length && `Next actions: ${health.actions.map((a) => `(${a.priority}) ${a.text}`).join(" ")}`,
    ].filter(Boolean).join("\n"),
  };
}

export async function incidentDoc(repo: Repository, i: IncidentWithAlerts): Promise<Doc> {
  const codes = new Map((await repo.listBatches()).map((b) => [b.id, b.code]));
  const batches = [...new Set(i.alerts.map((a) => a.batchId && codes.get(a.batchId)).filter(Boolean))];
  return {
    id: `incident-${i.id}`, kind: "incident", title: `Incident: ${i.title}`, href: `/incidents/${i.id}`,
    text: [
      `Incident "${i.title}", ${i.band.toLowerCase()} severity, ${i.status}, opened ${fmtDate(i.openedAt)}. Batches: ${batches.join(", ") || "none"}.`,
      `Alerts: ${i.alerts.map((a) => `${a.kind} (${a.severity.toLowerCase()}, ${fmtDate(a.createdAt)}): ${a.message}`).join("; ")}.`,
    ].join("\n"),
  };
}

/** Everything the role may read, and nothing else. Mirrors the access table in lib/auth/capabilities. */
export async function buildCorpus(repo: Repository, role: Role): Promise<Doc[]> {
  const docs = [...guides(), ...(await batchDocs(repo, role))];
  if (can(role, "hiveos:view")) {
    const { views, anomalies } = await viewAll(repo);
    docs.push(...views.map(hiveDoc));
    for (const a of anomalies) docs.push({ id: `apiary-${a.farmId}`, kind: "hive", title: `Apiary pattern at ${a.farmName}`, href: "/hives", text: a.message });
  }
  if (can(role, "risk:read")) for (const i of await repo.listIncidents()) docs.push(await incidentDoc(repo, i));
  return docs;
}
