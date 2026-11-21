import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/auth/session";

// Optimistic redirect only. Real authorisation is `authorize()` inside every route handler.
export function proxy(req: NextRequest) {
  if (verifySession(req.cookies.get(COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/hives/:path*", "/harvests/:path*", "/batches/:path*", "/lab/:path*",
    "/custody/:path*", "/shipments/:path*", "/risk/:path*", "/incidents/:path*", "/admin/:path*"],
};
