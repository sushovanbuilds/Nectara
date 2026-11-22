import { afterEach, describe, expect, it } from "vitest";
import { check, clientIp, hit, limitFor, reset, RULES, tooMany } from "@/lib/rate-limit";

const T = 5_000_000;
afterEach(() => { delete process.env.RATE_LIMIT_MULTIPLIER; });

describe("rate limiter", () => {
  it("allows the limit, refuses the next one, and frees up after the window", () => {
    for (let i = 0; i < RULES.ai.limit; i++) expect(hit("ai", "u1", T).ok).toBe(true);
    const blocked = hit("ai", "u1", T + 1_000);
    expect(blocked).toEqual({ ok: false, retryAfter: 59 });
    expect(hit("ai", "u1", T + RULES.ai.windowMs).ok).toBe(true);
  });

  it("keeps buckets and keys apart", () => {
    for (let i = 0; i < RULES.ai.limit; i++) hit("ai", "u2", T);
    expect(hit("ai", "u2", T).ok).toBe(false);
    expect(hit("ai", "u3", T).ok).toBe(true);
    expect(hit("write", "u2", T).ok).toBe(true);
  });

  it("check() never counts, and reset() clears a key", () => {
    for (let i = 0; i < 20; i++) expect(check("login_fail", "a@x|1.2.3.4", T).ok).toBe(true);
    for (let i = 0; i < RULES.login_fail.limit; i++) hit("login_fail", "a@x|1.2.3.4", T);
    expect(check("login_fail", "a@x|1.2.3.4", T)).toMatchObject({ ok: false });
    reset("login_fail", "a@x|1.2.3.4");
    expect(check("login_fail", "a@x|1.2.3.4", T).ok).toBe(true);
  });

  it("lets RATE_LIMIT_MULTIPLIER raise limits but never lower or remove them", () => {
    process.env.RATE_LIMIT_MULTIPLIER = "10";
    expect(limitFor("login_ip")).toBe(100);
    process.env.RATE_LIMIT_MULTIPLIER = "0";
    expect(limitFor("login_ip")).toBe(10);
    process.env.RATE_LIMIT_MULTIPLIER = "nonsense";
    expect(limitFor("login_ip")).toBe(10);
  });

  it("answers 429 with Retry-After and a readable message", async () => {
    const res = tooMany(125, "sign-in attempts");
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("125");
    expect((await res.json()).error).toBe("Too many sign-in attempts. Try again in 3 minutes.");
    expect((await tooMany(30).json()).error).toBe("Too many requests. Try again in 30 seconds.");
  });

  it("reads the client IP from proxy headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
