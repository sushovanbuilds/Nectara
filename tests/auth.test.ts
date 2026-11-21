import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import { ACTIONS, can, CAPABILITIES } from "@/lib/auth/capabilities";
import { authSecret, signSession, verifySession, type Session } from "@/lib/auth/session";
import { decide } from "@/lib/auth/guard";
import { demoRepo } from "@/lib/repo/demo";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD } from "@/lib/sample";

const ROLES = Object.keys(CAPABILITIES) as Role[];
const as = (role: Role): Session => ({ uid: role, role, name: role, orgId: "org", exp: 9e9 });

describe("capability table", () => {
  // Each role: allowed exactly its own actions, blocked from every other role's exclusive actions.
  for (const role of ROLES) {
    it(`${role} is blocked from actions it does not own`, () => {
      for (const action of ACTIONS) {
        const expected = CAPABILITIES[role].includes(action);
        expect(decide(as(role), action)).toBe(expected ? 200 : 403);
      }
    });
  }
  it("only LAB can publish purity evidence", () => {
    expect(ROLES.filter((r) => can(r, "lab:publish"))).toEqual(["LAB"]);
  });
  it("only PROCESSOR can issue QR labels, only ADMIN can read the audit log", () => {
    expect(ROLES.filter((r) => can(r, "qr:issue"))).toEqual(["PROCESSOR"]);
    expect(ROLES.filter((r) => can(r, "audit:read"))).toEqual(["ADMIN"]);
  });
  it("signed-out requests get 401", () => expect(decide(null, "batch:read")).toBe(401));
});

describe("session cookie", () => {
  it("round-trips and rejects tampering, wrong secret and expiry", () => {
    const tok = signSession(as("KEEPER"), "s1");
    expect(verifySession(tok, "s1")?.role).toBe("KEEPER");
    const [body, sig] = tok.split(".");
    const forged = Buffer.from(JSON.stringify({ ...as("ADMIN") })).toString("base64url");
    expect(verifySession(`${forged}.${sig}`, "s1")).toBeNull();
    expect(verifySession(tok, "other")).toBeNull();
    expect(verifySession(`${body}.`, "s1")).toBeNull();
    expect(verifySession(signSession({ ...as("KEEPER"), exp: 10 }, "s1"), "s1", 11)).toBeNull();
  });
  it("requires AUTH_SECRET in production and keeps it separate from QR_SECRET", () => {
    expect(() => authSecret({ NODE_ENV: "production" })).toThrow();
    expect(() => authSecret({ AUTH_SECRET: "x", QR_SECRET: "x" })).toThrow();
    expect(authSecret({ AUTH_SECRET: "a", QR_SECRET: "b" })).toBe("a");
  });
});

describe("demo accounts and audit", () => {
  it("every role has a demo account that verifies with the demo password", async () => {
    for (const role of ROLES) {
      const u = await demoRepo.findUserByEmail(`${role.toLowerCase()}@demo.nectara`) ?? (role === "KEEPER" ? await demoRepo.findUserByEmail("ravi@demo.nectara") : null);
      expect(u?.role).toBe(role);
      expect(await bcrypt.compare(DEMO_PASSWORD, u!.passwordHash)).toBe(true);
      expect(await bcrypt.compare("wrong", u!.passwordHash)).toBe(false);
    }
  });
  it("records audit entries, newest first", async () => {
    await demoRepo.writeAudit({ actorId: "u-ravi", action: "auth.login", target: "ravi@demo.nectara" });
    await demoRepo.writeAudit({ actorId: "u-ravi", action: "auth.logout", target: "u-ravi" });
    expect((await demoRepo.listAudit())[0].action).toBe("auth.logout");
  });
});
