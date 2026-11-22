"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { LogoutButton } from "@/components/logout-button";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import type { NavItem } from "@/lib/nav";
import { isActive } from "./sidebar";

/** Phones: four tabs plus More, which opens a sheet with every page, the user and sign out. */
export function MobileNav({ items, user }: { items: NavItem[]; user: { name: string; role: string } }) {
  const path = usePathname();
  const sheet = useRef<HTMLDialogElement>(null);
  const tabs = items.filter((i) => i.href !== "/verify").slice(0, 4);
  const tab = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]";

  return (
    <>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink pb-[env(safe-area-inset-bottom)] text-ivory md:hidden">
        <ul className="flex">
          {tabs.map(({ href, label, icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href} className="flex flex-1">
                <Link href={href} aria-current={active ? "page" : undefined} className={cx(tab, active ? "text-honey" : "text-ivory/80")}>
                  <Icon name={icon} /><span>{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button type="button" onClick={() => sheet.current?.showModal()} aria-haspopup="dialog" className={cx(tab, "text-ivory/80")}>
              <Icon name="more" /><span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <dialog ref={sheet} aria-label="All pages" className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-paper p-0 text-ink backdrop:bg-ink/40 md:hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="t-h3">Menu</p>
          <button type="button" onClick={() => sheet.current?.close()} className="min-h-11 rounded-[10px] px-3 t-small font-medium hover:bg-panel">Close</button>
        </div>
        <ul className="divide-y divide-line px-2">
          {items.map(({ href, label, icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => sheet.current?.close()} aria-current={isActive(path, href) ? "page" : undefined}
                className="flex min-h-12 items-center gap-3 rounded-[10px] px-3 t-body hover:bg-panel">
                <Icon name={icon} className="size-5 text-ink2" />{label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="t-small"><span className="font-medium">{user.name}</span> <span className="text-ink2">· {user.role}</span></p>
          <LogoutButton className="min-h-11 rounded-[10px] border border-line2 px-4 t-small hover:bg-panel" />
        </div>
      </dialog>
    </>
  );
}
