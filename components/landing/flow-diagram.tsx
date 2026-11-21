"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

/** Arrow that draws itself in once the diagram scrolls into view (CSS in globals.css; off for reduced motion). */
function Arrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-2 md:px-2 md:py-0">
      <span className="t-caption text-center text-ink3">{label}</span>
      <svg aria-hidden viewBox="0 0 120 16" className="draw hidden h-4 w-28 text-amber md:block">
        <path d="M2 8 H114" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M106 2 L116 8 L106 14" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg aria-hidden viewBox="0 0 16 48" className="draw h-10 w-4 text-amber md:hidden">
        <path d="M8 2 V42" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 34 L8 44 L14 34" pathLength={1} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function Node({ name, line, children }: { name: string; line: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 rounded-[10px] border border-line bg-paper p-5">
      <p className="font-display text-2xl tracking-tight">{name}</p>
      <p className="t-small mt-1 text-ink2">{line}</p>
      {children}
    </div>
  );
}

export function FlowDiagram({ log }: { log: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setDrawn(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cx("flex flex-col items-stretch md:flex-row md:items-start", drawn && "is-drawn")}>
      <Node name="HIVEOS" line="Hive digital twin: health state, the reasons, the next action." />
      <Arrow label="hive passport, harvest" />
      <Node name="TRACE" line="Hive-to-shelf record: every hand-off written once, each hash chained to the last.">{log}</Node>
      <Arrow label="signed QR label" />
      <Node name="VERIFY" line="Consumer QR: origin, journey, lab status and record integrity, no account needed." />
    </div>
  );
}
