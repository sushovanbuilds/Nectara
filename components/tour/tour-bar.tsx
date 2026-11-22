"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import type { TourStop } from "@/lib/tour";

const PREF = "nectara-tour-steps"; // "hidden" | "shown", per viewer
const LAST = "nectara-tour-last"; // last stop shown, so the progress fill can glide from there
const DONE = (n: number) => `nectara-tour-done-${n}`;

const read = (key: string, fallback: string) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const write = (key: string, v: string) => { try { localStorage.setItem(key, v); } catch {} };
const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };
const PHONE = "(max-width: 767px)";
const subscribePhone = (cb: () => void) => { const m = window.matchMedia(PHONE); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

/**
 * The guided tour, as a floating card: the stop number and title, a progress bar that glides from the previous stop,
 * one dot per stop to jump anywhere, a "Do this" checklist to tick off, what to notice, and the way on.
 * Paper and hairlines like every other card, so it never reads as a warning.
 */
export function TourBar({ n, total, stop, roleLabel, titles, placement }: {
  n: number; total: number; stop: TourStop; roleLabel: string | null; titles: string[]; placement: "app" | "page";
}) {
  // Phones start collapsed to a slim bar so the page stays visible; desktop starts open. Each remembers its own choice.
  // The server renders the phone (collapsed) frame, so phones never flash a tall card.
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => true);
  const prefKey = phone ? `${PREF}-phone` : PREF;
  const storedOpen = useSyncExternalStore(subscribe, () => read(prefKey, ""), () => "");
  const storedDone = useSyncExternalStore(subscribe, () => read(DONE(n), ""), () => "");
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const [doneOverride, setDoneOverride] = useState<string | null>(null);
  const open = openOverride ?? (storedOpen === "shown" ? true : storedOpen === "hidden" ? false : !phone);
  const done = new Set((doneOverride ?? storedDone).split(",").filter(Boolean).map(Number));
  const allDone = done.size === stop.doThis.length;
  const last = n === total;

  const toggleOpen = () => { write(prefKey, open ? "hidden" : "shown"); setOpenOverride(!open); };
  const toggleDone = (i: number) => {
    const next = new Set(done);
    if (next.has(i)) next.delete(i); else next.add(i);
    const v = [...next].sort().join(",");
    write(DONE(n), v);
    setDoneOverride(v);
  };

  // Glide the fill from the last stop to this one (DOM only, no re-render).
  const fill = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = fill.current;
    if (!el) return;
    const from = Math.min(Math.max(Number(read(LAST, String(n))) || n, 1), total);
    el.style.width = `${(from / total) * 100}%`;
    const id = requestAnimationFrame(() => { el.style.width = `${(n / total) * 100}%`; });
    write(LAST, String(n));
    return () => cancelAnimationFrame(id);
  }, [n, total]);

  return (
    <aside
      key={n}
      aria-label="Guided tour"
      className={cx(
        "tour-in fixed inset-x-3 z-40 rounded-[10px] border border-line2 bg-paper text-ink md:inset-x-auto md:right-6 md:w-[25rem]",
        placement === "app" ? "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-6" : "bottom-3 md:bottom-6",
      )}
    >
      <div className="flex items-start gap-3 px-4 pt-3.5 max-md:items-center max-md:gap-2 max-md:px-3 max-md:pt-2">
        <span aria-hidden className="font-display text-3xl leading-none italic text-amber-ink tabular-nums max-md:text-2xl">{String(n).padStart(2, "0")}</span>
        <div className="min-w-0 flex-1">
          <p className="t-caption text-ink3">Guided tour · stop {n} of {total}{roleLabel && <span className="max-md:hidden"> · as {roleLabel}</span>}</p>
          <h2 className="t-small mt-0.5 font-sans font-medium text-ink max-md:truncate">{stop.title}</h2>
        </div>
        <button type="button" onClick={toggleOpen} aria-expanded={open} aria-controls="tour-body" aria-label={open ? "Collapse tour steps" : "Expand tour steps"} className={buttonClass("ghost", "md", "-mr-2 -mt-1 px-2.5 max-md:m-0 max-md:px-2")}>
          <Icon name="chevron" className={cx("tour-chev size-5", open ? "rotate-180" : "")} />
        </button>
        {/* Phones, collapsed: Next sits in the slim bar so the way on is one tap away without opening it. */}
        {!open && (
          <form method="post" action={last ? "/tour/exit" : `/tour/${n + 1}`} className="md:hidden">
            <button key={String(allDone)} className={buttonClass("primary", "md", cx("px-4", allDone && "tour-nudge"))}>{last ? "Finish" : "Next"}</button>
          </form>
        )}
      </div>

      <div className={cx("px-4 pt-3 max-md:px-3 max-md:pt-2", !open && "max-md:pb-2.5")}>
        <div className="relative h-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <span ref={fill} className="tour-fill absolute inset-y-0 left-0 rounded-full bg-amber" style={{ width: `${(n / total) * 100}%` }} />
        </div>
        <ol className="mt-1.5 flex justify-between max-md:hidden" aria-label="Jump to a stop">
          {titles.map((t, i) => (
            <li key={t}>
              <form method="post" action={`/tour/${i + 1}`}>
                <button
                  aria-label={`Stop ${i + 1}: ${t}`} aria-current={i + 1 === n ? "step" : undefined} title={t}
                  className="group grid size-6 place-items-center rounded-full"
                >
                  <span className={cx("block rounded-full transition-all duration-200",
                    i + 1 === n ? "size-2.5 bg-amber" : i + 1 < n ? "size-1.5 bg-ink2 group-hover:size-2.5" : "size-1.5 bg-line2 group-hover:size-2.5 group-hover:bg-ink3")} />
                </button>
              </form>
            </li>
          ))}
        </ol>
      </div>

      <div id="tour-body" className="tour-fold" data-open={open}>
        <div>
          <div className="max-h-[24vh] overflow-y-auto px-4 pb-1 pt-2 md:max-h-[50vh]">
            <p className="t-caption font-medium text-ink2">Do this <span className="text-ink3">· {done.size}/{stop.doThis.length}</span></p>
            <ul className="mt-1.5 space-y-1">
              {stop.doThis.map((d, i) => (
                <li key={d}>
                  <button type="button" role="checkbox" aria-checked={done.has(i)} onClick={() => toggleDone(i)} className="flex min-h-11 w-full items-start gap-3 rounded-[10px] px-1 py-1.5 text-left hover:bg-panel">
                    <span aria-hidden className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-200", done.has(i) ? "border-green bg-green text-paper" : "border-line2 bg-ivory")}>
                      {done.has(i) && <Icon name="check" className="tour-tick size-3.5" />}
                    </span>
                    <span className={cx("tour-step-text t-small", done.has(i) ? "text-ink3 line-through decoration-ink3/60" : "text-ink")}>{d}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="t-caption mt-3 font-medium text-ink2">Notice</p>
            <ul className="t-small mt-1 list-disc space-y-1 pl-5 text-ink2">{stop.notice.map((d) => <li key={d}>{d}</li>)}</ul>
          </div>
        </div>
      </div>

      <div className={cx("mt-2 flex items-center justify-between gap-2 border-t border-line px-4 py-3 max-md:px-3 max-md:py-2", !open && "max-md:hidden")}>
        <div className="flex items-center gap-1">
          {n > 1 && <form method="post" action={`/tour/${n - 1}`}><button className={buttonClass("ghost", "md", "px-3")}>Back</button></form>}
          <Link href="/tour" className={buttonClass("ghost", "md", "px-3 text-ink2")}>All stops</Link>
          <form method="post" action="/tour/exit"><button className={buttonClass("ghost", "md", "px-3 text-ink2")}>Exit</button></form>
        </div>
        <form method="post" action={last ? "/tour/exit" : `/tour/${n + 1}`}>
          <button key={String(allDone)} className={buttonClass("primary", "md", allDone ? "tour-nudge" : "")}>{last ? "Finish" : "Next"}</button>
        </form>
      </div>
    </aside>
  );
}
