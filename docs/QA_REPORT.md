# Nectara QA report

Stage 7 of the UI redevelopment. Every number below was measured on a local production build (`next build` then `next start`, demo mode) on 21 Nov 2026, using the installed Chrome. Rerun with the commands in each section.

## Summary

| Check | Result |
|---|---|
| Lighthouse, landing, mobile | Performance 99 · Accessibility 100 · Best practices 100 · SEO 100 |
| Lighthouse, landing, desktop | Performance 100 · Accessibility 100 · Best practices 100 · SEO 100 |
| Lighthouse, verify result, mobile | Performance 100 · Accessibility 100 · Best practices 100 · SEO 63 (by design, see below) |
| Lighthouse, verify result, desktop | Performance 100 · Accessibility 100 · Best practices 100 · SEO 63 (by design) |
| Largest Contentful Paint | Landing 0.9 s mobile, 0.2 s desktop. Verify 0.8 s mobile, 0.2 s desktop. Target < 2.5 s. |
| Layout shift (CLS) | 0 on all four runs |
| axe, WCAG 2.2 AA rules | 0 violations on 36 checks (18 screens × 1280 px and 390 px) |
| Breakpoints 360 / 390 / 768 / 1024 / 1440 | 80 page-width combinations, no horizontal overflow |
| Touch targets on phones (≥ 44 px) | 0 under 44 px after fixes (73 before) |
| External network requests | 0 on landing and verify (fonts and icons are self-hosted) |
| Unit and route tests | 156 passed, 0 failed, in 12 files |
| End-to-end tests | 46 passed: 9 product flows, 36 axe audits, 1 keyboard check |

Project facts from `npm run stats`: 24 Prisma models, 19 API route handlers, 156 unit and route tests, 46 end-to-end tests.

## Lighthouse

Command (per page and mode; JSON reports are in `docs/qa/`):

```
npx lighthouse <url> [--preset=desktop] --only-categories=performance,accessibility,best-practices,seo
```

- **Verify result SEO 63.** The only failed audit is "Page is blocked from indexing". Each verify link is one person's scan of one label, so it is marked `noindex` and disallowed in `robots.txt` on purpose. The `/verify` scanner page itself is indexable.
- **Landing opportunities Lighthouse lists** (none affect the score materially): about 27 KiB of unused JavaScript and 14 KiB of legacy-JS polyfills from the framework bundle, and a 30 ms render-blocking CSS estimate. Max potential first input delay is 160 ms on throttled mobile.
- **Caveat:** these runs are on localhost with no network latency beyond Lighthouse's simulated throttling. A deployed host adds real latency, so expect lower performance numbers there and re-measure after deploying.

## Accessibility

- `tests-e2e/a11y.spec.ts` runs axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) on landing, login, verify home, a verify result, the design page and every signed-in workspace, plus the permission-denied state, at 1280 px and 390 px. It fails on any serious or critical violation and logs the rest. Result: 0 violations of any impact.
- Keyboard: a test confirms the skip link is the first Tab stop, is visible when focused, has a 2 px solid focus ring, and moves focus to the main content. Earlier tests cover the command palette by keyboard alone and the full sign-in to log-harvest flow.
- Colour contrast: `tests/contrast.test.ts` checks 21 token pairs at ≥ 4.5:1, including chips, captions, buttons and text on the charcoal section.
- **What automated checks cannot prove:** screen-reader experience end to end (not tested with NVDA, JAWS or VoiceOver), and cognitive clarity. axe catches roughly a third to a half of WCAG issues; a manual screen-reader pass is still recommended before real users.

## Breakpoints and touch targets

`node scripts/breakpoints.mjs http://localhost:3111` loads 16 screens across roles at 360, 390, 768, 1024 and 1440 px.

- Horizontal overflow: none in 80 combinations. (Stage 6 found and fixed one: screen-reader-only labels escaping the admin table's scroll box.)
- Touch targets under 44 px at phone widths: 73 found, all fixed. They were the wordmark home link, range sliders, footer links, the risk page's "Why this score" toggles, the Take custody button, and list links on the lab and incident pages. Links inside running text are excluded, as WCAG allows.

## Copy honesty check

Every line containing a number on the rendered landing page, and where it comes from:

| Copy | Status |
|---|---|
| 1.4 lakh MT produced in 2024; 1.07 lakh MT exported in FY 2023-24 | Sourced and linked: PIB fact sheet, National Beekeeping & Honey Mission |
| 10 of 13 brands failed NMR; dot row Failed 10, Passed 3 | Sourced and linked: Centre for Science and Environment, Dec 2020. The page notes that several brands disputed it. |
| Phone mockup: HC-2026-00124, LAB-2026-441, 21–22 Aug | Sample data, labelled on the mockup |
| Event log excerpt and hashes | Real hashes of sample batch HC-2026-00124, labelled sample data |
| Merkle root in the seal flip | Real root of the sample batch. The flip is labelled "Illustration. Nothing is changed." The ledger is labelled simulated. |
| HIVEOS frame: 35°C, 57%, 0.85, 43 dB, health 100/100, trust level 4 | Real engine output for sample hive A-105, labelled sample data |
| Healthy ranges 33–36°C, 50–65% | The app's rule thresholds. Not sourced; the README says a beekeeping lead should review them. |
| What-if +3°C for 5 days → 78/100 | Real simulator on sample data, labelled "Illustration" |
| Risk weights 40 / 20 / 15 / 15 / 10, 72-hour clustering | The app's own rules, as implemented in `lib/risk.ts` and `lib/incidents.ts` |
| ₹1,500 smart-hive kit | Listed under "Proposed: not built" as a target cost. No source; confirm it is the team's own estimate. |
| "Works offline in demo mode" | Verified: 0 external requests on landing and verify. The app still needs its own server running. |

Not found anywhere in the product: testimonials, partner logos, user counts or uncited statistics.

## Known gaps

- Screen-reader testing by a person has not been done.
- Lighthouse was not run on signed-in screens (they need a session; axe covered them instead).
- Offline use shows a banner and keeps harvest drafts, but other writes are not queued.
- The healthy ranges and the ₹1,500 figure are unsourced, as noted above.
