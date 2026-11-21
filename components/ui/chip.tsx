import { cx } from "@/lib/cx";

export type Tone = "green" | "amber" | "terra" | "neutral";

const TONE: Record<Tone, string> = {
  green: "bg-greenbg text-green",
  amber: "bg-honeybg text-amber-ink",
  terra: "bg-terrabg text-terra",
  neutral: "bg-panel text-ink2",
};
const DOT: Record<Tone, string> = { green: "bg-green", amber: "bg-amber", terra: "bg-terra", neutral: "bg-ink3" };

/** One status language everywhere: green good, amber in progress, terracotta bad. */
export const STATUS_TONE: Record<string, Tone> = {
  verified: "green", stable: "green", intact: "green", passed: "green", low: "green",
  "in progress": "amber", watch: "amber", pending: "amber", "not sealed yet": "amber", medium: "amber",
  failed: "terra", broken: "terra", stressed: "terra", critical: "terra", high: "terra", revoked: "terra",
};

/** Status chip. Colour is never the only signal: the text label is required. */
export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap", TONE[tone], className)}>
      <span aria-hidden className={cx("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}
