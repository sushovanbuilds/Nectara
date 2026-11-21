import { isDemo } from "@/lib/demo";
import { DEMO_PASSWORD, sample } from "@/lib/sample";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Nectara" };

export default function LoginPage() {
  const demo = isDemo();
  return (
    <div>
      <h1 className="t-h1">Sign in</h1>
      <p className="t-body mt-2 text-ink2">For keepers, labs, processors, distributors, investigators and admins. Buyers don’t need an account to verify a jar.</p>
      <div className="mt-6">
        <LoginForm accounts={demo ? sample.users.map((u) => ({ email: u.email, role: u.role })) : []} demoPassword={demo ? DEMO_PASSWORD : undefined} />
      </div>
    </div>
  );
}
