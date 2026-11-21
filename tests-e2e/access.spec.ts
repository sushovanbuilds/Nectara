import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("a role cannot open another role's workspace or call its API", async ({ page }) => {
  await login(page, "ravi@demo.nectara");
  await page.goto("/lab");
  // Next also renders a hidden route announcer with role=alert, so match by content.
  await expect(page.getByRole("alert").filter({ hasText: "Not available for your role" })).toBeVisible();
  await page.goto("/risk");
  await expect(page.getByRole("alert").filter({ hasText: "investigators" })).toBeVisible();

  const res = await page.request.post("/api/lab", { data: { batchCode: "HC-2026-00124", labRef: "LAB-X", status: "IN_PROGRESS" } });
  expect(res.status()).toBe(403);
  // The keeper's own navigation does not even offer the lab or admin.
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Hives" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Lab" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Admin" })).toHaveCount(0);
});
