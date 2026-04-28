# Mineral Risk Analytics — Design System

> Premium editorial register applied to a critical-minerals supply-chain
> intelligence platform. The Economist meets a Bloomberg terminal — wine
> backgrounds, terracotta accents, stone surfaces, an MRa "element tile"
> wordmark, and a serif/sans pairing tuned for long-form analysis.

---

## Index

```
README.md ........................ this file (start here)
SKILL.md ......................... Claude Code skill manifest
colors_and_type.css .............. CSS variables for color, type, spacing
fonts/ ........................... webfonts (Source Serif 4, Inter, JetBrains Mono)
assets/
  logo-mra-dark.svg .............. nav-bar logo (wine fill, terracotta border)
  logo-mra-terracotta.svg ........ standalone / favicon variant
  logo-mra-outline.svg ........... light-bg / email variant
  gradient-bar.svg ............... top-of-nav decorative stripe
  flag-cn.svg, flag-drc.svg ...... country flag SVGs (twemoji)
preview/ ......................... design-system review cards (auto-rendered)
ui_kits/
  intelligence_hub/ .............. PUBLIC-FACING editorial site (Wine + Stone)
  admin_console/ ................. INTERNAL data tools (light/stone, dashboard)
slides/ .......................... (none — no deck templates were provided)
```

---

## Sources

- **Codebase:** `battery-data-intelligence-frontend/` — Next.js 15 + Tailwind +
  shadcn/ui (Radix primitives) + lucide-react, currently styled in shadcn
  default light/blue. The brand redesign documented here is being applied
  on top of that scaffold.
- **Design brief:** `battery-data-intelligence-frontend/INTELLIGENCE_HUB_DESIGN_BRIEF.md`
  — the partner-facing brief describing the rebrand from "Battery Data
  Intelligence" → **Mineral Risk Analytics**, the Wine+Stone palette, the
  MRa periodic-tile logo, and Layout Option C (content-type tabs).
- **Wireframe screenshots:** `uploads/Screenshot 2026-04-27 at 3.22.{11,34}.png`
  + `3.23.04 PM.png` — Cowork session wireframes showing the chosen Wine+Stone
  theme on the Intelligence Hub layout, plus the three logo treatments.

> **Status:** Most decisions in the brief are tagged `[PENDING]` partner
> review. This design system codifies the working direction so we can
> prototype against it; everything is reversible.

---

## Products

### 1. Intelligence Hub (public, content-first)
The MVP. A public-facing editorial site that publishes Analysis, Signal,
Report, and News posts on critical-mineral supply-chain risk — written
through a regulatory/policy lens (IRA, FEOC, EU CRMA). Visual register:
deep wine surfaces, terracotta accents, stone (warm cream) cards, serif
display, sans body. Acts as the lead-gen surface for the broader risk
engine. **This is where the brand lives most loudly.**

### 2. Admin Console (internal, data-first)
The existing Next.js dashboard that lets the team browse companies,
chemistries, market scores, and the underlying scoring data. Light surfaces,
shadcn/ui density, tables-and-badges UX. Brand presence is restrained — wine
sidebar + terracotta accents only — so the data stays readable.

---

## Brand

- **Name:** Mineral Risk Analytics (working; pending partner sign-off)
- **Tagline:** *Supply Chain Intelligence*
- **Logo:** **MRa** in a periodic-table element tile, atomic number 83 in the
  top-left corner, "Mineral Risk" / "Analytics" stacked beneath the glyph.
  Three color treatments — see `assets/logo-*.svg`.
- **Voice:** authoritative, editorial, regulatory-fluent. Not chatty, not
  breathless, not VC-pitch — see CONTENT FUNDAMENTALS below.

---

## CONTENT FUNDAMENTALS

### Voice & register
The Intelligence Hub reads like a **policy desk**, not a marketing site or a
trader chat. Sentences are full, declarative, and sourced. Headlines lead
with the subject (a country, a material, a regulation), then the verb. The
partner is a regulatory/policy expert; the writing should feel like an
analyst memo, not a press release.

- **Person:** Third-person and impersonal. We do not say "we" or "our
  view". The byline carries the voice; the prose is institutional. Reader
  is addressed implicitly, never with "you".
- **Tense:** Present and present-perfect for status; past for events;
  future-conditional ("would", "is expected to") for forecasts.
- **Casing:** **Sentence case** for all UI labels, navigation, and most
  headlines. Title case ONLY for proper nouns and the four content-type
  badges (`Analysis`, `Signal`, `Report`, `News`). Acronyms uppercase
  (IRA, FEOC, CRMA, DOE, HHI, DRC).
