"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";
import { cx } from "@/lib/cx";

/** Front-end illustration only: nothing is changed or stored. Shows what a reader sees when a sealed record is edited. */
export function SealFlip({ root }: { root: string }) {
  const [tampered, setTampered] = useState(false);
  const face = "absolute inset-0 rounded-[10px] border border-line bg-paper p-5 text-ink";
  return (
    <div>
      <div className="relative h-44 [perspective:1000px]">
        <div className={cx("flip relative h-full", tampered && "flipped")}>
          <div className={face} aria-hidden={tampered}>
            <div className="flex items-center justify-between gap-3"><p className="t-h3">Record seal</p><Chip tone="green">Intact</Chip></div>
            <p className="t-small mt-3 text-ink2">Every event still matches its hash and the sealed Merkle root.</p>
            <p className="t-caption mt-3 font-mono text-ink3">root {root.slice(0, 4)}…{root.slice(-4)} · Simulated ledger</p>
          </div>
          <div className={face} aria-hidden={!tampered}>
            <div className="flex items-center justify-between gap-3"><p className="t-h3">Record seal</p><Chip tone="terra">Broken</Chip></div>
            <p className="t-small mt-3 text-terra">Record changed after sealing. First mismatch: the harvest event, whose quantity was edited.</p>
            <p className="t-caption mt-3 font-mono text-ink3">root {root.slice(0, 4)}…{root.slice(-4)} · Simulated ledger</p>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{tampered ? "Record seal: broken, record changed after sealing." : "Record seal: intact."}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button" role="switch" aria-checked={tampered} onClick={() => setTampered((t) => !t)}
          className="inline-flex min-h-11 items-center gap-3 rounded-[10px] border border-white/25 px-4 t-small font-medium text-ivory hover:bg-white/10"
        >
          <span aria-hidden className={cx("relative h-5 w-9 rounded-full transition-colors", tampered ? "bg-terra-dark" : "bg-white/25")}>
            <span className={cx("absolute top-0.5 size-4 rounded-full bg-ivory transition-[left]", tampered ? "left-[18px]" : "left-0.5")} />
          </span>
          Tamper with this record
        </button>
        <span className="t-caption text-ivory/70">Illustration. Nothing is changed.</span>
      </div>
    </div>
  );
}
