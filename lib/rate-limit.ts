/**
 * Sliding-window rate limits, one named rule per kind of traffic.
 * shortcut: counters live in memory per server process, so they reset on restart and are not shared across
 * instances; move the store to Redis (e.g. Upstash) or Postgres before running more than one instance.
 */

export const RULES = {
  /** Sign-in attempts from one IP address. */
  login_ip: { limit: 10, windowMs: 60_000 },
  /** Failed sign-ins for one account from one IP; cleared by a successful sign-in. */
  login_fail: { limit: 5, windowMs: 15 * 60_000 },
  /** Every authenticated API call, per user. */
  api: { limit: 120, windowMs: 60_000 },
  /** Writes to the record (harvests, steps, lab results, QR, seals, cases), per user. */
  write: { limit: 30, windowMs: 60_000 },
  /** AI answers and summaries, per user: protects the shared free-tier quota. */
  ai: { limit: 8, windowMs: 60_000 },
  /** Public label checks, per IP: each one records a scan and can raise alerts. */
  verify: { limit: 30, windowMs: 60_000 },
} as const;
export type Bucket = keyof typeof RULES;

// For load tests and the e2e suite, which sign in dozens of times a minute from one machine. Can raise limits, never remove them.
const multiplier = () => Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1);
export const limitFor = (b: Bucket) => RULES[b].limit * multiplier();

const g = globalThis as { __nectaraRate?: Map<string, number[]> };
const store = (g.__nectaraRate ??= new Map());

function recent(key: string, windowMs: number, now: number): number[] {
  const list = (store.get(key) ?? []).filter((t: number) => now - t < windowMs);
  if (list.length) store.set(key, list); else store.delete(key);
  return list;
}

// Drop idle keys now and then, so many distinct IPs cannot grow memory without bound.
function sweep(now: number) {
  if (store.size < 5_000) return;
  const longest = Math.max(...Object.values(RULES).map((r) => r.windowMs));
  for (const [k, list] of store) if (!list.length || now - list[list.length - 1] >= longest) store.delete(k);
}

export type Verdict = { ok: true; remaining: number } | { ok: false; retryAfter: number };

/** Counts one request against `bucket` for `key`, or refuses it with the seconds until a slot frees up. */
export function hit(bucket: Bucket, key: string, now = Date.now()): Verdict {
  const { windowMs } = RULES[bucket];
  const limit = limitFor(bucket);
  const k = `${bucket}:${key}`;
  const list = recent(k, windowMs, now);
  if (list.length >= limit) return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - list[0])) / 1000)) };
  list.push(now);
  store.set(k, list);
  sweep(now);
  return { ok: true, remaining: limit - list.length };
}

/** Like `hit` but only checks; nothing is counted. */
export function check(bucket: Bucket, key: string, now = Date.now()): Verdict {
  const { windowMs } = RULES[bucket];
  const limit = limitFor(bucket);
  const list = recent(`${bucket}:${key}`, windowMs, now);
  return list.length >= limit ? { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - list[0])) / 1000)) } : { ok: true, remaining: limit - list.length };
}

export const reset = (bucket: Bucket, key: string) => void store.delete(`${bucket}:${key}`);

const wait = (s: number) => (s < 90 ? `${s} seconds` : `${Math.ceil(s / 60)} minutes`);

/** The 429 every limited route returns: a readable message plus Retry-After. */
export function tooMany(retryAfter: number, what = "requests"): Response {
  return Response.json({ error: `Too many ${what}. Try again in ${wait(retryAfter)}.` }, { status: 429, headers: { "retry-after": String(retryAfter) } });
}

/**
 * Client address for per-IP limits: first x-forwarded-for hop, then x-real-ip.
 * Trust these only behind a proxy that sets them (Vercel, nginx); a directly exposed server can be fed a spoofed header.
 */
export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}
