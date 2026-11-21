// Prints real project counts, so slides and docs quote numbers that can be regenerated.
// Usage: npm run stats
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir, hit, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, hit, out);
    else if (hit(f)) out.push(p);
  }
  return out;
};
const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });

const models = (readFileSync("prisma/schema.prisma", "utf8").match(/^model /gm) ?? []).length;

const routes = walk("app/api", (f) => f === "route.ts");
const handlers = routes.flatMap((r) => [...readFileSync(r, "utf8").matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map((m) => `${m[1]} ${r}`));

const out = join(tmpdir(), "nectara-vitest.json");
run(`npx vitest run --reporter=json --outputFile="${out}"`);
const vitest = JSON.parse(readFileSync(out, "utf8"));
const e2e = Number(run("npx playwright test --list").match(/Total: (\d+) test/)?.[1] ?? 0);

console.log(`Prisma models:            ${models}`);
console.log(`API route files:          ${routes.length}`);
console.log(`API handlers (verb+path): ${handlers.length}`);
console.log(`Unit/route tests:         ${vitest.numTotalTests} (${vitest.numPassedTests} passed, ${vitest.numFailedTests} failed) in ${vitest.testResults.length} files`);
console.log(`End-to-end tests:         ${e2e}`);
