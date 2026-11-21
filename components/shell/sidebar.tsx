"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import type { NavItem } from "@/lib/nav";

export const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

/**
 * Charcoal sidebar: 196px with labels from 1100px, a 64px icon rail from 768px, hidden on phones
 * (the bottom tab bar takes over). Labels stay readable to screen readers on the rail.
 */
export function Sidebar({ items, user }: { items: NavItem[]; user: { name: string; role: string } }) {
  const path = usePathname();
  const rail = "max-[1099px]:sr-only";
  return (
    <aside className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col bg-ink text-ivory md:flex min-[1100px]:w-[196px]">
      <Link href="/dashboard" className="flex h-16 items-center px-5 font-display text-2xl max-[1099px]:justify-center max-[1099px]:px-0" aria-label="Nectara dashboard">
        <span aria-hidden>N<span className="max-[1099px]:hidden">ectara</span><span className="text-honey">.</span></span>
      </Link>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-0.5">
          {items.map(({ href, label, icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link
                  href={href} title={label} aria-current={active ? "page" : undefined}
                  className={cx("flex min-h-10 items-center gap-3 rounded-md px-3 text-sm max-[1099px]:justify-center max-[1099px]:px-0",
                    active ? "bg-white/12 text-ivory" : "text-ivory/80 hover:bg-white/8 hover:text-ivory")}
                >
                  <Icon name={icon} className="size-[18px] shrink-0" />
                  <span className={rail}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-1 max-[1099px]:justify-center max-[1099px]:px-0">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-white/12 text-xs font-medium">
            {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </span>
          <span className={cx("min-w-0", rail)}>
            <span className="block truncate text-sm">{user.name}</span>
            <span className="block text-xs text-ivory/70">{user.role}</span>
          </span>
        </div>
        <LogoutButton className="mt-2 flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-ivory/80 hover:bg-white/8 hover:text-ivory max-[1099px]:justify-center max-[1099px]:px-0">
          <Icon name="logout" className="size-[18px] shrink-0" /><span className={rail}>Sign out</span>
        </LogoutButton>
      </div>
    </aside>
  );
}
