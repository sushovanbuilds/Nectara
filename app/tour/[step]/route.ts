import { cookies } from "next/headers";
import { currentSession } from "@/lib/auth/guard";
import { startSession } from "@/lib/auth/sign-in";
import { isDemo } from "@/lib/demo";
import { clientIp, hit, tooMany } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { ROLE_EMAIL, SEEN_COOKIE, SEEN_MAX_AGE, stopAt, TOUR_COOKIE, TOUR_MAX_AGE } from "@/lib/tour";

/**
 * Moves the guided tour to a stop: signs in as that stop's demo role when needed, remembers the stop, opens its page.
 * POST only (forms), so link prefetching can never switch accounts. Demo mode only: real accounts are never touched.
 */
export async function POST(req: Request, ctx: { params: Promise<{ step: string }> }) {
  if (!isDemo()) return new Response("Not found", { status: 404 });
  const { step } = await ctx.params;
  const jar = await cookies();
  const to = (path: string) => Response.redirect(new URL(path, req.url), 303);
  const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  // Anyone who has used the tour has seen it: the landing page must not start it again on its own.
  jar.set(SEEN_COOKIE, "1", { ...base, maxAge: SEEN_MAX_AGE });

  if (step === "exit") {
    jar.delete(TOUR_COOKIE);
    return to("/tour");
  }
  const n = Number(step);
  const stop = stopAt(n);
  if (!stop) return new Response("Not found", { status: 404 });

  if (stop.role) {
    const s = await currentSession();
    if (s?.role !== stop.role) {
      const v = hit("login_ip", clientIp(req.headers));
      if (!v.ok) return tooMany(v.retryAfter, "account switches");
      const repo = await getRepo();
      const user = await repo.findUserByEmail(ROLE_EMAIL[stop.role]);
      if (!user) return new Response("Demo account missing", { status: 500 });
      await startSession(repo, user, "auth.tour");
    }
  }
  jar.set(TOUR_COOKIE, String(n), { ...base, maxAge: TOUR_MAX_AGE });
  return to(stop.path);
}
