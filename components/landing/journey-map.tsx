"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

const STATIONS = [
  { name: "Hive", role: "Honey keeper", text: "Hive passport: apiary, health state and trust level." },
  { name: "Harvest", role: "Honey keeper", text: "Quantity, floral source and date, linked to the hive." },
  { name: "Batch", role: "Honey keeper", text: "A batch code and the first hash in its chain." },
  { name: "Lab test", role: "Quality lab", text: "Certificate and values, bound to this one batch. The only source of purity evidence.", lab: true },
  { name: "Processor", role: "Processor", text: "Custody receipt, processing, blend ratios, packaging and the signed QR label." },
  { name: "Distributor", role: "Distributor", text: "Custody receipt and shipment: carrier, origin and destination." },
  { name: "Consumer", role: "No account needed", text: "Scans the jar: origin, journey, lab status and record seal." },
];

/** Transit-map journey. Desktop: hover, focus or tap a station. Mobile: a vertical timeline with every stop described. */
export function JourneyMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(3);
  const [p, setP] = useState(1);

  // The line fills as the section scrolls through the viewport. Reduced motion shows it full.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onScroll = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const vh = window.innerHeight;
      setP(Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.25))));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = STATIONS[active];
  return (
    <div ref={ref}>
      {/* Desktop */}
      <div className="hidden md:block">
        <div className="relative px-4">
          <div aria-hidden className="absolute left-4 right-4 top-[11px] h-0.5 bg-line" />
          <div aria-hidden className="absolute left-4 right-4 top-[11px] h-0.5 origin-left bg-amber transition-transform duration-150" style={{ transform: `scaleX(${p})` }} />
          <ol className="relative flex justify-between">
            {STATIONS.map((st, i) => (
              <li key={st.name} className="flex flex-col items-center">
                <button
                  type="button" aria-pressed={active === i} aria-controls="journey-detail"
                  onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                  className="group flex flex-col items-center gap-3 rounded-[10px] px-1 pb-1"
                >
                  <span className={cx(
                    "size-6 rounded-full border-2 transition-transform",
                    st.lab ? "border-green bg-green" : "border-ink bg-paper",
                    active === i && "scale-125",
                  )} />
                  <span className={cx("t-small", active === i ? "font-medium text-ink" : "text-ink2")}>{st.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div id="journey-detail" aria-live="polite" className="mt-8 grid grid-cols-[12rem_1fr] gap-6 rounded-[10px] border border-line bg-paper p-6">
          <div>
            <p className="t-h3">{s.name}</p>
            <p className={cx("t-small mt-1", s.lab ? "text-green" : "text-ink2")}>Recorded by: {s.role}</p>
          </div>
          <p className="t-body-lg text-ink2">{s.text}</p>
        </div>
      </div>

      {/* Mobile */}
      <ol className="relative md:hidden">
        <div aria-hidden className="absolute bottom-3 left-[11px] top-3 w-0.5 bg-line" />
        <div aria-hidden className="absolute bottom-3 left-[11px] top-3 w-0.5 origin-top bg-amber" style={{ transform: `scaleY(${p})` }} />
        {STATIONS.map((st) => (
          <li key={st.name} className="relative flex gap-4 pb-7 last:pb-0">
            <span aria-hidden className={cx("relative mt-0.5 size-6 shrink-0 rounded-full border-2", st.lab ? "border-green bg-green" : "border-ink bg-paper")} />
            <div>
              <p className="t-h3">{st.name}</p>
              <p className={cx("t-caption mt-0.5", st.lab ? "text-green" : "text-ink3")}>Recorded by: {st.role}</p>
              <p className="t-small mt-1.5 text-ink2">{st.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
