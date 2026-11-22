import type { Role } from "@prisma/client";
import { aiConfigured } from "@/lib/ai/providers";
import { currentSession } from "@/lib/auth/guard";
import { AskPanel } from "./ask-panel";

// Starter questions per role, each answerable from that role's own records.
const SUGGESTIONS: Record<Role, string[]> = {
  KEEPER: ["Which hive needs attention first, and why?", "Has batch HC-2026-00124 been lab tested?", "What does trust level 4 mean?"],
  COLLECTOR: ["Which batches have been collected so far?", "Where is batch HC-2026-00124 now?", "Who records each step of a batch?"],
  LAB: ["Which batches are waiting for a lab result?", "Why can a certificate not be reused on another batch?", "What does the seal prove?"],
  PROCESSOR: ["Which batches have passed their lab test?", "When should I revoke a QR label?", "Where is batch HC-2026-00124 now?"],
  DISTRIBUTOR: ["Which batches have shipped?", "Where is batch HC-2026-00124 now?", "What does a buyer see when they scan a jar?"],
  INVESTIGATOR: ["Summarise the open incidents.", "Why is batch HC-2026-00131 scored as risky?", "Is a high risk score proof of fraud?"],
  ADMIN: ["Which batches have a broken or missing seal?", "What can each role do?", "How is a batch risk score built?"],
};

export async function AskMount() {
  const s = await currentSession();
  if (!s) return null;
  return <AskPanel configured={aiConfigured()} suggestions={SUGGESTIONS[s.role]} />;
}