- **Numerals:** Numbers spelled out under ten, digits at ten and above —
  except in data callouts, percentages, ISO codes, and dates, which are
  always digits.
- **Dashes:** En dash (`–`) for ranges; em dash (`—`) with hair spaces for
  asides. Hyphens for compound modifiers (`supply-chain risk`, not
  `supply chain risk` when used as an adjective).
- **Dates:** `Apr 17`, `Apr 21 · 7 min` (read time appended with a middle
  dot). Quarterly references as `Q1 2026`.
- **Geography:** ISO-2 country codes in tags (`CN`, `DRC`, `CL`, `ID`,
  `AU`). Spell out on first reference in body text.
- **Materials:** Always capitalised when used as taxonomy tags
  (`Lithium`, `Cobalt`, `Graphite`, `Nickel`, `Manganese`).

### Headline patterns (specimens)

> *China graphite export licensing — supply chain exposure report Q1 2026*
> *IRA Section 30D FEOC guidance update — what the April revision changes for processing eligibility*
> *DRC artisanal mining production estimates revised — HHI concentration implications for cathode supply*
> *Indonesia HPAL processing expansion — trade exposure shifts and FEOC-adjacent sourcing implications*

Pattern: `<subject> — <implication>`. The em-dash separates "what
happened" from "why it matters". Read-time and date appear in the row
metadata, not the headline.

### Body voice (specimen)

> The April 17 revision to the FEOC interim guidance narrows the
> "qualifying processing step" definition for graphite, with material
> implications for sourcing strategies that rely on Chinese-origin
> spheronisation. Three pathways remain compliant under the revised
> rule; this analysis walks through each, with examples drawn from
> announced 2025–2027 cathode programs.

Notes: leads with a specific date, names the regulatory artefact, then
states the implication in plain language. Avoids "game-changing", "huge",
"breaking" — that register belongs to other publications.

### Tone — what to avoid
- **No marketing tone.** "Unlock", "transform", "leverage", "empower",
  "next-gen", "revolutionary" are banned.
- **No emoji anywhere.** Not in body, not in nav, not in CTAs.
- **No exclamation marks** outside genuine quoted material.
- **No first-person plural** ("we", "our team", "our analysts").
- **No second-person imperative** beyond functional CTAs (`Subscribe`,
  `Download PDF`).
- **No casing tricks.** No `ALL CAPS` for emphasis; use italics in body
  and the dedicated badge styles in UI.

### CTA copywriting
Two-word maximum where possible. `Subscribe`, `Download PDF`,
`Read analysis`, `View report`, `Browse intelligence`. Arrows (`→`) are
allowed at the end of inline links (`Download PDF →`).

---

## VISUAL FOUNDATIONS

### Palette
**Wine + Stone** (Theme 3). Two surface families: deep wine for
authoritative chrome (nav, hero report card, footers), warm stone for
content cards. Terracotta is the single accent — used for CTAs, active
states, links, and one featured-card border. Risk semantics
(red/amber/green) are reserved for data, never for brand chrome.

| Token | Hex | Role |
|---|---|---|
| `--wine-darkest` | `#3A0F14` | Top nav, deepest surfaces |
| `--wine-dark` | `#4A1419` | Subnav, tab strip |
| `--wine-mid` | `#5A1A20` | Badge bg (Analysis, Signal) |
| `--wine-light` | `#6E2530` | Hover surfaces on dark, card borders on dark |
| `--cream` | `#F0E6DE` | Text on wine, headings on dark |
| `--cream-muted` | `#9E7B72` | Secondary nav, metadata on dark |
| `--terracotta` | `#C8623A` | CTAs, active tab, links, featured borders |
| `--terracotta-light` | `#D98060` | Hover terracotta |
| `--stone` | `#FAF3EC` | Page bg, card surface |
| `--stone-mid` | `#F2E8DE` | Sidebar fills, deeper card surface |
| `--ink` | `#4A1419` | Primary text on stone (we re-use wine-dark) |
| `--ink-muted` | `#6B544D` | Secondary text on stone |
| `--rule` | `#E5D4C5` | Hairline borders on stone |

Risk semantics (do not re-skin):
`--risk-high #E24B4A` · `--risk-med #EF9F27` · `--risk-low #3B9E68`.

### Type
Editorial pairing — a serif for display and headlines (asserts publication
register), a sans for body and UI (data legibility), a mono for code,
ticker callouts, and ISO codes.

