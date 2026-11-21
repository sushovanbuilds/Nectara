import Link from "next/link";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-[#33302b]",
  secondary: "border border-line2 bg-paper text-ink hover:bg-panel",
  ghost: "text-ink hover:bg-panel",
};
// md and lg meet the 44px touch-target minimum.
const SIZE: Record<Size, string> = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-5 text-sm", lg: "min-h-13 px-6 text-base" };

export const buttonClass = (variant: Variant = "primary", size: Size = "md", className?: string) =>
  cx("inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", VARIANT[variant], SIZE[size], className);

type Common = { variant?: Variant; size?: Size; className?: string; children: React.ReactNode };

/** A button, or a link that looks like one when `href` is given. Labels are verbs: "Log harvest", never "Submit". */
export function Button(props: Common & ({ href: string } | React.ButtonHTMLAttributes<HTMLButtonElement>)) {
  const { variant, size, className, children, ...rest } = props;
  if ("href" in rest && rest.href) return <Link href={rest.href} className={buttonClass(variant, size, className)}>{children}</Link>;
  return <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} className={buttonClass(variant, size, className)}>{children}</button>;
}
