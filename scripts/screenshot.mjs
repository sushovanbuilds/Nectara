// Full-page screenshots at the breakpoints the brief asks for.
// Set LOGIN=<email> to capture signed-in pages with the demo password.
// Usage: node scripts/screenshot.mjs <baseUrl> <name> <path-without-leading-slash> [widths...]
import { chromium } from "@playwright/test";

const [base, name, path, ...w] = process.argv.slice(2);
const widths = w.length ? w.map(Number) : [390, 1440];
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  if (process.env.LOGIN) await ctx.request.post(`${base}/api/auth/login`, { data: { email: process.env.LOGIN, password: "demo1234" } });
  const page = await ctx.newPage();
  await page.goto(`${base}/${path.replace(/^\/+/, "")}`, { waitUntil: "networkidle" });
  // Scroll through once so scroll-triggered pieces (draw-in arrows) render before the full-page capture.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  const out = `docs/screenshots/${name}-${width}.png`;
  await page.screenshot({ path: out, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(`${out}  overflow=${overflow}px`);
  await ctx.close();
}
await browser.close();
