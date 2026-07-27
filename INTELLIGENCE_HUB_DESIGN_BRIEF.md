# Intelligence Hub — Design Brief
*Last updated: April 2026 · Pending partner review*

---

## Status
All decisions below are working decisions pending partner review. Items marked **[PENDING]** require partner sign-off before implementation begins.

---

## Brand

### Name
**[PENDING]** Working name: **Mineral Risk Analytics**
- Replaced "Automotive Data Solutions" which was too broad and didn't reflect the core product
- Dropped "Group" (implies larger organization) in favour of "Analytics" (signals data platform)
- Alternatives considered and ruled out:
  - Mineral Risk Intelligence — too close to Benchmark Mineral Intelligence
  - Critical Mineral Risk — stronger SEO but less platform-forward
  - Battery Mineral Risk — too narrow if product expands

### Logo
**[PENDING]** Periodic table element tile using letters **MRa**
- Format mirrors real element convention (e.g. Mg, Na, Fe — first letter cap, rest lowercase)
- Atomic number: **83** (bismuth in real life — non-toxic heavy metal used in battery research; coincidental but not a bad association). Can be changed to a meaningful number.
- Fields: `83` top-left · `MRa` centre large · `Mineral Risk` below · `Analytics` bottom
- Chosen treatment for nav bar: **dark wine + terracotta border** (`#1C0707` fill, `#C8623A` border) — reads cleanly at small sizes against the wine nav background
- Terracotta fill variant (`#C8623A` background, `#1C0707` text) for standalone use: favicon, app icon, print, light backgrounds
- Outline variant (transparent, `#C8623A` border and text) for light backgrounds and email headers
- See Color Theme section for full Wine + Stone logo treatment table

### Tagline (optional)
Working: *Supply Chain Intelligence*

---

## Color Theme

### Chosen: Wine + Stone (Theme 3)
**[PENDING]** partner review

Premium editorial feel — The Economist / high-end publication register. Deep wine backgrounds read as authoritative and differentiated; terracotta accent is warm without the commodity-price-dashboard associations of gold or the sustainability-startup associations of green.

| Role | Hex | Usage |
|------|-----|-------|
| Wine darkest | `#1C0707` | Nav bar, darkest surfaces |
| Wine dark | `#2E0E0E` | Subnav background, tab bar |
| Wine mid | `#3D1414` | Badge backgrounds (Analysis, Signal) |
| Wine light | `#4F1C1C` | Hover surfaces, card borders on dark |
| Text on dark | `#F0E6DE` | Nav text, headings on dark (warm cream) |
| Muted on dark | `#9E7B72` | Secondary nav links, metadata |
| Accent (terracotta) | `#C8623A` | CTA buttons, active tab underline, featured card border, links |
| Accent lighter | `#D98060` | Hover states, lighter terracotta elements |
| Stone (light bg) | `#FAF3EC` | Page/card backgrounds |
| Stone mid | `#F2E8DE` | Slightly deeper card surfaces, sidebar fills |

### Gradient header bar
Top-of-nav decorative stripe runs five stops: `#2E0E0E → #5C1A1A → #F0D4C4 → #C8623A` (wine to terracotta, left to right). Thin (3–4px), full width.

### Logo color treatments (Wine + Stone)
Three variants defined — use by context:

| Variant | Background | Border/Fill | Text | Use |
|---------|-----------|------------|------|-----|
| **Dark wine + terracotta** | `#1C0707` | `#C8623A` border | `#F0E6DE` / `#C8623A` | Nav bar, dark surfaces |
| **Terracotta fill** | `#C8623A` | — | `#1C0707` | Standalone, favicon, print, light backgrounds with punch |
| **Outline / light bg** | transparent | `#C8623A` border | `#C8623A` / `#2E0E0E` | Light page backgrounds, email headers |

### Semantic colors (unchanged from product — not brand colors)
- Risk High: `#E24B4A`
- Risk Medium: `#EF9F27`
- Risk Low: `#3B9E68`

### Rejected directions
- Purple + Copper (Theme 1) — original proposal; purple reads as crypto/fintech rather than editorial
- Teal/green — too common in clean energy/sustainability; Benchmark adjacent
- Navy + Amber — blue is overused in brands generally
- Charcoal + Electric Blue — generic SaaS
- Gold accents (any base) — Benchmark Mineral Intelligence uses gold; avoid
- Crimson accent — red has semantic meaning (risk) in the product; conflicts with brand accent use

