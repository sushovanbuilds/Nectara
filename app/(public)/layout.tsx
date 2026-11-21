import Link from "next/link";
import { Suspense } from "react";
import { isDemo, SAMPLE_LABEL } from "@/lib/demo";

// Consumer pages: no staff sidebar, designed for a 390px phone first.
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-2xl">Nectara<span className="text-amber-ink">.</span></Link>
        {isDemo() && <span className="rounded-full bg-honeybg px-3 py-1 text-xs font-medium text-amber-ink">{SAMPLE_LABEL}</span>}
      </header>
      <main id="main" tabIndex={-1} className="outline-none"><Suspense fallback={<p className="text-ink3">Loading…</p>}>{children}</Suspense></main>
    </div>
  );
}
