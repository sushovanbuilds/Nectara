import { currentSession } from "@/lib/auth/guard";
import { navItems } from "@/lib/nav";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

const ROLE_LABEL: Record<string, string> = {
  KEEPER: "Honey keeper", COLLECTOR: "Collector", LAB: "Quality lab", PROCESSOR: "Processor",
  DISTRIBUTOR: "Distributor", INVESTIGATOR: "Investigator", ADMIN: "Admin",
};

export async function ShellNav() {
  const s = await currentSession();
  if (!s) return null; // proxy.ts sends signed-out visitors to /login before this renders
  const items = navItems(s.role);
  const user = { name: s.name, role: ROLE_LABEL[s.role] };
  return <><Sidebar items={items} user={user} /><MobileNav items={items} user={user} /></>;
}
