"use client";

import { useState } from "react";

export interface AuditRow { id: string; action: string; target: string; actor: string; when: string }

/** Client-side filter over the most recent entries: action, target or actor. */
export function AuditLog({ rows }: { rows: AuditRow[] }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? rows.filter((r) => `${r.action} ${r.target} ${r.actor}`.toLowerCase().includes(needle)) : rows;
  return (
    <div>
      <label className="t-small block max-w-sm">Search the audit log
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Action, batch code or person" className="mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body" />
      </label>
      <p className="t-caption mt-2 text-ink3" aria-live="polite">{shown.length} of {rows.length} entries</p>
      {rows.length === 0 ? <p className="t-small mt-3 text-ink2">No entries yet. Every sign-in and every write appears here.</p> : shown.length === 0 ? <p className="t-small mt-3 text-ink2">Nothing matches “{q}”.</p> : (
        <div role="region" aria-label="Audit log, scrollable" tabIndex={0} className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-paper">
          <table className="t-small w-full min-w-[36rem] text-left">
            <thead className="t-caption text-ink3"><tr className="border-b border-line"><th scope="col" className="px-4 py-2 font-medium">Action</th><th scope="col" className="px-4 py-2 font-medium">Target</th><th scope="col" className="px-4 py-2 font-medium">Who</th><th scope="col" className="px-4 py-2 font-medium">When</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td><td className="px-4 py-2">{r.target}</td><td className="px-4 py-2 text-ink2">{r.actor}</td><td className="px-4 py-2 whitespace-nowrap text-ink3">{r.when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
