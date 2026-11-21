import { writeRoute } from "@/lib/api";
import { anchorBatch } from "@/lib/seal";
import { TraceError } from "@/lib/trace";

export const POST = (req: Request) =>
  writeRoute(req, "seal:anchor", "anchor", async (repo, _s, body) => {
    if (typeof body.batchCode !== "string") throw new TraceError(400, "batchCode is required");
    const anchor = await anchorBatch(repo, body.batchCode);
    return { target: body.batchCode, result: anchor };
  });
