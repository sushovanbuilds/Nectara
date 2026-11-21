"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

export interface Hit { group: "Pages" | "Batches" | "Hives"; label: string; sub?: string; href: string }

const EVENT = "nectara:palette";
export const openPalette = () => window.dispatchEvent(new Event(EVENT));

/** Ctrl/Cmd+K: jump to a page, batch code or hive. Results come from /api/search, already filtered by role. */
export function CommandPalette() {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Hit[] | null>(null);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const open = () => {
      if (!dialog.current?.open) dialog.current?.showModal();
      if (!data) fetch("/api/search").then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(EVENT, open);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(EVENT, open); };
  }, [data]);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const match = (h: Hit) => !needle || h.label.toLowerCase().includes(needle) || !!h.sub?.toLowerCase().includes(needle);
    return (["Pages", "Batches", "Hives"] as const).flatMap((g) => (data ?? []).filter((h) => h.group === g && match(h)).slice(0, 6));
  }, [q, data]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    dialog.current?.close();
    router.push(h.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (hits.length ? (a + 1) % hits.length : 0)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (hits.length ? (a - 1 + hits.length) % hits.length : 0)); }
    if (e.key === "Enter") { e.preventDefault(); go(hits[active]); }
  };

  return (
    <dialog
      ref={dialog} aria-label="Search pages, batches and hives"
      onClose={() => { setQ(""); setActive(0); }}
      onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}
      className="mx-auto mt-[12vh] w-[min(36rem,calc(100%-2rem))] rounded-[14px] border border-line2 bg-paper p-0 text-ink shadow-[0_24px_64px_-24px_rgba(31,29,26,0.45)] backdrop:bg-ink/35"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Icon name="search" className="size-5 text-ink3" />
        <input
          autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKeyDown}
          role="combobox" aria-expanded aria-controls="palette-list" aria-autocomplete="list"
          aria-activedescendant={hits[active] ? `palette-opt-${active}` : undefined} aria-label="Search"
          placeholder="Jump to a page, batch code or hive" className="h-14 min-w-0 flex-1 bg-transparent t-body outline-none placeholder:text-ink3"
        />
        <kbd className="t-caption rounded border border-line px-1.5 text-ink3">Esc</kbd>
      </div>
      <ul id="palette-list" role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
        {hits.map((h, i) => (
          <li key={h.href} role="presentation">
            {(i === 0 || hits[i - 1].group !== h.group) && <p role="presentation" className="t-caption px-3 pb-1 pt-3 font-medium text-ink3">{h.group}</p>}
            <div
              id={`palette-opt-${i}`} role="option" aria-selected={i === active}
              onMouseMove={() => setActive(i)} onClick={() => go(h)}
              className={cx("flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-3", i === active && "bg-panel")}
            >
              <span className="t-small font-medium">{h.label}</span>
              {h.sub && <span className="t-caption truncate text-ink3">{h.sub}</span>}
            </div>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="t-small px-5 pb-4 text-ink2 empty:hidden">
        {error ? "Search is unavailable right now. Try again in a moment." : !data ? "Loading…" : hits.length === 0 ? "No matches. Try a batch code like HC-2026-00124." : ""}
      </p>
    </dialog>
  );
}
