import { writeRoute } from "@/lib/api";
import { TraceError } from "@/lib/trace";
import { issueQr } from "@/lib/verify";

export const POST = (req: Request) =>
  writeRoute(req, "qr:issue", "issue", async (repo, s, body) => {
    if (typeof body.batchCode !== "string") throw new TraceError(400, "batchCode is required");
    const { token, code } = await issueQr(repo, s, body.batchCode);
    return { target: body.batchCode, result: { code, issuedAt: token.issuedAt } };
  });
