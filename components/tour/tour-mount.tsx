import { cookies } from "next/headers";
import { connection } from "next/server";
import { isDemo } from "@/lib/demo";
import { ROLE_LABEL, stopAt, TOUR, TOUR_COOKIE } from "@/lib/tour";
import { TourBar } from "./tour-bar";

/**
 * Renders the floating tour card only while a tour is running (demo mode, tour cookie set). Wrap in Suspense: it reads a cookie.
 * `placement="app"` lifts the card above the phone tab bar.
 */
export async function TourMount({ placement = "page" }: { placement?: "app" | "page" }) {
  await connection();
  if (!isDemo()) return null;
  const n = Number((await cookies()).get(TOUR_COOKIE)?.value);
  const stop = stopAt(n);
  if (!stop) return null;
  return <TourBar n={n} total={TOUR.length} stop={stop} roleLabel={stop.role ? ROLE_LABEL[stop.role] : null} titles={TOUR.map((s) => s.title)} placement={placement} />;
}
