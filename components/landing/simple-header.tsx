import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

/** Wordmark and one call to action, for standalone public pages (404, tour). */
export function SimpleHeader() {
  return (
    <header className="border-b border-line">
      <div className="wrap flex h-16 items-center justify-between gap-6 md:h-18">
        <Link href="/" aria-label="Nectara home" className="inline-flex min-h-11 items-center"><Wordmark /></Link>
        <Link href="/login" className={buttonClass("primary")}>Try the demo</Link>
      </div>
    </header>
  );
}
