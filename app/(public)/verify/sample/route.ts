import { isDemo } from "@/lib/demo";
import { formatCode } from "@/lib/qr";
import { getRepo } from "@/lib/repo";

/**
 * "Scan a sample jar": QR codes are signed tokens, so a bare batch code cannot be verified.
 * In demo mode this sends visitors to the active label of sample batch HC-2026-00124.
 */
export async function GET(req: Request) {
  const fallback = new URL("/verify", req.url);
  if (!isDemo()) return Response.redirect(fallback, 307);
  const repo = await getRepo();
  const batch = await repo.getBatch("HC-2026-00124");
  const active = batch && (await repo.listQrForBatch(batch.id)).find((t) => !t.revokedAt);
  return Response.redirect(active ? new URL(`/verify/${formatCode(active)}`, req.url) : fallback, 307);
}
