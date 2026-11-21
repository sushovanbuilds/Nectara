import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("command palette jumps to a batch by keyboard", async ({ page }) => {
  await login(page, "ravi@demo.nectara");
  await page.keyboard.press("Control+k");
  const search = page.getByRole("combobox", { name: "Search" });
  await expect(search).toBeFocused();
  await search.fill("00118");
  await expect(page.getByRole("option", { name: /HC-2026-00118/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/batches\/HC-2026-00118$/);
  // Breadcrumb reflects where we are.
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("HC-2026-00118");
});

test("palette only offers what the role can open", async ({ page }) => {
  await login(page, "lab@demo.nectara");
  await page.getByRole("button", { name: /Search/ }).click();
  await expect(page.getByRole("option", { name: "Lab" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Hives" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox", { name: "Search" })).toBeHidden();
});

test("phones get a bottom tab bar with a More sheet", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "ravi@demo.nectara");
  const tabs = page.getByRole("navigation", { name: "Primary" });
  await expect(tabs.getByRole("link", { name: "Hives" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  await tabs.getByRole("button", { name: "More" }).click();
  const sheet = page.getByRole("dialog", { name: "All pages" });
  await expect(sheet.getByRole("link", { name: "Verify a jar" })).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Sign out" })).toBeVisible();
});
