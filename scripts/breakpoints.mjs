// Breakpoint sweep: every main page at 360, 390, 768, 1024 and 1440px.
// Reports horizontal overflow and, at phone widths, interactive targets under 44px (inline text links excluded).
// Usage: node scripts/breakpoints.mjs http://localhost:3111
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3111";
const WIDTHS = [360, 390, 768, 1024, 1440];
const PAGES = [
  [null, "/"], [null, "/login"], [null, "/verify"], [null, "/verify/sample"],
  ["ravi", "/dashboard"], ["ravi", "/hives"], ["ravi", "/hives/A-106"], ["ravi", "/batches"], ["ravi", "/batches/HC-2026-00118"], ["ravi", "/harvests/new"],
  ["lab", "/lab"], ["processor", "/custody"], ["processor", "/shipments"], ["investigator", "/risk"], ["investigator", "/incidents/inc-1"], ["admin", "/admin"],
];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
const rows = [];
for (const width of WIDTHS) {
  for (const [who, path] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    if (who) await ctx.request.post(`${base}/api/auth/login`, { data: { email: `${who}@demo.nectara`, password: "demo1234" } });
    const page = await ctx.newPage();
    await page.goto(base + path, { waitUntil: "networkidle" });
    const r = await page.evaluate((phone) => {
      const overflow = document.documentElement.scrollWidth - innerWidth;
      const small = [];
      if (phone) {
        for (const el of document.querySelectorAll("a, button, input, select, textarea, summary, [role=switch]")) {
          const b = el.getBoundingClientRect();
          if (!b.width || !b.height || getComputedStyle(el).visibility === "hidden") continue;
          if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue; // links inside running text
          if (el.closest(".sr-only") || el.classList.contains("sr-only")) continue;
          if (el.type === "radio" || el.type === "checkbox") continue; // the whole label is the target
          if (b.height < 44) small.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.type || "").trim().slice(0, 24)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
        }
      }
      return { overflow, small };
    }, width <= 390);
    rows.push({ width, path, who: who ?? "public", ...r });
    await ctx.close();
  }
}
await browser.close();

const bad = rows.filter((r) => r.overflow > 0);
console.log(`Checked ${rows.length} page/width combinations.`);
console.log(`Horizontal overflow: ${bad.length ? bad.map((r) => `${r.width} ${r.path} +${r.overflow}px`).join("; ") : "none"}`);
const small = rows.filter((r) => r.small.length);
console.log(`Phone targets under 44px: ${small.reduce((t, r) => t + r.small.length, 0)} across ${small.length} page/width combinations`);
for (const r of small.filter((x) => x.width === 390)) console.log(`  ${r.path} (${r.who}): ${[...new Set(r.small)].slice(0, 6).join(" | ")}`);
