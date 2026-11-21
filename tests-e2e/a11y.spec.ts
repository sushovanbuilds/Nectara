import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { login } from "./helpers";

// WCAG 2.2 AA audit with axe on every main screen, at desktop and phone widths.
// Fails on any serious or critical violation; prints everything else so the QA report can quote real numbers.
const PAGES: { who?: string; path: string }[] = [
  { path: "/" }, { path: "/login" }, { path: "/verify" }, { path: "/verify/sample" }, { path: "/design" },
  { who: "ravi", path: "/dashboard" }, { who: "ravi", path: "/hives" }, { who: "ravi", path: "/hives/A-106" },
  { who: "ravi", path: "/batches" }, { who: "ravi", path: "/batches/HC-2026-00118" }, { who: "ravi", path: "/harvests/new" },
  { who: "lab", path: "/lab" }, { who: "processor", path: "/custody" }, { who: "processor", path: "/shipments" },
  { who: "investigator", path: "/risk" }, { who: "investigator", path: "/incidents/inc-1" }, { who: "admin", path: "/admin" },
  { who: "ravi", path: "/lab" }, // permission-denied state
];

async function audit(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target.join(" ") }));
}

for (const width of [1280, 390]) {
  for (const { who, path } of PAGES) {
    test(`axe ${width}px ${who ?? "public"} ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      if (who) await login(page, `${who}@demo.nectara`);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      // Let entrance animations finish so contrast is measured on final colours.
      await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach((e) => e.classList.add("in")));
      await page.waitForTimeout(600);
      const v = await audit(page);
      console.log(`AXE ${width} ${path} ${who ?? "public"}: ${v.length ? JSON.stringify(v) : "0 violations"}`);
      expect(v.filter((x) => x.impact === "serious" || x.impact === "critical"), JSON.stringify(v, null, 1)).toEqual([]);
    });
  }
}

test("keyboard: skip link comes first and focus is visibly ringed", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  const outline = await skip.evaluate((el) => { const s = getComputedStyle(el); return `${s.outlineStyle} ${s.outlineWidth}`; });
  expect(outline).toBe("solid 2px");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});
