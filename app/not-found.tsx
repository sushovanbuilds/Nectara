import Link from "next/link";
import { SimpleHeader } from "@/components/landing/simple-header";

export const metadata = { title: "Page not found · Nectara", robots: { index: false } };

const WAYS: [string, string, string][] = [
  ["/verify", "Verify a jar", "Scan or type the code printed on a label."],
  ["/login", "Open a workspace", "Sign in to the demo as a keeper, lab, investigator or another role."],
  ["/", "How Nectara works", "Hive health, the sealed batch record and signed QR labels."],
];

export default function NotFound() {
  return (
    <>
      <SimpleHeader />
      <main id="main" tabIndex={-1} className="wrap section-pad outline-none">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <p className="t-small text-ink2">Error 404</p>
            <h1 className="t-h1 mt-3 text-balance">This page is not in the record.</h1>
            <p className="t-body-lg mt-5 max-w-md text-ink2">The batch, hive or page may not exist, or the link may be mistyped. Batch codes look like <span className="whitespace-nowrap">HC-2026-00124</span>.</p>
          </div>
          <nav aria-label="Where to go next" className="col-span-12 lg:col-span-6 lg:col-start-7">
            <ol className="border-t border-line">
              {WAYS.map(([href, title, line], i) => (
                <li key={href} className="border-b border-line">
                  <Link href={href} className="group flex min-h-11 items-baseline gap-5 py-5 hover:bg-paper">
                    <span className="w-9 shrink-0 font-display text-2xl italic text-amber-ink">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="t-h3 block group-hover:underline group-hover:underline-offset-4">{title}</span>
                      <span className="t-small mt-1 block text-ink2">{line}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </main>
    </>
  );
}
