import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "@prisma/client";

export const COOKIE = "nectara_session";
export const SESSION_SECONDS = 8 * 60 * 60;

export interface Session {
  uid: string;
  role: Role;
  name: string;
  orgId: string;
  exp: number; // unix seconds
}

/** AUTH_SECRET is required in production and must differ from QR_SECRET. Dev falls back to a fixed value. */
export function authSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.AUTH_SECRET;
  if (!s) {
    if (env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
    return "dev-only-auth-secret";
  }
  if (env.QR_SECRET && env.QR_SECRET === s) throw new Error("AUTH_SECRET and QR_SECRET must be different");
  return s;
}

const mac = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function signSession(s: Session, secret = authSecret()): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${mac(body, secret)}`;
}

/** Returns the session, or null for a bad signature, malformed token or expired session. */
export function verifySession(token: string | undefined, secret = authSecret(), now = Date.now() / 1000): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(mac(body, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    return s.exp > now ? s : null;
  } catch {
    return null;
  }
}
