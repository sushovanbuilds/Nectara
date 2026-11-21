import { Chip } from "@/components/ui/chip";

/** The consumer VERIFY screen in miniature, for phone mockups. Lab evidence and record seal stay separate cards. */
export function VerifyMini() {
  return (
    <div className="space-y-2.5 px-3 text-left">
      <div className="rounded-[10px] bg-greenbg p-3 text-green">
        <p className="font-display text-lg leading-tight">Label verified</p>
        <p className="t-caption">Batch HC-2026-00124 · Mustard honey</p>
      </div>
      <div className="rounded-[10px] border border-line bg-paper p-3">
        <p className="font-display text-[15px] leading-tight">Lab evidence</p>
        <div className="mt-1.5 flex items-center justify-between gap-2"><span className="t-caption whitespace-nowrap text-ink3">LAB-2026-441</span><Chip tone="amber" className="px-2 text-[11px]">In progress</Chip></div>
      </div>
      <div className="rounded-[10px] border border-line bg-paper p-3">
        <p className="font-display text-[15px] leading-tight">Record seal</p>
        <div className="mt-1.5 flex items-center justify-between gap-2"><span className="t-caption whitespace-nowrap text-ink3">Simulated ledger</span><Chip tone="green" className="px-2 text-[11px]">Intact</Chip></div>
      </div>
      <div className="rounded-[10px] border border-line bg-paper p-3">
        <p className="font-display text-[15px] leading-tight">Journey</p>
        <ol className="t-caption mt-1.5 space-y-1 text-ink2">
          <li className="flex justify-between"><span>Hive</span><span className="text-ink3">21 Aug</span></li>
          <li className="flex justify-between"><span>Harvest</span><span className="text-ink3">21 Aug</span></li>
          <li className="flex justify-between"><span>Collection</span><span className="text-ink3">22 Aug</span></li>
        </ol>
      </div>
      <p className="t-caption px-1 text-ink3">Saharanpur, Uttar Pradesh · Sample data</p>
    </div>
  );
}
