import { authorize } from "@/lib/auth/guard";
import { certificateInUse } from "@/lib/lab";
import { getRepo } from "@/lib/repo";

// Lab-only pre-check so the form can warn before a certificate is reused. The real guard is in recordLabResult.
export async function GET(req: Request) {
  const a = await authorize("lab:publish");
  if (!a.ok) return a.res;
  const cert = new URL(req.url).searchParams.get("cert")?.trim();
  if (!cert) return Response.json({ error: "cert is required" }, { status: 400 });
  return Response.json({ usedOn: await certificateInUse(await getRepo(), cert) });
}
