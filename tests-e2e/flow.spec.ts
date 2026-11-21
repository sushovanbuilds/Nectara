import { expect, test } from "@playwright/test";
import { login, unique } from "./helpers";

test("keeper harvest -> lab result -> processor QR -> consumer verify", async ({ browser }) => {
  const id = unique();

  // 1. Keeper records a harvest and gets a new batch.
  const keeper = await (await browser.newContext()).newPage();
  await login(keeper, "ravi@demo.nectara");
  await keeper.goto("/harvests/new");
  await keeper.getByRole("radio", { name: /A-105/ }).check();
  await keeper.getByRole("button", { name: "Next" }).click();
  await keeper.getByRole("button", { name: "Next" }).click(); // empty quantity is caught inline
  await expect(keeper.getByText("Enter the quantity in kilograms")).toBeVisible();
  await keeper.getByLabel("Quantity (kg)").fill("25");
  await keeper.getByRole("button", { name: "Next" }).click();
  await keeper.getByLabel("Main flower source").fill("Mustard");
  await keeper.getByLabel("Honey type").fill("Mustard honey");
  await keeper.getByRole("button", { name: "Next" }).click();
  await expect(keeper.getByText("25 kg")).toBeVisible();
  await keeper.getByRole("button", { name: "Log harvest" }).click();
  await keeper.waitForURL(/\/batches\/HC-\d{4}-\d{5}$/);
  const code = keeper.url().split("/").pop()!;
  await expect(keeper.getByRole("heading", { name: code, level: 1 })).toBeVisible();

  // 2. Quality lab publishes a passing result bound to this batch.
  const lab = await (await browser.newContext()).newPage();
  await login(lab, "lab@demo.nectara");
  await lab.goto("/lab");
  await lab.locator('select[name="batchCode"]').selectOption(code);
  await lab.getByLabel("Lab reference").fill(`LAB-E2E-${id}`);
  await lab.getByLabel("Certificate reference").fill(`CERT-E2E-${id}`);
  await lab.getByLabel("Moisture (%)").fill("17.5");
  await lab.getByRole("button", { name: "Publish result" }).click();
  await expect(lab.getByText(`Saved LAB-E2E-${id}`)).toBeVisible();

  // 3. Processor takes custody, then issues the QR label.
  const proc = await (await browser.newContext()).newPage();
  await login(proc, "processor@demo.nectara");
  await proc.goto(`/batches/${code}`);
  await proc.getByRole("button", { name: "Take custody" }).click();
  await proc.getByRole("button", { name: "Issue QR label" }).click();
  const link = proc.locator('a[href*="/verify/"]');
  await expect(link).toBeVisible();
  const verifyUrl = (await link.getAttribute("href"))!;

  // 4. A consumer with no account scans it.
  const consumer = await (await browser.newContext()).newPage();
  await consumer.goto(verifyUrl);
  await expect(consumer.getByRole("heading", { name: "Label verified" })).toBeVisible();
  await expect(consumer.getByText(`Batch ${code}`)).toBeVisible();

  // Lab evidence and record seal are two separate cards that answer two separate questions.
  const labCard = consumer.locator("section", { has: consumer.getByRole("heading", { name: "Lab evidence" }) });
  const sealCard = consumer.locator("section", { has: consumer.getByRole("heading", { name: "Record seal" }) });
  await expect(labCard).toContainText("Passed");
  await expect(labCard).toContainText(`LAB-E2E-${id}`);
  await expect(sealCard).toContainText("Not sealed yet");
  await expect(sealCard).not.toContainText("Passed");
  await expect(consumer.getByRole("heading", { name: "Journey" })).toBeVisible();
});
