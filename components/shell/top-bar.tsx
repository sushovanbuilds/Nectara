"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/wordmark";
import { breadcrumbs } from "@/lib/nav";
import { openAsk } from "@/components/ai/ask-panel";
import { openPalette } from "./command-palette";

export function TopBar({ demo }: { demo: boolean }) {
  const path = usePathname();
  const crumbs = breadcrumbs(path);
  // Shows the right shortcut key; the server renders "Ctrl" and the client corrects it without a mismatch.
  const mac = useSyncExternalStore(() => () => {}, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);

  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-ivory px-4 sm:px-6">
      <Link href="/dashboard" className="inline-flex min-h-11 items-center md:hidden" aria-label="Nectara dashboard"><Wordmark className="text-xl" /></Link>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
        <ol className="t-small flex items-center gap-2 text-ink2">
          {crumbs.map((c, i) => (
            <li key={c.href + i} className="flex min-w-0 items-center gap-2">
              {i > 0 && <span aria-hidden className="text-ink3">/</span>}
              {i === crumbs.length - 1
                ? <span aria-current="page" className="truncate font-medium text-ink">{c.label}</span>
                : <Link href={c.href} className="truncate hover:text-ink">{c.label}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex items-center gap-3">
        {demo && <span className="t-caption rounded-full bg-honeybg px-2.5 py-1 font-medium text-amber-ink">Sample data</span>}
        <button
          type="button" onClick={openAsk} aria-haspopup="dialog"
          className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line2 bg-paper px-3 t-small text-ink2 hover:bg-panel max-md:min-w-11 max-md:justify-center max-md:px-0 md:min-h-10"
        >
          <Icon name="ask" className="size-4" />
          <span className="max-md:sr-only">Ask</span>
        </button>
        <button
          type="button" onClick={openPalette}
          className="flex min-h-11 items-center gap-2 rounded-[10px] border border-line2 bg-paper px-3 t-small text-ink2 hover:bg-panel max-md:min-w-11 max-md:justify-center max-md:px-0 md:min-h-10"
        >
          <Icon name="search" className="size-4" />
          <span className="max-md:sr-only">Search</span>
          <kbd className="hidden rounded border border-line px-1.5 font-sans text-[11px] text-ink3 md:inline">{mac ? "⌘" : "Ctrl"} K</kbd>
        </button>
      </div>
    </div>
  );
}
