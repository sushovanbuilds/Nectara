# Implementation plan

Audit of 22 November 2026, run against the dev server (demo mode) at 390, 768 and 1440 px, covering 6 public routes and 16 signed-in screens across 5 roles. Baseline before any change: typecheck, lint and build passed, 156 unit tests passed, and 46 Playwright tests passed.

The product is feature-complete for the documented requirements in `PRODUCT.md`. The work was correctness, design-system conformance and polish, not new features.

## P0: Broken behaviour

- [x] **Instant-navigation errors on every data route.** Fixed with a per-segment `loading.tsx` on each of the 14 routes that read request data.
- [x] **Revoking a QR label ran on a single click.** Added an inline confirm step and busy states.

## P1: Drift from DESIGN.md

- [x] **Regular Serif.** `h3` labels and the state chip inside the hive H1 rendered in Fraunces. The base heading rule now sits in `@layer base`, and the chips set Inter explicitly.
- [x] **One Status Language.** The health ring showed Stressed in amber. It now uses Rose Clay for Stressed and solid terracotta for Critical, matching the chips.
- [x] **Radius.** The 14px corners and every 6px (`rounded-md`) corner are now 10px. The chart bars are square.
- [x] **Hairline Rule.** Removed the shadows from the command palette and toasts.
- [x] **Blur.** The app top bar is now solid ivory.
- [x] **Touch targets on phones.** "Record next step", "Seal again" and the footer source links are now 44px or taller. The Seal and Revoke buttons use the shared button component.

## P2: Polish

- [x] The 404 page now has the wordmark linking home.
- [x] The dashboard harvest chart uses HTML bars, so labels stay at caption size.
- [x] The harvest wizard's step labels wrap instead of truncating.
- [x] The site meta description matches the current hero copy.

## Open

- `/design` shows an `sm` button specimen that is 36px tall at phone width. It is a size specimen on an unlinked, noindex page, so it is left as is.
- Database mode and deploying are blocked on the owner. See `BLOCKED.md`.
