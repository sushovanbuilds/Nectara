---
name: Nectara
description: Proof in every jar. Honey traceability and smart beekeeping.
colors:
  ivory: "#f6f1e7"
  paper: "#fcfaf5"
  panel: "#efe8da"
  line: "#e2d8c6"
  line2: "#d3c7b1"
  ink: "#1f1d1a"
  ink-hover: "#33302b"
  ink2: "#5f594f"
  ink3: "#6f685c"
  amber: "#b8741a"
  amber-ink: "#8a5410"
  amber-btn: "#94590f"
  honey: "#e3ab52"
  honeybg: "#f6e6c8"
  green: "#4f6b48"
  greenbg: "#e1e8da"
  terra: "#a5432c"
  terrabg: "#f3ded6"
  terra-dark: "#e39a84"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "6rem"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.005em"
rounded:
  control: "10px"
  pill: "9999px"
  device: "44px"
spacing:
  gutter-mobile: "20px"
  gutter: "24px"
  section-mobile: "72px"
  section: "120px"
  container: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ivory}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.panel}"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.terra}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.terrabg}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "24px"
  chip-green:
    backgroundColor: "{colors.greenbg}"
    textColor: "{colors.green}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-amber:
    backgroundColor: "{colors.honeybg}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-terra:
    backgroundColor: "{colors.terrabg}"
    textColor: "{colors.terra}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Nectara

## Overview

**Creative North Star: "The Assay Ledger"**

Nectara looks like a record a careful lab would keep: ruled, dated and plainly stated. Warm ivory paper carries a Fraunces serif for headlines and Inter for everything that has to be read or counted. Hairline rules divide content where other systems would use boxes. Numbers are tabular, so figures line up like entries in a ledger.

The palette is mostly paper and ink. Amber is the brand accent and is used sparingly: fills, focus rings, small numerals and one italic phrase. Status colours are a fixed vocabulary of green, amber and terracotta that always means the same thing on every screen. One charcoal section per page may invert the scheme to set apart the integrity principle.

Components are warm and sturdy. They use solid ink fills, hairline strokes, 10px corners and touch targets of 44px or more. Density is calm on public pages, with generous section padding, and tighter inside the app, where people work through records.

**Key Characteristics:**
- Ivory paper ground, ink text, amber as a rare accent.
- Fraunces at weight 400 for headings; Inter with tabular numerals for body and data.
- Hairline borders and tonal surfaces instead of shadows.
- One status language: green good, amber in progress, terracotta bad, always with a text label.
- Real sample data in illustrations, framed as phone or browser screens.

## Colors

A warm, low-chroma paper palette with one honey-amber accent and a muted three-colour status set.

### Primary
- **Hive Amber** (`amber`): the brand accent. Used for fills, focus rings, dots, arrows and decorative discs. Never used for text on light grounds, where it fails 4.5:1.
- **Deep Comb Amber** (`amber-ink`): amber for text. Used for italic numerals, the brand phrase and amber chip labels.
- **Burnt Amber** (`amber-btn`): the darker amber for any amber-filled control that carries text.
- **Light Honey** (`honey`): a highlight on the charcoal section, where it labels the two kinds of proof.
- **Honey Wash** (`honeybg`): the background for amber chips and the Sample data badge.

### Secondary
- **Field Sage** (`green`) on **Sage Wash** (`greenbg`): good states, such as verified, stable, intact, passed and low risk.
- **Fired Terracotta** (`terra`) on **Clay Wash** (`terrabg`): bad states, such as failed, broken, stressed, critical, high risk and revoked.
- **Rose Clay** (`terra-dark`): terracotta for text on the charcoal section, where `terra` is under 3:1. Also the Stressed segment in the hive health ring, mirroring the Stressed chip (light terracotta) against the solid Critical chip.

### Neutral
- **Ivory** (`ivory`): the page background.
- **Paper** (`paper`): raised surfaces, such as cards, inputs, secondary buttons and alternating sections.
- **Panel** (`panel`): recessed tiles, hover fills and browser chrome.
- **Hairline** (`line`): default dividers and card borders.
- **Strong Hairline** (`line2`): input and secondary-button strokes, and mockup frames.
- **Ink** (`ink`): primary text, primary buttons and the charcoal section. **Ink Hover** (`ink-hover`) is its hover state.
- **Ink 2** (`ink2`): secondary text and nav links.
- **Ink 3** (`ink3`): captions and meta text. It is darker than the original brief's #8D8578, which failed 4.5:1 on ivory.

### Named Rules
**The Amber Ration Rule.** Amber is an accent, not a surface. On light grounds it appears as fills, rings, dots and small numerals. Text in amber always uses `amber-ink`.

