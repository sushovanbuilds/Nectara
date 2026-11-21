import { cookies } from "next/headers";
import { currentSession } from "@/lib/auth/guard";
import { COOKIE } from "@/lib/auth/session";
import { getRepo } from "@/lib/repo";

export async function POST() {
  const session = await currentSession();
  (await cookies()).delete(COOKIE);
  if (session) await (await getRepo()).writeAudit({ actorId: session.uid, action: "auth.logout", target: session.uid });
  return Response.json({ ok: true });
}
