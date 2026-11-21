"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

/** One-click POST with an inline error, for actions that need no extra fields. */
export function PostButton({ url, body, label, done = "Saved." }: { url: string; body: object; label: string; done?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  return (
    <span>
      <button
        className={buttonClass("secondary", "md")}
        onClick={async () => {
          const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          if (res.ok) { toast(done); router.refresh(); }
          else setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Failed");
        }}
      >
        {label}
      </button>
      {error && <span role="alert" className="ml-2 text-sm text-terra">{error}</span>}
    </span>
  );
}
