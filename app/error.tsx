"use client";

import { buttonClass } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-md p-6">
      <div role="alert" className="rounded-[10px] border border-terra bg-terrabg p-6 text-terra">
        <h1 className="t-h2">Something went wrong</h1>
        <p className="t-body mt-2">The page could not be shown. Your data has not been changed.</p>
        <button type="button" onClick={reset} className={buttonClass("primary", "md", "mt-5")}>Try again</button>
      </div>
    </main>
  );
}
