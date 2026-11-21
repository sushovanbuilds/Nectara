import { cx } from "@/lib/cx";

/** "Nectara." in Fraunces. The full stop is the brand accent: amber on light, honey on charcoal. */
export function Wordmark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={cx("font-display text-2xl tracking-tight", tone === "dark" ? "text-ivory" : "text-ink", className)}>
      Nectara<span className={tone === "dark" ? "text-honey" : "text-amber"} aria-hidden>.</span>
    </span>
  );
}
