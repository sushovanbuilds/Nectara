import bcrypt from "bcryptjs";
import { startSession } from "@/lib/auth/sign-in";
import { check, clientIp, hit, reset, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";

// Compared against when the email is unknown so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const perIp = hit("login_ip", ip);
  if (!perIp.ok) return tooMany(perIp.retryAfter, "sign-in attempts from this network");

  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }
  // Failures are counted per account and IP together, so an attacker elsewhere cannot lock a real user out.
  const failKey = `${body.email.trim().toLowerCase()}|${ip}`;
  const locked = check("login_fail", failKey);
  if (!locked.ok) return tooMany(locked.retryAfter, "failed sign-ins for this account");

  const repo = await getRepo();
  const user = await repo.findUserByEmail(body.email);
  const ok = await bcrypt.compare(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    hit("login_fail", failKey);
    return Response.json({ error: "Wrong email or password" }, { status: 401 });
  }
  reset("login_fail", failKey);

  await startSession(repo, user);
  return Response.json({ role: user.role, name: user.name });
}
