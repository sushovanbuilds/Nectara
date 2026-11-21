"use client";

import { buttonClass } from "@/components/ui/button";

// Inside the app shell, so navigation stays usable when one page fails.
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="max-w-xl rounded-[10px] border border-terra bg-terrabg p-6 text-terra">
      <h1 className="t-h2">This page could not load</h1>
      <p className="t-body mt-2">Something went wrong on our side while loading it. Nothing you entered was saved twice or lost.</p>
      <p className="t-small mt-1">Try again. If it keeps failing, go back to the dashboard and reopen it.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonClass("primary")}>Try again</button>
        <a href="/dashboard" className={buttonClass("secondary")}>Go to dashboard</a>
      </div>
    </div>
  );
}
