import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import type { Repository } from "@/lib/repo";
import { COOKIE, SESSION_SECONDS, signSession } from "./session";

/** Sets the signed session cookie and records the sign-in. Shared by the login route and the demo tour. */
export async function startSession(repo: Repository, user: User, via = "auth.login"): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  (await cookies()).set(COOKIE, signSession({ uid: user.id, role: user.role, name: user.name, orgId: user.orgId, exp }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS,
  });
  await repo.writeAudit({ actorId: user.id, action: via, target: user.email });
}
