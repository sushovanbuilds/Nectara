"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { cx } from "@/lib/cx";

const LINKS = [
  ["How it works", "#how"], ["For beekeepers", "#beekeepers"], ["For brands", "#brands"], ["Integrity", "#integrity"], ["Guided tour", "/tour"],
] as const;

/** Landing navigation: gains a translucent background and hairline after 80px of scroll; a full-screen sheet on mobile. */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx("sticky top-0 z-40 transition-colors duration-200", scrolled ? "border-b border-line bg-ivory/85 backdrop-blur-md" : "border-b border-transparent")}>
      <div className="wrap flex h-16 items-center justify-between gap-6 md:h-18">
        <Link href="/" aria-label="Nectara home" className="inline-flex min-h-11 items-center"><Wordmark /></Link>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-8 t-small text-ink2">
            {LINKS.map(([label, href]) => <li key={href}><a href={href} className="hover:text-ink">{label}</a></li>)}
          </ul>
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/verify" className="t-small text-ink underline-offset-4 hover:underline">Verify a jar</Link>
          <Link href="/login" className={buttonClass("primary", "md")}>Try the demo</Link>
        </div>

        <button
          type="button" onClick={() => sheet.current?.showModal()}
          className="inline-flex min-h-11 items-center rounded-[10px] px-3 t-small font-medium text-ink hover:bg-panel lg:hidden"
          aria-haspopup="dialog"
        >
          Menu
        </button>
      </div>

      {/* Native dialog: traps focus, closes on Escape, restores focus to the Menu button. */}
      <dialog ref={sheet} aria-label="Menu" className="m-0 h-dvh max-h-none w-full max-w-none bg-ivory p-0 text-ink backdrop:bg-ink/40">
        <div className="wrap flex h-16 items-center justify-between">
          <Wordmark />
          <button type="button" onClick={() => sheet.current?.close()} className="inline-flex min-h-11 items-center rounded-[10px] px-3 t-small font-medium hover:bg-panel">Close</button>
        </div>
        <nav aria-label="Sections" className="wrap mt-6">
          <ul className="divide-y divide-line border-y border-line">
            {LINKS.map(([label, href]) => (
              <li key={href}><a href={href} onClick={() => sheet.current?.close()} className="flex min-h-14 items-center t-h3">{label}</a></li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/login" className={buttonClass("primary", "lg")}>Try the demo</Link>
            <Link href="/verify" className={buttonClass("secondary", "lg")}>Verify a jar</Link>
          </div>
        </nav>
      </dialog>
    </header>
  );
}
