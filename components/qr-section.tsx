import type { QRToken } from "@prisma/client";
import QRCode from "qrcode";
import { formatCode } from "@/lib/qr";
import { QrActions } from "./qr-actions";

export async function QrSection({ batchCode, tokens, baseUrl, canIssue, canRevoke }: {
  batchCode: string; tokens: QRToken[]; baseUrl: string; canIssue: boolean; canRevoke: boolean;
}) {
  const active = tokens.find((t) => !t.revokedAt);
  const url = active ? `${baseUrl}/verify/${formatCode(active)}` : null;
  const svg = url ? await QRCode.toString(url, { type: "svg", margin: 1, width: 160 }) : null;
  return (
    <section className="rounded-[10px] border border-line bg-paper p-5 sm:p-6" aria-labelledby="qr-h">
      <h2 id="qr-h" className="t-h3">QR label</h2>
      {svg && url ? (
        <div className="mt-3 flex items-start gap-4">
          <div role="img" aria-label={`QR code linking to ${url}`} className="shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />
          <p className="min-w-0 text-sm text-ink2">Scan to verify, or open<br /><a className="break-all font-mono text-xs text-amber-ink underline" href={url}>{url}</a></p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink2">No active label{tokens.length > 0 ? " (earlier labels were revoked)" : ""}.</p>
      )}
      {((!active && canIssue) || (active && canRevoke)) && <QrActions batchCode={batchCode} activeToken={active?.token} />}
    </section>
  );
}