**The One Status Language Rule.** Green means good, amber means in progress and terracotta means bad, everywhere. Colour is never the only signal: every status carries its text label.

**The Neutral Data Rule.** Charts that show composition rather than judgement use ink tints and amber only, so no segment reads as good or bad.

## Typography

**Display Font:** Fraunces (with Georgia, serif)
**Body Font:** Inter (with system-ui, sans-serif)

**Character:** A soft, old-style serif speaks with the calm authority of print. A neutral grotesque, set with tabular numerals, makes data read like an exact ledger. Both fonts are variable and self-hosted, so pages render offline.

### Hierarchy
- **Hero** (400, 3.25rem mobile / 6rem desktop, line-height 0.98, -0.025em): the single landing headline.
- **H1** (400, 2.25rem / 3.5rem, 1.06, -0.02em): page titles and the closing brand line.
- **Headline / H2** (400, 1.875rem / 2.5rem, 1.12, -0.015em): section headings, kept to max-w-2xl or max-w-3xl.
- **Title / H3** (400, 1.25rem / 1.5rem, 1.25): sub-headings, role names and hive codes.
- **Body large** (400, 1.0625rem / 1.1875rem, 1.55): lead paragraphs under headings, kept to max-w-xl or max-w-2xl.
- **Body** (400, 1rem, 1.6): running text.
- **Small** (400–500, 0.875rem, 1.5): nav links, eyebrow lines and list labels.
- **Caption** (400, 0.78125rem, 1.45, +0.005em): sources, meta and the "Sample data" note.
- **Mono** (system mono, 11.5–13px): hashes, event types and pipeline steps only.

The type scale switches from mobile to desktop sizes at 768px.

### Named Rules
**The Regular Serif Rule.** Fraunces is set at weight 400 only. Emphasis comes from size and italic, never from bold.

**The Ledger Numerals Rule.** Body text uses tabular numerals throughout, so counts, weights and scores align in columns.

## Layout

- **Container:** at most 1200px, centred, with 20px side gutters on mobile and 24px from 768px.
- **Sections:** 72px vertical padding on mobile and 120px from 768px. Sections alternate between ivory and paper, separated by a top hairline. One charcoal ink section per page is allowed.
- **Grid:** 12 columns with a 24px column gap for split heroes and feature rows, using a 7/5 or 5/7 split on large screens. Content stacks to one column below 1024px.
- **Lists over boxes:** repeated items are rows divided by hairlines (`divide-y` and `border-y`), or columns divided by vertical rules, rather than grids of cards.
- **Rhythm:** about 12px from eyebrow to heading, 16–24px from heading to lead paragraph, and 36–56px from lead to the content block.
- **Breakpoints:** md at 768px for type and padding, lg at 1024px for the grid split and desktop nav.

## Elevation & Depth

The system is flat. Depth comes from tone (ivory, paper and panel) and from 1px hairlines. Shadows are reserved for illustration frames: the phone and browser mockups that show product screens. The sticky landing nav gains an 85% ivory backdrop blur and a bottom hairline after 80px of scroll.

### Shadow Vocabulary
- **Device lift** (`box-shadow: 0 24px 48px -24px rgba(31,29,26,0.35)`): phone mockups only.
- **Screen lift** (`box-shadow: 0 24px 48px -32px rgba(31,29,26,0.3)`): browser mockups only.

### Named Rules
**The Hairline Rule.** Interface surfaces never cast shadows. A card is a 1px `line` border on `paper`. A shadow means "this is a picture of a screen", nothing else.

## Shapes

- **Controls and cards:** gently rounded at 10px. Buttons, inputs, selects, cards, browser frames, dialogs, inline alerts, tiles and nav items all share this radius. There is no smaller radius.
- **Chips, badges and pipeline steps:** fully rounded pills.
- **Status dots:** small circles, 6–16px.
- **Phone frame:** 44px outer corners and 34px inner corners, in ink, with a notch.
- **Decorative form:** one large solid amber disc behind the hero device. There are no other ornamental shapes.

## Components

### Buttons
Warm and sturdy: solid ink, a clear verb label, and a target large enough for a thumb.
- **Shape:** gently rounded (10px).
- **Sizes:** sm is 36px high, md 44px and lg 52px. md and lg meet the 44px touch minimum, so use sm only on desktop toolbars.
- **Primary:** ink fill with ivory text, medium weight. Hover darkens to `ink-hover`. Use one primary button per view.
- **Secondary:** paper fill with a `line2` stroke and ink text. Hover fills with `panel`.
- **Ghost:** text only. Hover fills with `panel`.
- **Danger:** paper fill with a terracotta stroke and terracotta text. Hover fills with `terrabg`. Use it only for destructive actions, such as revoking a QR label, and always behind an inline confirm step.
- **Focus:** a 2px amber outline with 2px offset, applied globally.
- **Disabled:** 50% opacity, with no pointer events.
- **Labels:** verbs, such as "Log harvest". Never "Submit".

