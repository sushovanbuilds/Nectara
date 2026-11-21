# Decisions

- Built in a new repo, D:\projects\Nectara; the older HiveTrace app is untouched.
- `screens.html` was not available; tokens come from the brief, layout is a best guess to refine when it arrives.
- Demo mode is on unless `NECTARA_DEMO=false`, so a fresh clone runs with no setup.
- Prisma pinned to 7.10.1 to match `@prisma/client` (npm `latest` resolved a mismatched rc).
- Fonts are `@fontsource-variable` files copied into `app/fonts` and loaded via `next/font/local`.
- Demo state lives on `globalThis`: Next bundles routes and pages separately, so module-level state would not be shared.
- Hand-off event types depend on role (collector COLLECTION, processor PROCESSING, distributor SHIPMENT) because the brief fixes the event type list and has no custody type.
- Case updates use POST, not PATCH, so a test can assert the app exposes no PUT, PATCH or DELETE handler anywhere.
- HiveReading channels are nullable so trust levels can count real sensor channels.
- Trust level 4 means three or more channels plus an inspection within 21 days of the newest reading. It is the app's definition of "verified evidence", not an external verification.
- Accessibility: caption and amber text colours were darkened (`--ink3`, `--amber-ink`, `--amber-btn`) to reach 4.5:1; a test checks the pairs.
- E2E uses the installed Chrome (`channel: "chrome"`) to avoid a browser download.
- Vercel deploy is prepared (postinstall `prisma generate`, README steps) but not performed: it needs the owner's Vercel account and secrets.
- UI redevelopment: kept `--ink3` at #6F685C (brief says #8D8578, which fails 4.5:1 on ivory). Brand `--amber` is used for fills and focus rings; text uses `--amber-ink`.
- `/design` is a public, unlinked, noindex showcase page; full-page screenshots come from `scripts/screenshot.mjs` into `docs/screenshots/`.
- Lighthouse JSON reports live in `docs/qa/`; `docs/QA_REPORT.md` quotes them. Rerun after any deploy, since localhost has no real network latency.
- Phone touch targets are held to 44px by `scripts/breakpoints.mjs`; links inside running text are exempt.
