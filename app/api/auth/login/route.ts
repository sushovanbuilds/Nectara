import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { COOKIE, SESSION_SECONDS, signSession } from "@/lib/auth/session";
import { getRepo } from "@/lib/repo";

// Compared against when the email is unknown so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }
  const repo = await getRepo();
  const user = await repo.findUserByEmail(body.email);
  const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return Response.json({ error: "Wrong email or password" }, { status: 401 });

  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  (await cookies()).set(COOKIE, signSession({ uid: user.id, role: user.role, name: user.name, orgId: user.orgId, exp }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_SECONDS,
  });
  await repo.writeAudit({ actorId: user.id, action: "auth.login", target: user.email });
  return Response.json({ role: user.role, name: user.name });
}
