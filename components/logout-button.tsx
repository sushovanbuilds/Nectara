"use client";

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" });
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full load clears the signed-in layout
  window.location.href = "/login";
}

export function LogoutButton({ className = "rounded-md border border-line px-3 py-1 text-ink2 hover:bg-panel", children = "Sign out" }: { className?: string; children?: React.ReactNode }) {
  return <button type="button" className={className} onClick={signOut}>{children}</button>;
}
