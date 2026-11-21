import Link from "next/link";
import { connection } from "next/server";
import { Scanner } from "@/components/scanner";
import { isDemo } from "@/lib/demo";
import { formatCode } from "@/lib/qr";
import { getRepo } from "@/lib/repo";

export const metadata = { title: "Verify a jar · Nectara" };

export default async function VerifyHome() {
  await connection();
  const samples = isDemo() ? await demoSamples() : [];
  return (
    <div>
      <h1 className="t-h1">Verify a jar</h1>
      <p className="t-body mt-2 text-ink2">Scan the QR code on the label to see where this honey came from, who handled it, and whether a lab tested it. No account needed.</p>
      <div className="mt-6"><Scanner /></div>
      {samples.length > 0 && (
        <section className="mt-8 rounded-[10px] border border-line bg-panel p-5">
          <h2 className="t-h3">Try a sample code</h2>
          <p className="t-small mt-1 text-ink2">Sample data, showing each state a buyer can see.</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {samples.map((s) => <li key={s.label}><Link className="t-small flex min-h-11 items-center text-amber-ink underline-offset-2 hover:underline" href={`/verify/${s.code}`}>{s.label}</Link></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

async function demoSamples() {
  const repo = await getRepo();
  const code = async (batch: string, token: string) => {
    const b = (await repo.getBatch(batch))!;
    const t = (await repo.listQrForBatch(b.id)).find((x) => x.token === token)!;
    return formatCode(t);
  };
  const valid = await code("HC-2026-00124", "demoValid001");
  return [
    { label: "Valid label (lab test in progress)", code: valid },
    { label: "Revoked label", code: await code("HC-2026-00118", "demoRevoke01") },
    { label: "Copied label (scanned in two cities)", code: await code("HC-2026-00131", "demoClone001") },
    { label: "Tampered signature", code: valid.slice(0, -1) + (valid.endsWith("A") ? "B" : "A") },
  ];
}
