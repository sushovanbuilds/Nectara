import type { Role } from "@prisma/client";

/**
 * The guided demo tour: ten stops, about eight minutes. Each stop names the demo role it signs in as,
 * the page it opens, what to do there and what to notice. Every instruction matches a real control on that page.
 */
export interface TourStop {
  title: string;
  /** Demo role to sign in as; null keeps the current session (public pages). */
  role: Role | null;
  path: string;
  minutes: number;
  summary: string;
  doThis: string[];
  notice: string[];
}

export const TOUR_COOKIE = "nectara_tour";
/** Set on a visitor's first landing visit (or first use of the tour), so the tour starts on its own only once. */
export const SEEN_COOKIE = "nectara_seen";
export const SEEN_MAX_AGE = 365 * 24 * 60 * 60;
export const TOUR_MAX_AGE = 2 * 60 * 60;

export const ROLE_EMAIL: Record<Role, string> = {
  KEEPER: "ravi@demo.nectara", COLLECTOR: "collector@demo.nectara", LAB: "lab@demo.nectara", PROCESSOR: "processor@demo.nectara",
  DISTRIBUTOR: "distributor@demo.nectara", INVESTIGATOR: "investigator@demo.nectara", ADMIN: "admin@demo.nectara",
};
export const ROLE_LABEL: Record<Role, string> = {
  KEEPER: "Honey keeper", COLLECTOR: "Collector", LAB: "Quality lab", PROCESSOR: "Processor",
  DISTRIBUTOR: "Distributor", INVESTIGATOR: "Investigator", ADMIN: "Admin",
};

export const TOUR: TourStop[] = [
  {
    title: "The idea in one screen", role: null, path: "/", minutes: 0.5,
    summary: "Two questions, two kinds of proof, never mixed.",
    doThis: ["Scroll down to the dark section: \"Is the honey genuine?\" and \"Has the record been rewritten?\"", "Flip the \"Tamper with this record\" switch under the seal card."],
    notice: ["Only a lab certificate answers purity. The cryptographic seal only shows whether the record changed.", "Nectara never claims a blockchain proves purity."],
  },
  {
    title: "A beekeeper's morning", role: "KEEPER", path: "/dashboard", minutes: 0.5,
    summary: "Signed in as Ravi, a honey keeper with 5 hives in 3 apiaries.",
    doThis: ["Look at Hive health and Needs attention.", "Open hive S-301 from Needs attention."],
    notice: ["States come from rules, not guesses: Stable, Watch, Stressed, Critical.", "Every number on this screen is sample data, labelled as such."],
  },
  {
    title: "Why a hive is stressed", role: "KEEPER", path: "/hives/S-301", minutes: 1,
    summary: "HIVEOS explains each state and says what to do next.",
    doThis: ["Read \"Why stressed\": each factor shows its reading and the points it cost.", "In \"What if…\", move Temperature change and watch the projected state.", "In \"In plain words\", pick বাংলা or हिन्दी and press Write summary (needs an AI key on the server)."],
    notice: ["The trust ladder shows how much evidence stands behind the state, from manual observation to sensors plus an inspection.", "The AI summary only rewords the rule results shown on this page."],
  },
  {
    title: "Log a harvest", role: "KEEPER", path: "/harvests/new", minutes: 1,
    summary: "Four short steps turn a harvest into a sealed batch.",
    doThis: ["Pick a hive, enter a quantity and date, then a floral source and honey type.", "On Review, press Log harvest."],
    notice: ["You land on a new batch whose first two events are already hash-chained.", "Nothing can be edited or deleted afterwards; the record only grows."],
  },
  {
    title: "One batch, hive to shelf", role: "KEEPER", path: "/batches/HC-2026-00124", minutes: 1,
    summary: "Batch HC-2026-00124: seven steps, lab evidence and the record seal side by side.",
    doThis: ["Read the seven-step journey at the top: step 4, Lab test, is in progress.", "Scroll to the Event log: each event shows the start of its hash.", "Then open batch HC-2026-00118 from Batches to see a broken seal."],
    notice: ["\"Lab evidence\" and \"Record seal\" are separate cards on purpose.", "On HC-2026-00118 the seal reads Broken and names the first event that changed after sealing."],
  },
  {
    title: "Only the lab proves purity", role: "LAB", path: "/lab", minutes: 1,
    summary: "Signed in as the quality lab, the only role that can publish purity evidence.",
    doThis: ["Choose batch HC-2026-00124 (LAB-2026-441 in progress).", "Enter certificate reference CERT-7702, set Result to Passed and press Publish result.", "Then try a new reference such as CERT-9001 and publish again."],
    notice: ["CERT-7702 is refused: it already belongs to batch HC-2026-00118, and the attempt raises an alert for investigators.", "A certificate binds to one batch only."],
  },
  {
    title: "The label on the jar", role: "PROCESSOR", path: "/batches/HC-2026-00124", minutes: 0.5,
    summary: "Signed in as the processor, who issues and revokes signed QR labels.",
    doThis: ["Scroll to QR label: the code is HMAC-signed for this batch.", "Press Revoke label, read the warning, then press Keep label."],
    notice: ["Revoking asks for confirmation, because every later scan will show the label as revoked."],
  },
  {
    title: "What a buyer sees", role: null, path: "/verify", minutes: 1,
    summary: "No account needed. This is the page a QR code opens on a phone.",
    doThis: ["Open each sample: Valid, Revoked, Copied (scanned in two cities) and Tampered signature."],
    notice: ["A valid label shows origin, journey, lab status and seal as separate answers.", "A tampered code reveals nothing about the batch."],
  },
  {
    title: "Fraud surfaces as clusters", role: "INVESTIGATOR", path: "/risk", minutes: 1,
    summary: "Signed in as an investigator. Scores order the queue; people decide.",
    doThis: ["Press Run risk engine.", "Expand \"Why this score\" on a batch, then open the incident around Himalayan Honey Lab.", "On the incident, press Write summary under Case brief, or press Ask in the top bar and ask \"Why is batch HC-2026-00131 risky?\""],
    notice: ["Every point traces to a named rule with a reason. A high score is never a verdict of fraud.", "Ask Nectara answers only from records this role can open and cites each one."],
  },
  {
    title: "Everything is on the record", role: "ADMIN", path: "/admin", minutes: 0.5,
    summary: "Signed in as admin: who can do what, and who did what.",
    doThis: ["Read \"Who can do what\": the access table every API route checks.", "Search the Audit log for what you just did on this tour."],
    notice: ["Each sign-in, write and AI answer from the tour appears here."],
  },
];

export const TOUR_MINUTES = Math.round(TOUR.reduce((n, s) => n + s.minutes, 0));
export const stopAt = (n: number) => (Number.isInteger(n) && n >= 1 && n <= TOUR.length ? TOUR[n - 1] : null);
