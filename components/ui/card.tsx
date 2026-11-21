import { cx } from "@/lib/cx";

const TONE = { paper: "bg-paper border-line text-ink", panel: "bg-panel border-line text-ink", ink: "bg-ink border-[#34302a] text-ivory" } as const;

/** Hairline-bordered surface. Prefer this over shadows. */
export function Card({ as: Tag = "div", tone = "paper", className, children, ...rest }:
  { as?: "div" | "section" | "article" | "li"; tone?: keyof typeof TONE; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return <Tag {...rest} className={cx("rounded-[10px] border p-5 sm:p-6", TONE[tone], className)}>{children}</Tag>;
}
