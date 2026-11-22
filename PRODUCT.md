# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: Orbix Hackathon 2026 judges.** They evaluate Nectara in a short session, usually on a laptop, often through the public landing page and the demo login. Their job is to judge whether the product works, whether its claims are honest, and whether it solves a real problem. Design decisions are weighed first by how they read to this audience.

Product audiences the demo represents (seven roles, each with its own workspace):

- **Honey buyers**: scan the QR on a jar at `/verify`, with no account, to see origin, journey, lab status and record integrity.
- **Honey keepers (beekeepers)**: use HIVEOS for hive health and log harvests.
- **Collectors, processors, distributors**: record custody hand-offs (COLLECTION, PROCESSING, SHIPMENT events).
- **Quality labs**: publish a certificate bound to one batch. Only the lab role can do this.
- **Investigators**: review risk-scored incident clusters and open cases.
- **Admins**: manage users.

## Product Purpose

Nectara is a honey traceability and smart-beekeeping platform. It exists because buyers cannot tell what is in a jar: the Centre for Science and Environment found 10 of 13 Indian honey brands failed NMR purity testing (Dec 2020). Honest producers compete with syrup-cut honey and cannot prove the difference.

Three capabilities share one sealed batch record:

- **HIVEOS**: a digital twin per hive, classified STABLE / WATCH / STRESSED / CRITICAL, with the reasons, the next action, and a trust ladder for the evidence behind it.
- **TRACE**: every hand-off from hive to shelf written once, in an append-only, hash-chained event log.
- **VERIFY**: an HMAC-signed QR on each jar, with revoke and clone detection.

Success for the hackathon: a judge can run the demo end to end and trust every claim on screen.

## Positioning

Two questions, two kinds of proof, never merged, in code and in UI:

- **"Is the honey genuine?"** Answered only by laboratory evidence: a certificate bound to the one batch it tested. Reuse on another batch is refused and flagged.
- **"Has the record been rewritten?"** Answered only by the cryptographic seal: SHA-256 event hashes rolled into a Merkle root.

Nectara never claims a blockchain proves purity. A risk score orders the investigation queue; it is not a verdict of fraud, and a person reviews every case.

## Operating Context

- Demo mode is on by default (`NECTARA_DEMO` unset or `true`): the whole app runs from in-memory sample data with no database and no internet. Demo accounts share password `demo1234`, shown on the login page in demo mode.
- Database mode uses PostgreSQL via Prisma. It is written and type-checked but has not been run against a live Postgres.
- Sample story: batch HC-2026-00124, hive A-105.
- Public routes: landing page, `/verify`, `/verify/[code]`, `/verify/sample`, `/login`, and an unlinked noindex `/design` showcase.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router, with breaking changes from earlier versions; see `AGENTS.md`), Prisma 7, Playwright e2e.
- The app exposes no PUT, PATCH or DELETE handlers; the event record is append-only.
- Trust level 4 means three or more sensor channels plus an inspection within 21 days of the newest reading. It is the app's own definition of verified evidence, not an external certification.
- Risk score weights: lab results 40, traceability 20, supplier history 15, geo/timeline 15, process/sensor 10. Related alerts cluster within 72 hours.
- The ledger is simulated: Merkle roots are stored in the database and labelled "Simulated ledger". Nothing is written to a public chain.
- Optional AI, built: **Ask Nectara**, a question panel that answers only from the records the signed-in role may read, with numbered citations. Also plain-language summaries of a hive's health (for keepers) and of an incident (for investigators), in English, Bengali or Hindi. It uses free Gemini (first, with embeddings for semantic search) and Groq (fallback) APIs over a custom retrieval layer, `lib/ai`. Without a key it falls back to keyword search over the records. The AI never decides a state, score or verdict; the rule engines do.
- Proposed, not built: ₹1,500 smart-hive kit (target cost), acoustic alerts, Bengali and Hindi voice logging, WhatsApp keeper bot, public-chain anchoring, export and government-scheme bridge.
- Vercel deploy is prepared but not performed.

## Brand Commitments

- Name: Nectara. Line: "Proof in every jar."
- Subsystem names: HIVEOS, TRACE, VERIFY.
- Voice: plain, factual, and candid about limits. Copy states what is built, what is simulated and what is proposed, and never overclaims.
- Indian context: quantities in Indian units (lakh MT), Indian sources (PIB, CSE), and planned Bengali and Hindi support.

## Evidence on Hand

- Statistics with sources, cited in the landing page footer: 1.4 lakh MT natural honey produced in India in 2024, and 1.07 lakh MT exported in FY 2023-24 (PIB, National Beekeeping & Honey Mission fact sheet); 10 of 13 brands failed NMR testing (CSE, Dec 2020, findings disputed by several brands).
- Sample data in `lib/sample` with real computed hashes and Merkle roots.
- Screenshots in `docs/screenshots/`, Lighthouse reports in `docs/qa/`, and `docs/QA_REPORT.md`.
- There are no real customers, testimonials, pilots or partner labs. Future work must not invent them.

## Product Principles

1. **Keep the two proofs apart.** Lab evidence answers purity and the seal answers record integrity. No screen or sentence merges them.
2. **Label honest status everywhere.** The Sample data chip, "Simulated ledger", and the built versus proposed split stay visible and accurate.
3. **Explain every judgement.** Hive states and risk scores show the reasons behind them, and a score is never presented as a verdict.
4. **Run with nothing.** A fresh clone works offline in demo mode, with self-hosted fonts and no setup.
5. **Show the judge the real thing.** Illustrations on public pages use the real engine on sample data, not mock numbers.

## Accessibility & Inclusion

- Text contrast is at least 4.5:1, and a test checks the token pairs. `--ink3`, `--amber-ink` and `--amber-btn` were darkened to pass. Brand `--amber` is used for fills and focus rings only, never for text.
- Phone touch targets are at least 44px, enforced by `scripts/breakpoints.mjs`; links inside running text are exempt.
- Planned Bengali and Hindi voice logging targets keepers who prefer not to type.
