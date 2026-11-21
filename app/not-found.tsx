import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-md p-6">
      <p className="t-small text-ink3">404</p>
      <h1 className="t-h1 mt-2">Page not found</h1>
      <p className="t-body mt-3 text-ink2">That batch, hive or page doesn’t exist, or the link is mistyped.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className={buttonClass("primary")}>Home</Link>
        <Link href="/verify" className={buttonClass("secondary")}>Verify a jar</Link>
      </div>
    </main>
  );
}
