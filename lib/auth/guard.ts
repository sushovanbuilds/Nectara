import { cookies } from "next/headers";
import { connection } from "next/server";
import { hit, tooMany } from "@/lib/rate-limit";
import { Action, can } from "./capabilities";
import { COOKIE, type Session, verifySession } from "./session";

/** Pure decision: 401 when signed out, 403 when the role lacks the capability. */
export function decide(session: Session | null, action: Action): 200 | 401 | 403 {
  if (!session) return 401;
  return can(session.role, action) ? 200 : 403;
}

export async function currentSession(): Promise<Session | null> {
  await connection(); // request-time only: session expiry reads the clock
  return verifySession((await cookies()).get(COOKIE)?.value);
}

/** Use at the top of every route handler: `const a = await authorize("harvest:create"); if (!a.ok) return a.res;` */
export async function authorize(action: Action): Promise<{ ok: true; session: Session } | { ok: false; res: Response }> {
  const session = await currentSession();
  const status = decide(session, action);
  if (status === 200) {
    const v = hit("api", session!.uid);
    if (!v.ok) return { ok: false, res: tooMany(v.retryAfter) };
    return { ok: true, session: session! };
  }
  return { ok: false, res: Response.json({ error: status === 401 ? "Sign in required" : "Not allowed for your role" }, { status }) };
}