- **Display / headlines:** **Source Serif 4**, weights 400/600. Tight
  tracking, generous leading. Used for h1–h3 in articles, hero titles,
  pull-quotes, and any context where the publication tone is foreground.
- **Body / UI:** **Inter**, weights 400/500/600. Used for paragraph body
  in articles, all UI chrome, badges, buttons, table cells. Body sets at
  16/26 on the Intelligence Hub, 14/22 in the Admin Console.
- **Mono:** **JetBrains Mono**, weight 400/500. ISO codes (`CN`),
  numerals in data callouts, atomic-number labels in the logo, code
  blocks, dev-only inline IDs.

> **⚠ Substitution flag.** The brief leaves typography as `[PENDING]`. I've
> made the call (serif display + sans body) to match the editorial target;
> the specific families above are Google-Fonts-served. **If the partner
> wants a licensed alternative** (e.g. Tiempos, Söhne, GT Sectra), drop
> the .ttf/.woff2 into `fonts/` and update `colors_and_type.css`. Replace
> Geist Sans/Mono (the codebase's current fonts) at the same time.

### Spacing & rhythm
4pt base. Token scale: `2 / 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 80`.
Article body uses an 8pt vertical rhythm (paragraphs, lists, callouts all
land on multiples of 8). The Hub feed uses 16pt between rows, 24pt between
content sections. Admin tables use 12pt cell padding.

### Backgrounds & textures
- **Hub nav and footer:** flat `--wine-darkest`. No gradients on chrome.
- **Hub body:** flat `--stone`. Cards sit on `--stone` with a 1px
  `--rule` border; deeper cards (sidebar fills) use `--stone-mid`.
- **Decorative gradient stripe:** the only intentional gradient in the
  system — a 3px full-width bar at the very top of the page, running
  `#4A1419 → #7A2530 → #F0D4C4 → #C8623A` left-to-right. Treat it as a
  visual signature; do not introduce other gradients.
- **Imagery:** desaturated, warm-balanced photography (graphite mines,
  port logistics, regulatory chambers) only when content calls for it.
  Black-and-white or duotone (`--wine-dark` + `--stone`) preferred over
  full color. **No stock photos of generic "tech".** No hand-drawn
  illustrations. No background patterns or textures.

### Animation & transitions
Restrained, editorial. **No bounces, no springs, no parallax.**
- **Standard transition:** `150ms cubic-bezier(0.2, 0, 0, 1)` — applies
  to color, opacity, transform.
- **Hover lift:** opacity dip on links (`1 → 0.78`), 2% scale on
  download CTAs is the most exuberant we get.
- **Page transitions:** instant. Long-form articles fade body in over
  120ms.
- **Skeletons:** subtle 1.5s shimmer (cream gradient on stone), used
  only for the Admin Console data tables.

### States — hover / active / focus
- **Links:** terracotta `#C8623A` underline on hover (1.5px, offset 2px);
  no underline at rest in editorial body, persistent underline in nav
  metadata.
- **Buttons (primary, terracotta):** rest `#C8623A`, hover `#D98060`,
  active `#B0552F`, disabled 50% opacity.
- **Tabs (Hub primary):** active = 2px terracotta underline + cream text;
  rest = muted-cream text; hover = cream text, no underline.
- **Cards (Hub feed):** rest 1px `--rule` border; hover 1px `--terracotta`
  border + 2px translate-y(-1px); active no transform.
- **Focus rings:** 2px terracotta with 2px offset, square corners on
  buttons, rounded on inputs.
- **Press states:** filled buttons darken; outlined elements get a 2%
  scale-down only on tactile primary CTAs (Download, Subscribe).

### Borders & dividers
- **Hairlines:** 1px `--rule` (`#E5D4C5`) on stone surfaces; 1px
  `--wine-light` (`#6E2530`) on wine surfaces.
- **Featured-card border:** 1.5px `--terracotta` — used at most once
  per page (the hero report card).
- **Tab underlines:** 2px, terracotta when active.
- **Logo tile border:** 2px terracotta — the periodic-tile silhouette.

### Shadows & elevation
The system runs almost flat. Three shadows total:

```
--elev-0: none                                              /* default */
--elev-1: 0 1px 2px rgba(46, 14, 14, 0.06)                  /* hover cards */
--elev-2: 0 8px 24px -8px rgba(28, 7, 7, 0.18)              /* dialogs, dropdowns */
```

No glow effects, no inner shadows except the optional 1px-inset hairline
on inputs. Elevation comes from background contrast (stone → stone-mid),
not blur.

### Corner radii
Square-leaning. The Economist register doesn't pillow.

```
--radius-xs: 2px    /* badges, chips, tags */
--radius-sm: 4px    /* buttons, inputs */
--radius-md: 6px    /* cards, dialogs */
--radius-lg: 8px    /* hero report card, modal sheets */
--radius-pill: 999px /* avatars, dot indicators only */
```

### Cards
Default: 1px `--rule` border, 0 shadow, `--stone` fill, `--radius-md`,
24px padding. Hover lifts to `--elev-1` and shifts border to terracotta.
The featured-report card is the same dimensions but with `--radius-lg`,
1.5px terracotta border, and embedded data callouts.

### Transparency & blur
**Almost none.** No glassmorphism. The only legitimate uses:
- Modal overlays: `rgba(28, 7, 7, 0.55)` — solid wine at 55%, no blur.
- Disabled controls: 50% opacity.
- Image duotones: `mix-blend-mode: multiply` against `--wine-dark`.

### Layout rules (fixed elements)
- **Hub:** sticky top-of-page is the gradient stripe + the wine nav
  (56px). Tab strip is sticky-on-scroll under the nav (44px). Sidebar
  is non-sticky, scrolls with the body. Footer is wine-darkest, full-bleed.
- **Admin Console:** 240px sidebar (fixed left, full height); 56px
  header (fixed top of main column). Content area scrolls.
- **Max content widths:** Hub feed 720px (article width) within a
  1240px outer grid; Admin tables fill width up to 1280px.

---

## ICONOGRAPHY

The codebase uses **lucide-react** throughout (one icon set, line style,
2px stroke, 24px artboard, 16/20px common render sizes). The design system
inherits this — lucide is the icon system. We use it via the
`unpkg.com/lucide-static` SVG sprite for prototypes and as a React
component in the codebase.

### Approach
- **One icon family.** Lucide only. No mixing with Heroicons, Phosphor,
  or Material icons.
- **Stroke:** 1.5px in the editorial Hub (slightly lighter than lucide
  default for editorial register), 2px in the Admin Console (better at
  table density).
- **Color:** match surrounding text color via `currentColor`. Icons
  never carry their own brand color except in two cases — the terracotta
  download arrow on the featured-report CTA, and the risk-band dots
  in the Admin's score badges.
- **Size scale:** 14 / 16 / 20 / 24. Avoid bespoke sizes.
- **Icons used most:** `download`, `arrow-right`, `external-link`,
  `mail`, `chevron-down`, `search`, `building-2`, `flask-conical`,
  `bar-chart-3`, `layout-dashboard`, `menu`, `x`, `alert-triangle`,
  `info`.

### Country flags
ISO-2 flag emoji (`🇨🇳` `🇨🇩` `🇨🇱` `🇮🇩` `🇦🇺`) rendered through
`countryToFlag()` in the codebase — these are unicode regional indicator
pairs, **not** emoji glyphs in the colloquial sense, and are allowed.
Fallback to a 2-letter monospace code when the OS lacks emoji
(e.g. Windows). Twemoji SVGs are copied into `assets/` for cases where
we want consistent flag rendering across platforms.

### Logo (the MRa element tile)
Drawn from scratch in three SVG files (`assets/logo-mra-*.svg`). The tile
is 80×88 with:
- Atomic number `83` top-left, JetBrains Mono 11pt
- `MRa` centered, Source Serif 4 SemiBold 30pt
- `Mineral Risk` below, Inter Medium 8pt
- `Analytics` bottom, Inter Regular 7pt

**Do NOT** redraw this freehand — copy the SVG. If a new variant is
needed, edit one of the existing files.

### Emoji policy
**Prohibited in product UI.** Allowed only in:
- ISO flag glyphs in country tags (regional indicators)
- A user's own profile name in the Clerk auth dropdown (out of our control)

### Substitution flag
The codebase contains *no real visual assets* (only the Vercel-default
`next.svg`, `vercel.svg` etc. in `public/`). The MRa logos in
`assets/` are first-pass SVG drawings made to the brief's spec. Treat
them as working artwork — refine in Figma before launch.

---

## Quick start

To prototype Intelligence Hub or Admin Console designs:

```html
<link rel="stylesheet" href="../colors_and_type.css">
<!-- copy assets you need from assets/ -->
```

Then use the CSS variables (`var(--wine-darkest)`, `var(--terracotta)`)
or the type classes (`.h-display`, `.h-section`, `.body`, `.meta`,
`.mono`). Component recipes live in `ui_kits/intelligence_hub/` and
`ui_kits/admin_console/`.
