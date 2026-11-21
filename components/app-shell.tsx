import { Suspense } from "react";
import { isDemo } from "@/lib/demo";
import { OfflineBanner } from "./ui/offline-banner";
import { PageSkeleton } from "./ui/states";
import { Toaster } from "./ui/toast";
import { CommandPalette } from "./shell/command-palette";
import { ShellNav } from "./shell/shell-nav";
import { TopBar } from "./shell/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      {/* Placeholder keeps the layout steady while the session-aware navigation streams in. */}
      <Suspense fallback={<div aria-hidden className="hidden h-screen w-16 shrink-0 bg-ink md:block min-[1100px]:w-[196px]" />}>
        <ShellNav />
      </Suspense>
      <div className="min-w-0 flex-1">
        <OfflineBanner />
        {/* TopBar reads the URL for the breadcrumb, which on dynamic routes must sit inside Suspense. */}
        <Suspense fallback={<div aria-hidden className="h-14 border-b border-line" />}>
          <TopBar demo={isDemo()} />
        </Suspense>
        <main id="main" tabIndex={-1} className="mx-auto max-w-[75rem] px-4 pb-28 pt-6 outline-none sm:px-6 md:pb-12 md:pt-8">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </main>
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
