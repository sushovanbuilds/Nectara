import Link from "next/link";
import { cx } from "@/lib/cx";
import { buttonClass } from "./button";

const BANNER = {
  info: "border-line2 bg-panel text-ink",
  warning: "border-amber bg-honeybg text-amber-ink",
  danger: "border-terra bg-terrabg text-terra",
} as const;

/** Full-width notice. Use `danger` only when something is actually wrong. */
export function Banner({ tone = "info", title, children, className }: { tone?: keyof typeof BANNER; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div role={tone === "danger" ? "alert" : "note"} className={cx("t-small rounded-[10px] border px-4 py-3", BANNER[tone], className)}>
      {title && <strong className="font-medium">{title} </strong>}{children}
    </div>
  );
}

/** One sentence on why it is empty, and the next thing to do. */
export function EmptyState({ message, action }: { message: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-[10px] border border-dashed border-line2 px-5 py-8 text-center">
      <p className="t-body text-ink2">{message}</p>
      {action && <Link href={action.href} className={buttonClass("secondary", "md", "mt-4")}>{action.label}</Link>}
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("animate-pulse rounded-[10px] bg-panel motion-reduce:animate-none", className)} />;

/** Matches the page header plus a row of cards, so content does not jump when it arrives. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    </div>
  );
}