---

## Page Layout

### Chosen: Option C — Content-type navigation
**[PENDING]** partner review

**Primary navigation:** Content type tabs — `All | Analysis | Signal | Report | News`
- Rationale: most flexible at low content volume (doesn't expose sparse category counts); lets readers self-select depth; scales naturally as content grows

**Content type legend:** 4 cards below the tab bar explaining each type
- Onboards new readers unfamiliar with the content taxonomy
- Can be hidden once the publication is established

**Hero:** Featured report card
- Highlights the most recent PDF report prominently
- Shows data callout boxes (e.g. risk level, key stat) embedded in the card
- Download CTA in copper
- Rationale: more forgiving than "latest analysis" when posting cadence is weekly or bi-weekly — a report from 2-3 months ago still reads as intentional reference material

**Main feed:** Recent intelligence list
- Chronological, filterable by type tab
- Each row: type badge + material tags + geography tags + date/read time + title + body preview lines

**Sidebar:**
- Material risk indicator bars (Lithium/Graphite/Cobalt/Nickel/Manganese — High/Med/Low)
- Browse by pillar buttons (colour-coded by pillar)
- Email subscribe CTA

**Layouts considered and not chosen:**
- Option A (Pillar-first nav) — requires discipline from content creator to categorise every post; better once content volume is high
- Option B (Material-first nav) — most intuitive for commodity-focused readers but deprioritises the pillar taxonomy that differentiates the product

---

## Content Strategy

### Positioning
Mineral supply chain risk analysis — **company-agnostic**. Not OEM-specific coverage (conflict of interest risk while partner is employed by an OEM). Not commodity price tracking (Benchmark's territory). The gap: regulatory and policy interpretation applied to the mineral supply chain.

### Content taxonomy
Every post tagged across three dimensions:

| Dimension | Values |
|-----------|--------|
| **Type** | Analysis, Signal, Report, News |
| **Pillar** | Material Concentration, Geopolitical Trade, Regulatory Compliance, Operational, Financial Pressure |
| **Material** | Lithium, Cobalt, Nickel, Graphite, Manganese, + others |
| **Geography** | CN, DRC, CL, ID, AU, + others (ISO2) |

### Content types defined
- **Analysis** — long-form, data-backed analytical pieces (partner-written, 5–10 min read)
- **Signal** — short-form alerts, a new event or data point worth flagging (1–2 paragraphs)
- **Report** — downloadable PDF, citable research documents (quarterly cadence to start)
- **News** — curated external coverage with context/commentary added

### Partner's expertise
Regulatory and policy — IRA, FEOC rules, EU CRMA, permitting, DOE programs. Strongest content will be regulatory interpretation applied to specific minerals and geographies. Does NOT require OEM-specific knowledge.

### Volume expectation
One piece per week to start. Layout chosen (Option C) is forgiving at this cadence.

### Engine alignment
The `insight_posts` database table should tag posts by **pillar enum** (not free-form tags) + `materials TEXT[]` + `geographies TEXT[]` so content links cleanly to the scoring engine's taxonomy. This enables future "related intelligence" surfacing alongside company-level scores.

---

## Differentiation vs Competitors

| | Benchmark Mineral Intelligence | Mineral Risk Analytics |
|--|-------------------------------|----------------------|
| Core product | Commodity price assessment | Supply chain risk scoring |
| Editorial angle | Mining operations, production | Regulatory/policy interpretation |
| Audience | Traders, procurement | Compliance, strategy, investors |
| Pricing signal | Gold accent, institutional | Wine/terracotta, editorial |
| Public content | Limited free tier | Intelligence hub as lead-gen |

---

## Things Still Needed Before Implementation

1. **Partner review** of name, logo, layout, color theme
2. **Domain check** — mineralriskanalytics.com availability
3. **Company registry check** — search for existing "Mineral Risk" entities
4. **Atomic number decision** — keep 83 or choose a meaningful number
5. **Backend migration** — `insight_posts` table (migration 011)
6. **Admin form** — simple in-app form for partner to publish posts/upload PDFs
7. **Typography decision** — serif vs sans for body text (editorial vs data-platform feel)

---

## Files
- Wireframe mockups: created in Cowork session, April 2026
- This brief: `INTELLIGENCE_HUB_DESIGN_BRIEF.md`
