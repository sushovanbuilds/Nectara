import { cx } from "@/lib/cx";

/** "Nectara" in Fraunces, ink on light grounds and ivory on charcoal. */
export function Wordmark({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return <span className={cx("font-display text-2xl tracking-tight", tone === "dark" ? "text-ivory" : "text-ink", className)}>Nectara</span>;
}
