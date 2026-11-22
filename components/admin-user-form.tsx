"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

const input = "mt-1.5 block min-h-11 w-full rounded-[10px] border border-line2 bg-paper px-3 t-body";

export function AdminUserForm({ orgs }: { orgs: { id: string; name: string; kind: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [orgId, setOrgId] = useState(orgs[0]?.id ?? "");
  const role = orgs.find((o) => o.id === orgId)?.kind ?? "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const res = await fetch("/api/admin/users", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), password: f.get("password"), orgId, role }),
    });
    const d = (await res.json().catch(() => null)) as { error?: string; email?: string } | null;
    if (res.ok) { setError(""); setOk(`Created ${d?.email}.`); toast(`User ${d?.email} created.`); form.reset(); router.refresh(); }
    else { setOk(""); setError(d?.error ?? "Could not create user"); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[10px] border border-line bg-paper p-5">
      <h2 className="t-h3">Add a user</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Name<input name="name" required className={input} /></label>
        <label className="block text-sm">Email<input name="email" type="email" required autoComplete="off" className={input} /></label>
        <label className="block text-sm">Organisation
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={input}>{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        </label>
        <label className="block text-sm">Temporary password<input name="password" type="password" minLength={8} required autoComplete="new-password" className={input} /></label>
      </div>
      <p className="text-xs text-ink3">Role follows the organisation: {role.toLowerCase()}.</p>
      {error && <p role="alert" className="text-sm text-terra">{error}</p>}
      {ok && <p className="t-small rounded-[10px] bg-greenbg px-3 py-2 text-green">{ok}</p>}
      <button className={buttonClass("primary", "md")}>Create user</button>
    </form>
  );
}
