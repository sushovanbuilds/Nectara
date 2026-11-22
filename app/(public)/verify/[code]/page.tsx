import { headers } from "next/headers";
import { connection } from "next/server";
import { LabCard } from "@/components/lab-card";
import { SealPanel } from "@/components/seal-panel";
import { Button } from "@/components/ui/button";
import { EVENT_LABEL, fmtDate } from "@/lib/format";
import { clientIp, hit } from "@/lib/rate-limit";
import { getRepo } from "@/lib/repo";
import { verifyCode } from "@/lib/verify";

export const metadata = { title: "Verify · Nectara", robots: { index: false } };

function Warning({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <section role="alert" aria-live="assertive" className="rounded-[10px] bg-terrabg p-6 text-terra">
        <p className="t-small font-medium">Verification result</p>
        <h1 className="t-h1 mt-2">{title}</h1>
        <div className="t-body mt-3">{children}</div>
      </section>
      <div className="rounded-[10px] border border-line bg-paper p-5">
        <h2 className="t-h3">What to do</h2>
        <ul className="t-small mt-3 list-disc space-y-1.5 pl-5 text-ink2">
          <li>Do not rely on this label as proof of origin or testing.</li>
          <li>Check the code printed on the jar and try again; damaged labels can misread.</li>
          <li>If it still fails, tell the shop where you bought it.</li>
        </ul>
      </div>
      <Button href="/verify" variant="secondary" size="lg" className="w-full">Scan another jar</Button>
    </div>
  );
}

export default async function VerifyResult(props: PageProps<"/verify/[code]">) {
  await connection();
  const { code } = await props.params;
  const h = await headers();
  // Each check records a scan and can raise alerts, so a flood from one network must not reach verifyCode.
  const limited = hit("verify", clientIp(h));
  if (!limited.ok) {
    return (
      <div className="space-y-6">
        <section role="status" className="rounded-[10px] border border-line bg-paper p-6">
          <p className="t-small font-medium text-ink2">Verification paused</p>
          <h1 className="t-h1 mt-2">Too many checks</h1>
          <p className="t-body mt-3 text-ink2">This network has checked a lot of labels in the last minute. Wait {limited.retryAfter} seconds, then scan again. Nothing is wrong with the label.</p>
        </section>
        <Button href="/verify" variant="secondary" size="lg" className="w-full">Back to the scanner</Button>
      </div>
    );
  }
  // Coarse location only: the host's city header when present, never precise coordinates.
  const raw = h.get("x-vercel-ip-city");
  const city = raw ? decodeURIComponent(raw) : null;
  const r = await verifyCode(await getRepo(), decodeURIComponent(code), { city });

  if (r.status === "INVALID") {
    return <Warning title="Not verified">This code is not valid. It may be mistyped, damaged or forged.</Warning>;
  }
  if (r.status === "REVOKED") {
    return <Warning title="Label revoked">The label for batch {r.batchCode} was withdrawn on {fmtDate(r.revokedAt)}.</Warning>;
  }

  const v = r.view;
  return (
    <div className="space-y-4">
      <section aria-live="polite" className="rounded-[10px] bg-greenbg p-6 text-green">
        <p className="t-small font-medium">Verification result</p>
        <h1 className="t-h1 mt-2">Label verified</h1>
        <p className="mt-2 font-mono text-sm">Batch {v.batchCode}</p>
        <p className="t-small mt-3">This confirms the label is authentic. Whether the honey is genuine is shown by the lab evidence below.</p>
      </section>

      {r.warning === "CLONE_PATTERN" && (
        <div role="alert" className="t-small rounded-[10px] border border-terra bg-terrabg p-4 text-terra">
          <strong className="font-medium">Possible copied label.</strong> This code was scanned in different cities within a short time. Check the jar and seal carefully.
        </div>
      )}

      <section aria-labelledby="product-h" className="rounded-[10px] border border-line bg-paper p-5">
        <h2 id="product-h" className="t-h3">{v.honeyType}</h2>
        <dl className="t-small mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
          <dt className="text-ink3">Origin</dt><dd>{v.origin}</dd>
          {v.harvestDate && (<><dt className="text-ink3">Harvested</dt><dd>{fmtDate(v.harvestDate)}</dd></>)}
          {v.hive && (<><dt className="text-ink3">Hive</dt><dd>{v.hive}</dd></>)}
        </dl>
      </section>

      <LabCard status={v.lab.status} tests={v.lab.tests} />
      <SealPanel seal={v.seal} batchCode={v.batchCode} canSeal={false} />

      <section aria-labelledby="journey-h" className="rounded-[10px] border border-line bg-paper p-5">
        <h2 id="journey-h" className="t-h3">Journey</h2>
        <ol className="relative mt-4">
          <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line2" />
          {v.journey.map((j, i) => (
            <li key={i} className="relative flex items-baseline justify-between gap-4 pb-3 pl-6 last:pb-0">
              <span aria-hidden className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-amber bg-paper" />
              <span className="t-small">{EVENT_LABEL[j.type as keyof typeof EVENT_LABEL] ?? j.type}</span>
              <time className="t-caption shrink-0 text-ink3">{fmtDate(j.at)}</time>
            </li>
          ))}
        </ol>
      </section>

      <Button href="/verify" variant="secondary" size="lg" className="w-full">Scan another jar</Button>
    </div>
  );
}
