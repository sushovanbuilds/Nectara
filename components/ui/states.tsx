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

/** For waits with no known shape: an amber segment runs along a hairline. Static under reduced motion. */
export function Loader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cx("flex flex-col items-center gap-3 py-16", className)}>
      <span aria-hidden className="loader-track"><span /></span>
      <span className="t-small text-ink2">{label}</span>
    </div>
  );
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const panel = "rounded-[10px] border border-line bg-paper";

export type SkeletonVariant = "dashboard" | "grid" | "list" | "detail" | "form";

/** Mirrors each page type's real layout (header, then its content), so nothing jumps when data arrives. */
export function PageSkeleton({ variant = "dashboard", label = "Loading page" }: { variant?: SkeletonVariant; label?: string }) {
  return (
    <div role="status" aria-label={label}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1"><Skeleton className="h-10 w-64 max-w-full" /><Skeleton className="mt-3 h-5 w-[28rem] max-w-full" /></div>
        <Skeleton className="h-11 w-36" />
      </div>
      {variant === "dashboard" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{range(4).map((i) => <Skeleton key={i} className="h-36" />)}</div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
          <Skeleton className="mt-6 h-48" />
        </>
      )}
      {variant === "grid" && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{range(6).map((i) => <Skeleton key={i} className="h-32" />)}</div>}
      {variant === "list" && (
        <div className={cx(panel, "divide-y divide-line")}>
          {range(6).map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
              <Skeleton className="h-4 w-28 shrink-0" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      )}
      {variant === "detail" && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{range(7).map((i) => <Skeleton key={i} className="h-20" />)}</div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
          <Skeleton className="mt-6 h-56" />
        </>
      )}
      {variant === "form" && (
        <div className={cx(panel, "max-w-3xl space-y-6 p-5 sm:p-6")}>
          {range(4).map((i) => <div key={i}><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-11" /></div>)}
          <Skeleton className="h-11 w-36" />
        </div>
      )}
    </div>
  );
}

/** The phone verify result: outcome panel, then product, lab, seal and journey cards. */
export function VerifySkeleton() {
  return (
    <div role="status" aria-label="Checking the label" className="space-y-4">
      <Skeleton className="h-44" />
      {["h-36", "h-44", "h-56", "h-40"].map((h) => <Skeleton key={h} className={h} />)}
    </div>
  );
}
