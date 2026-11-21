import { cx } from "@/lib/cx";

/**
 * A number with its context and where it came from. The type forces honesty:
 * every figure carries either a source or an explicit "Sample data" / "Illustration" label.
 */
type Provenance = { source: { label: string; href?: string } } | { label: "Sample data" | "Illustration" };

export function StatFigure({ value, context, className, ...p }: { value: string; context: string; className?: string } & Provenance) {
  return (
    <div className={cx("min-w-0", className)}>
      <p className="t-h1 text-ink">{value}</p>
      <p className="t-small mt-2 text-ink2">{context}</p>
      <p className="t-caption mt-1 text-ink3">
        {"source" in p ? (
          <>Source: {p.source.href ? <a href={p.source.href} className="underline underline-offset-2 hover:text-ink" rel="noopener noreferrer" target="_blank">{p.source.label}</a> : p.source.label}</>
        ) : <span className="italic">{p.label}</span>}
      </p>
    </div>
  );
}
