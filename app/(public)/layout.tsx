import Link from "next/link";
import { Suspense } from "react";
import { Loader } from "@/components/ui/states";
import { TourMount } from "@/components/tour/tour-mount";
import { Wordmark } from "@/components/ui/wordmark";
import { isDemo, SAMPLE_LABEL } from "@/lib/demo";

// Consumer pages: no staff sidebar, designed for a 390px phone first.
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
    <Suspense><TourMount /></Suspense>
    <div className="mx-auto min-h-screen max-w-md px-4 pb-10">
      <header className="flex items-center justify-between py-4">
        <Link href="/" aria-label="Nectara home" className="inline-flex min-h-11 items-center"><Wordmark /></Link>
        {isDemo() && <span className="rounded-full bg-honeybg px-3 py-1 text-xs font-medium text-amber-ink">{SAMPLE_LABEL}</span>}
      </header>
      <main id="main" tabIndex={-1} className="outline-none"><Suspense fallback={<Loader />}>{children}</Suspense></main>
    </div>
    </>
  );
}
