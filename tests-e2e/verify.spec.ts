import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("consumer page renders valid, revoked, copied and tampered labels", async ({ page }) => {
  await page.goto("/verify");
  const open = async (name: RegExp) => {
    await page.goto("/verify");
    await page.getByRole("link", { name }).click();
  };

  await open(/Valid label/);
  await expect(page.getByRole("heading", { name: "Label verified" })).toBeVisible();
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Lab evidence" }) })).toContainText("In progress");
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Record seal" }) })).toContainText("Intact");

  await open(/Revoked label/);
  await expect(page.getByRole("heading", { name: "Label revoked" })).toBeVisible();

  await open(/Copied label/);
  await expect(page.getByText("Possible copied label")).toBeVisible();
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Lab evidence" }) })).toContainText("Failed");

  await open(/Tampered signature/);
  await expect(page.getByRole("heading", { name: "Not verified" })).toBeVisible();
  await expect(page.getByText("Harvested")).toHaveCount(0); // a forged label reveals nothing about the batch
});

test("a broken record seal is shown plainly to staff", async ({ page }) => {
  await login(page, "ravi@demo.nectara");
  await page.goto("/batches/HC-2026-00118");
  await expect(page.getByText("Broken: record changed after sealing")).toBeVisible();
  await page.goto("/batches/HC-2026-00124");
  await expect(page.locator("section", { has: page.getByRole("heading", { name: "Record seal" }) })).toContainText("Intact");
  await expect(page.getByText("Simulated ledger")).toBeVisible();
});

test("revoking a label asks first, and keeping it changes nothing", async ({ page }) => {
  await login(page, "admin@demo.nectara");
  await page.goto("/batches/HC-2026-00124");
  await page.getByRole("button", { name: "Revoke label" }).click();
  await expect(page.getByText("will see it as revoked")).toBeVisible();
  await page.getByRole("button", { name: "Keep label" }).click();
  await expect(page.getByRole("button", { name: "Revoke label" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Yes, revoke label" })).toHaveCount(0);
});
