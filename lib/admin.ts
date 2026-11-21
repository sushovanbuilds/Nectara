import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import { CAPABILITIES } from "./auth/capabilities";
import type { Repository } from "./repo/types";
import { TraceError } from "./trace";

export type PublicUser = Omit<User, "passwordHash">;

/** Admin creates an account. The organisation's kind must match the role, so a lab login cannot sit in a processor's org. */
export async function createUser(repo: Repository, input: Record<string, unknown>): Promise<PublicUser> {
  const str = (v: unknown, n: string) => { if (typeof v !== "string" || !v.trim()) throw new TraceError(400, `${n} is required`); return v.trim(); };
  const email = str(input.email, "email").toLowerCase();
  const name = str(input.name, "name");
  const password = str(input.password, "password");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new TraceError(400, "email is not valid");
  if (password.length < 8) throw new TraceError(400, "password must be at least 8 characters");
  const role = input.role as Role;
  if (!(role in CAPABILITIES)) throw new TraceError(400, "Unknown role");
  const org = (await repo.listOrgs()).find((o) => o.id === input.orgId);
  if (!org) throw new TraceError(404, "Organisation not found");
  if (org.kind !== role) throw new TraceError(422, `${org.name} is a ${org.kind.toLowerCase()} organisation; it cannot hold a ${role.toLowerCase()} user`);
  if (await repo.findUserByEmail(email)) throw new TraceError(409, "A user with that email already exists");

  const user: User = { id: `u-${randomUUID().slice(0, 8)}`, email, name, role, orgId: org.id, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date() };
  await repo.insertUser(user);
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}
