import { writeRoute } from "@/lib/api";
import { TraceError } from "@/lib/trace";
import { revokeQr } from "@/lib/verify";

export const POST = (req: Request) =>
  writeRoute(req, "qr:revoke", "revoke", async (repo, _s, body) => {
    if (typeof body.token !== "string") throw new TraceError(400, "token is required");
    const t = await revokeQr(repo, body.token);
    return { target: t.token, result: { token: t.token, revokedAt: t.revokedAt } };
  });