### Chips
- **Style:** a pill with a tinted wash, tone-coloured text and a 6px leading dot. 12px medium text, no wrapping.
- **Tones:** green, amber, terracotta or neutral (panel with ink2), mapped from the status word through one shared table.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** `paper` by default, `panel` for recessed tiles, and `ink` (with a #34302a border) on dark sections.
- **Shadow Strategy:** none (see the Hairline Rule).
- **Border:** 1px `line`.
- **Internal Padding:** 20px on mobile and 24px from 640px.

### Inputs / Fields
- **Style:** `paper` fill, 1px `line2` stroke, 10px corners, 44px minimum height and body-size text. The label sits above the field, with 6px between them.
- **Focus:** the global 2px amber outline.

### Navigation
- **Landing:** a sticky header, 64px high on mobile and 72px on desktop. The wordmark sits left; small `ink2` section links sit centre and turn ink on hover; on the right are a text link and a primary button. Below 1024px, a "Menu" text button opens a full-screen native dialog. The dialog lists links as H3 rows divided by hairlines, with stacked lg buttons below.
- **App:** a sidebar, a top bar and a mobile nav, in the same neutrals.

### Device Frames (signature)
Phone and browser mockups present real sample-data screens on public pages. Each has a descriptive `aria-label` and the role "img". The phone may tilt a few degrees and sit in front of the amber disc. The browser frame has a `panel` chrome strip with three `line2` dots and a pill URL.

### Wordmark
"Nectara" set in Fraunces 400 at 24px, in ink on light grounds and ivory on charcoal. No trailing punctuation or accent mark. In the collapsed sidebar it shortens to "N".

### Loading states
- **Skeletons** mirror the real layout of each page type: dashboard, grid, list, detail and form for the app, plus the phone verify result. They use `panel` blocks with 10px corners and a slow pulse, which stops under reduced motion. Each carries a status label, such as "Loading hives".
- **Loader:** for waits with no known shape. A 120px hairline track in `line`, with a 40% `amber` segment running along it (1.1s), above a small `ink2` label. Under reduced motion the segment stands still.

### Ask Nectara panel and summary cards
- **Panel:** a native dialog docked to the right, full height, 28rem wide (full width on phones). It has a hairline `line` left border on `ivory`; the composer sits in a `paper` footer. It opens from an outlined "Ask" button beside Search in the top bar.
- **Answers** are plain text in Inter: paragraphs and bullets, with no markdown styling. Citations show as small superscript `amber-ink` numbers linking to the record. Sources are listed as ledger rows: an italic Fraunces numeral, then the title and its kind.
- **Provenance line:** every AI answer ends with a caption naming the provider and model, the number of records, and "AI can be wrong."
- **Summary card:** a standard card holding a three-way language switch (English, বাংলা, हिन्दी: an ink fill marks the selected option, 44px targets) and a secondary "Write summary" button. Output sits below a hairline.
- No sparkle icons, gradients or "magic" language. The AI is presented as a reader of the record, not an oracle.

### Ledger Rows (signature)
Numbered lists use an italic Fraunces numeral in `amber-ink` (01, 02 or 1, 2), set beside small text, with hairline dividers. Used for problem statements, the trust ladder and role rows.

## Do's and Don'ts

### Do:
- **Do** set every heading in Fraunces 400, and use italic in `amber-ink` for the one emphasised phrase.
- **Do** separate content with 1px `line` hairlines and the ivory, paper and panel tonal steps.
- **Do** use `amber-ink` or `amber-btn` whenever amber carries text, so contrast stays at 4.5:1 or better.
- **Do** keep every tappable control at 44px or more on phones.
- **Do** show status with a chip or dot plus its text label, using the shared tone table.
- **Do** frame product illustrations as phone or browser screens filled with real sample data, and label them.
- **Do** keep motion to the existing set: a 12px, 450ms fade-up with a 60ms stagger, a 600ms arrow draw and a 500ms seal flip. All of them turn off under reduced motion.

### Don't:
- **Don't** put shadows on cards, buttons, inputs or panels. Shadows belong to device frames only.
- **Don't** set text in `amber` (#b8741a) on ivory or paper.
- **Don't** use green or terracotta for anything other than good or bad status.
- **Don't** bold Fraunces or use it for body text.
- **Don't** add a second dark section to a page.
- **Don't** use gradients, glows or glass panels. The only blur is the scrolled nav backdrop.
