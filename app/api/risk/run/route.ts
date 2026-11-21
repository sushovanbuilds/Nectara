import { writeRoute } from "@/lib/api";
import { runRiskEngine } from "@/lib/risk-engine";

export const POST = (req: Request) =>
  writeRoute(req, "risk:run", "run", async (repo) => ({ target: "all-batches", result: await runRiskEngine(repo) }));
