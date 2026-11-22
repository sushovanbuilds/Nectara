import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/auth/session";
import { isDemo } from "@/lib/demo";
import { SEEN_COOKIE, SEEN_MAX_AGE, TOUR_COOKIE, TOUR_MAX_AGE } from "@/lib/tour";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/") return firstVisit(req);
  // Optimistic redirect only. Real authorisation is `authorize()` inside every route handler.
  if (verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

/**
 * Demo mode: a first-time visitor to the landing page starts the guided tour at stop 1 (no account needed).
 * Skipped for returning visitors, anyone already signed in or touring, and background link prefetches,
 * so the tour never appears unasked for someone who went straight to /login. Buyers on /verify are never matched.
 */
function firstVisit(req: NextRequest) {
  // Only a real page load counts. Router prefetches and client navigations carry an `rsc` header (production
  // prefetches "/" from every wordmark link), and must never start the tour for someone who did not open the landing page.
  const h = req.headers;
  const pageLoad = !h.has("rsc") && !h.has("next-router-prefetch") && !/prefetch/i.test(h.get("sec-purpose") ?? h.get("purpose") ?? "")
    && (h.get("sec-fetch-dest") === "document" || (h.get("accept") ?? "").includes("text/html"));
  if (!isDemo() || !pageLoad || req.cookies.has(SEEN_COOKIE) || req.cookies.has(TOUR_COOKIE) || req.cookies.has(COOKIE)) return NextResponse.next();
  // The page renders in this same request, so it must see the tour cookie now, not on the next visit.
  const headers = new Headers(req.headers);
  headers.set("cookie", [req.headers.get("cookie"), `${TOUR_COOKIE}=1`].filter(Boolean).join("; "));
  const res = NextResponse.next({ request: { headers } });
  const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  res.cookies.set(TOUR_COOKIE, "1", { ...base, maxAge: TOUR_MAX_AGE });
  res.cookies.set(SEEN_COOKIE, "1", { ...base, maxAge: SEEN_MAX_AGE });
  return res;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/hives/:path*", "/harvests/:path*", "/batches/:path*", "/lab/:path*",
    "/custody/:path*", "/shipments/:path*", "/risk/:path*", "/incidents/:path*", "/admin/:path*"],
};
