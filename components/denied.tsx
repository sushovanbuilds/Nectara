import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

/** Permission denied: says which role can use this, and offers a way back. */
export function Denied({ who }: { who: string }) {
  return (
    <div role="alert" className="max-w-xl rounded-[10px] border border-line2 bg-paper p-6">
      <p className="t-small font-medium text-terra">Not available for your role</p>
      <h1 className="t-h2 mt-2">This workspace is for {who}.</h1>
      <p className="t-body mt-2 text-ink2">Your account can’t open it. Ask an admin if you think your role is wrong.</p>
      <Link href="/dashboard" className={buttonClass("secondary", "md", "mt-5")}>Go to your dashboard</Link>
    </div>
  );
}
