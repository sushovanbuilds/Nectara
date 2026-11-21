import { cx } from "@/lib/cx";

/** Clean phone mockup for product screens. Give it a label: it is an image of a screen to assistive tech. */
export function PhoneFrame({ label, tilt = 0, width = 300, className, children }:
  { label: string; tilt?: number; width?: number; className?: string; children: React.ReactNode }) {
  return (
    <figure
      role="img" aria-label={label}
      className={cx("relative rounded-[44px] border border-[#34302a] bg-ink p-3 shadow-[0_24px_48px_-24px_rgba(31,29,26,0.35)]", className)}
      style={{ width, transform: tilt ? `rotate(${tilt}deg)` : undefined }}
    >
      <div aria-hidden className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-ink" />
      <div className="overflow-hidden rounded-[34px] bg-ivory" style={{ aspectRatio: "9 / 19.5" }}>
        <div className="h-full overflow-hidden pt-7">{children}</div>
      </div>
    </figure>
  );
}

/** Minimal browser chrome for desktop screens. */
export function BrowserFrame({ label, url = "nectara.app", className, children }:
  { label: string; url?: string; className?: string; children: React.ReactNode }) {
  return (
    <figure role="img" aria-label={label} className={cx("overflow-hidden rounded-[10px] border border-line2 bg-paper shadow-[0_24px_48px_-32px_rgba(31,29,26,0.3)]", className)}>
      <div aria-hidden className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2.5">
        <span className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-line2" />)}</span>
        <span className="t-caption min-w-0 flex-1 truncate rounded-full bg-paper px-3 py-1 text-center text-ink3">{url}</span>
      </div>
      <div>{children}</div>
    </figure>
  );
}
