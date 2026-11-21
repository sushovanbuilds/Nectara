import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("investigator runs the engine, reviews a cluster and works a case", async ({ page }) => {
  await login(page, "investigator@demo.nectara");
  await page.goto("/risk");
  await expect(page.getByText("not a verdict of fraud")).toBeVisible();

  await page.getByRole("button", { name: "Run risk engine" }).click();
  await expect(page.getByText(/Scored \d+ batches/).first()).toBeVisible();

  // Every score can be expanded into point-by-point reasons.
  await page.getByText(/Why this score/).first().click();
  await expect(page.getByText(/Not evaluated:/).first()).toBeVisible();

  await page.getByRole("link", { name: /Himalayan Honey Lab/ }).click();
  await expect(page.getByRole("heading", { name: "Alerts in this cluster" })).toBeVisible();

  await page.getByRole("button", { name: "Open a case" }).click();
  await page.getByLabel("Add a note").fill("Called the lab to confirm certificate numbers.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Called the lab to confirm certificate numbers.")).toBeVisible();

  await page.getByLabel("Status").selectOption("IN_REVIEW");
  await expect(page.getByLabel("Status")).toHaveValue("IN_REVIEW");
});
