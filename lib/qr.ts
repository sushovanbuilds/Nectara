import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Batch, QRScan, QRToken } from "@prisma/client";

/** QR_SECRET is separate from AUTH_SECRET: leaking a session key must not let anyone mint labels. */
export function qrSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.QR_SECRET;
  if (!s) {
    if (env.NODE_ENV === "production") throw new Error("QR_SECRET is required in production");
    return "dev-only-qr-secret";
  }
  if (env.AUTH_SECRET && env.AUTH_SECRET === s) throw new Error("AUTH_SECRET and QR_SECRET must be different");
  return s;
}

/** 128-bit HMAC over token + batch, so a signature cannot be moved to another batch. */
export const signToken = (token: string, batchId: string, secret = qrSecret()) =>
  createHmac("sha256", secret).update(`${token}:${batchId}`).digest("base64url").slice(0, 22);

export const newToken = () => randomBytes(9).toString("base64url"); // 12 chars

export const formatCode = (t: { token: string; signature: string }) => `${t.token}.${t.signature}`;

export function parseCode(code: string): { token: string; signature: string } | null {
  const m = /^([A-Za-z0-9_-]{12})\.([A-Za-z0-9_-]{22})$/.exec(code.trim());
  return m ? { token: m[1], signature: m[2] } : null;
}

export function sigEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Demo labels: a valid one, a revoked one, and one already scanned in two cities (clone pattern). */
export function demoQrFixtures(batches: Batch[], now = new Date(), secret = qrSecret()): { tokens: QRToken[]; scans: QRScan[] } {
  const mk = (code: string, token: string, revoked: boolean): QRToken => {
    const b = batches.find((x) => x.code === code)!;
    return { id: `qr-${token}`, batchId: b.id, token, signature: signToken(token, b.id, secret), issuedAt: new Date("2026-08-25T00:00:00Z"), revokedAt: revoked ? new Date("2026-08-26T00:00:00Z") : null };
  };
  const tokens = [mk("HC-2026-00124", "demoValid001", false), mk("HC-2026-00118", "demoRevoke01", true), mk("HC-2026-00131", "demoClone001", false)];
  const ago = (m: number) => new Date(now.getTime() - m * 60_000);
  const scans: QRScan[] = [
    { id: "sc-1", tokenId: "qr-demoClone001", city: "Mumbai", scannedAt: ago(40) },
    { id: "sc-2", tokenId: "qr-demoClone001", city: "Delhi", scannedAt: ago(15) },
  ];
  return { tokens, scans };
}
