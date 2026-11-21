import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "demo1234"; // seeded demo accounts only

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/** Short unique suffix so reruns against a long-lived server never collide on lab or certificate references. */
export const unique = () => Date.now().toString(36).toUpperCase();
