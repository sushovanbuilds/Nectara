import { connection } from "next/server";
import { AdminUserForm } from "@/components/admin-user-form";
import { AuditLog } from "@/components/audit-log";
import { Denied } from "@/components/denied";
import { PageHeader } from "@/components/shell/page-header";
import { Chip } from "@/components/ui/chip";
import { ACTIONS, CAPABILITIES, can } from "@/lib/auth/capabilities";
import { currentSession } from "@/lib/auth/guard";
import { fmtDateTime } from "@/lib/format";
import { getRepo } from "@/lib/repo";

export const metadata = { title: "Admin · Nectara" };

const ROLE_LABEL: Record<string, string> = {
  KEEPER: "Honey keeper", COLLECTOR: "Collector", LAB: "Quality lab", PROCESSOR: "Processor", DISTRIBUTOR: "Distributor", INVESTIGATOR: "Investigator", ADMIN: "Admin",
};

export default async function Admin() {
  await connection();
  const s = await currentSession();
  if (!s || !can(s.role, "user:manage")) return <Denied who="administrators" />;
  const repo = await getRepo();
  const orgs = await repo.listOrgs();
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  // Never pass the password hash anywhere near rendering.
  const users = (await repo.listUsers()).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, orgId: u.orgId }));
  const name = new Map(users.map((u) => [u.id, u.name]));
  const audit = (await repo.listAudit()).slice(0, 200).map((a) => ({ id: a.id, action: a.action, target: a.target, actor: name.get(a.actorId) ?? a.actorId, when: fmtDateTime(a.createdAt) }));
  const roles = Object.keys(CAPABILITIES) as (keyof typeof CAPABILITIES)[];
  const th = "px-4 py-2 font-medium";

  return (
    <>
      <PageHeader title="Admin" description="People, what each role may do, and a record of every write." />

      <section aria-labelledby="users-h">
        <h2 id="users-h" className="t-h3">Users and roles</h2>
        <div role="region" aria-label="Users, scrollable" tabIndex={0} className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-paper">
          <table className="t-small w-full min-w-[40rem] text-left">
            <thead className="t-caption text-ink3"><tr className="border-b border-line"><th scope="col" className={th}>Name</th><th scope="col" className={th}>Email</th><th scope="col" className={th}>Role</th><th scope="col" className={th}>Organisation</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td><td className="px-4 py-2.5 text-ink2">{u.email}</td>
                  <td className="px-4 py-2.5"><Chip>{ROLE_LABEL[u.role]}</Chip></td><td className="px-4 py-2.5 text-ink2">{orgName.get(u.orgId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8"><AdminUserForm orgs={orgs.map((o) => ({ id: o.id, name: o.name, kind: o.kind }))} /></div>

      <section aria-labelledby="caps-h" className="mt-10">
        <h2 id="caps-h" className="t-h3">Who can do what</h2>
        <p className="t-caption mt-1 text-ink3">Read-only. This is the single access table every API route checks (lib/auth/capabilities.ts).</p>
        <div role="region" aria-label="Capability matrix, scrollable" tabIndex={0} className="mt-4 overflow-x-auto rounded-[10px] border border-line bg-paper">
          <table className="w-full min-w-[46rem] text-left text-xs">
            <thead><tr className="border-b border-line"><th scope="col" className="p-2.5 font-medium">Action</th>{roles.map((r) => <th key={r} scope="col" className="p-2.5 font-medium">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>
              {ACTIONS.map((a) => (
                <tr key={a} className="border-b border-line last:border-0">
                  <th scope="row" className="p-2.5 font-mono font-normal">{a}</th>
                  {roles.map((r) => <td key={r} className="p-2.5">{can(r, a) ? <span className="text-green">Yes</span> : <span className="text-ink3">–<span className="sr-only">No</span></span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="audit-h" className="mt-10">
        <h2 id="audit-h" className="t-h3">Audit log</h2>
        <div className="mt-4"><AuditLog rows={audit} /></div>
      </section>
    </>
  );
}
