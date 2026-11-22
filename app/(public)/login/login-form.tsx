"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";

const input = "mt-1.5 block min-h-12 w-full rounded-[10px] border border-line2 bg-paper px-4 t-body";
const ROLE: Record<string, string> = { KEEPER: "Honey keeper", COLLECTOR: "Collector", LAB: "Quality lab", PROCESSOR: "Processor", DISTRIBUTOR: "Distributor", INVESTIGATOR: "Investigator", ADMIN: "Admin" };

export function LoginForm({ accounts, demoPassword }: { accounts: { email: string; role: string }[]; demoPassword?: string }) {
  const [email, setEmail] = useState(accounts[0]?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pw = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (res.ok) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- router.push + refresh raced and left the user on /login
      window.location.href = "/dashboard";
      return;
    }
    setError(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "Sign-in failed. Check your connection and try again.");
    setBusy(false);
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-5 rounded-[10px] border border-line bg-paper p-5 sm:p-6">
        {demoPassword && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-amber bg-honeybg px-4 py-3">
            <div>
              <p className="t-small font-medium text-amber-ink">Demo password for every account</p>
              <p className="mt-0.5 font-mono text-2xl font-semibold tracking-wider text-ink">{demoPassword}</p>
            </div>
            <button type="button" onClick={() => setPassword(demoPassword)} className={buttonClass("secondary")}>
              {password === demoPassword ? "Filled" : "Fill password"}
            </button>
          </div>
        )}
        <label className="t-body block">Email
          <input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="t-body block">Password
          <input ref={pw} className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="t-small rounded-[10px] bg-terrabg px-3 py-2 text-terra">{error}</p>}
        <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full")}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>

      {accounts.length > 0 && (
        <section aria-labelledby="demo-h" className="mt-6 rounded-[10px] border border-line bg-panel p-5">
          <h2 id="demo-h" className="t-h3">Demo accounts</h2>
          <p className="t-small mt-1 text-ink2">First time here? The <Link href="/tour" className="font-medium text-ink underline underline-offset-4">guided tour</Link> signs you in as each role in turn.</p>
          <p className="t-small mt-1 text-ink2">Sample data. Pick a role to fill in its email and the password <code className="rounded-[10px] bg-honeybg px-1.5 py-0.5 font-mono font-semibold text-ink">{demoPassword}</code>, then press Sign in.</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {accounts.map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => { setEmail(a.email); if (demoPassword) setPassword(demoPassword); pw.current?.form?.querySelector<HTMLButtonElement>("button[type=submit]")?.focus(); }} className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left hover:text-ink">
                  <span className="t-small font-medium">{ROLE[a.role] ?? a.role}</span><span className="t-small truncate text-ink2">{a.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
