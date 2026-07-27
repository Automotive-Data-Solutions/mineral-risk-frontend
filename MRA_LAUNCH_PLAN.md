# Mineral Risk Analytics — Launch Plan
*Version 1.1 · July 2026 · Partner-review answers folded in*

## Status
Working plan — v1.1 with partner-review answers folded in. Timelines are estimates based on Vale + Albemarle walkthrough velocity (July 2026). Everything below assumes the `insight_posts` backend migration (011) still needs to happen.

**Partner-review answers (July 2026):**
1. Company-agnostic scope — non-OEM company coverage is fine. Miners, refiners, JV entities all in scope. Not a blocker.
2. Content backlog target — 8-12 articles + 2 reports is realistic. Nicole owns data + FE/BE; partner owns writing.
3. Aluminum inclusion — leave in launch-10 for now; decide later whether to soft-launch thinner-coverage minerals.
4. **News feed IS v1.** Adds 2-3 weeks to the timeline. Non-negotiable.
5. Walkthrough sequence confirmed — **BHP first**, section-by-section, updating **all three** files as we go: company_seed_expanded, manual_risk_events, facility_seed.

---

## Product Definition (what ships at v1)

**Mineral Risk Analytics v1** is an editorial supply-chain-risk platform for battery-critical minerals. Ships with:

- **Materials pages with real risk scores** — the primary product surface, using the launch-10 minerals: Lithium, Cobalt, Nickel, Manganese, Natural Graphite, Phosphate, Iron Ore, Copper, Aluminum, Rare Earth Elements.
- **Info-only pages** (no scores at v1) — Companies, Regulations, Countries. Purpose: SEO + article context + partner narrative.
- **Editorial content** — Analysis, Signal, Report, News published by partner.
- **PDF report library** — quarterly downloadable reports.

**Explicit NOT-in-v1:**
- Company risk scores (deferred to Phase 5 backend work)
- Facility deep-dive pages (deferred to v2)
- Interactive data explorers, charts, maps (deferred to v2)
- User accounts / gated content (email capture only)
- Search (deferred until content > 50 posts)

---

## Current Data Foundation

As of July 2026:

| Asset | Count | Coverage |
|---|---:|---|
| Materials (DB + seed) | 41 | Launch-10 fully covered; Bromine added for Albemarle |
| Companies (seed) | 90 | Only 27 file with SEC; 63 are LSE/ASX/HKEX/private/state |
| Facilities (seed) | 146 | Vale (37) + Albemarle (18) heavy; others sparse |
| Risk events | 56 | Vale (44) + Albemarle (14). Manual walkthrough |
| Regulations | 19+ | UFLPA, CRMA, IRA, EU Battery Reg, CBAM, EU CSDDD + others |
| Scoring pillars | 5 | Material Concentration, Operational, Financial Pressure, Geopolitical, Regulatory |

Deep-walked companies with full 10-K/20-F event extraction:
- **Vale S.A.** (Brazilian iron ore giant) — 44 events, 12 facilities linked
- **Albemarle Corporation** (US lithium leader) — 14 events, 18 facilities added

---

## Frontend IA at Launch

| Route | Purpose | Data source | Effort |
|---|---|---|---|
| `/intelligence` (existing) | Article feed home | `insight_posts` DB table | Backend build |
| `/materials` + `/materials/[slug]` | Materials risk pages with scores | Scoring engine + material_global_risk_scores | Frontend build |
| `/companies` + `/companies/[slug]` | Info-only company profiles | `company_seed_expanded.xlsx` + Company Material Exposure tab + risk_events (filtered) | Frontend build |
| `/regulations` + `/regulations/[slug]` | Regulation index + individual pages | `regulations` table (already seeded) | Frontend build |
| `/countries` + `/countries/[iso2]` | Country supply-chain overviews | Derived from MCS + Comtrade + regulations + facility seed | **Optional for v1** |
| `/reports` | Downloadable PDF library | Static PDF files + insight_posts metadata | Frontend build + partner PDFs |

---

## Company Coverage Priority — the priority ranking you asked for

For each launch-10 mineral, this table shows the largest producers by approximate global market share and lists the companies you'd walk to get maximum coverage. Colors: ✅ = already deeply walked; 🟩 = SEC filer (easy walk); 🟨 = LSE/ASX filer (medium); 🟥 = private or state (hard/impossible).

### Iron Ore (~2.5 Bt/yr world crude)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **Vale** | 13% | 🟩 SEC 20-F | ✅ Walked |
| 2 | **Rio Tinto** | 13% | 🟩 SEC 20-F | ✅ Walked |
| 3 | **BHP** | 11% | 🟩 SEC 20-F | ✅ Walked |
| 4 | **Fortescue** | 8% | 🟨 ASX/LSE | Priority 9 |
| 5 | Anglo American | 2% | 🟨 LSE | Post-launch |

**Cumulative coverage after Vale+BHP+Rio+Fortescue = ~45% of world iron ore.**

### Lithium (~1M+ tonnes LCE 2025)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **SQM** | ~15% | 🟩 SEC 20-F | ✅ Walked |
| 2 | **Albemarle** | ~10% | 🟩 SEC 10-K | ✅ Walked |
| 3 | **Ganfeng** | ~8% | 🟥 SZSE | Post-launch |
| 4 | **Tianqi** (via Windfield) | ~7% | 🟥 HKEX/SZSE | (Partial coverage via Albemarle walk) |
| 5 | Pilbara Minerals | ~4% | 🟨 ASX | Post-launch |
| 6 | Mineral Resources (via MARBL) | ~5% | 🟨 ASX | (Partial via Albemarle) |
| 7 | Rio Tinto (Arcadium) | ~3% | 🟩 SEC 20-F | Priority 2 (covered via Rio walk) |

**Cumulative coverage after Albemarle+SQM+Rio Tinto = ~28% of world lithium (plus captive Talison/Windfield via Albemarle).**

### Nickel (~3.6 Mt/yr world)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **Tsingshan** (Indonesia + China) | ~15% | 🟥 Private | Not walkable |
| 2 | **Norilsk Nickel** | ~9% | 🟥 MOEX (sanctioned) | Limited |
| 3 | **Vale** | ~5% | 🟩 SEC 20-F | ✅ Walked |
| 4 | **Sumitomo Metal Mining** | ~5% | 🟨 TSE | Post-launch |
| 5 | **BHP** (Nickel West divesting) | ~3% | 🟩 SEC 20-F | ✅ Walked |
| 6 | **Glencore** | ~3% | 🟨 LSE | ✅ Walked |
| 7 | MIND ID (Indonesian holding) | ~5% | 🟥 State | Not walkable |

**Cumulative coverage after Vale+BHP = ~8% of world nickel. Nickel is structurally hard — ~50%+ of production is state/private in Indonesia, Russia, China.**

### Copper (~22 Mt/yr world mined)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **BHP** (Escondida etc.) | ~11% | 🟩 SEC 20-F | ✅ Walked |
| 2 | **Freeport-McMoRan** | ~8% | 🟩 SEC 10-K | ✅ Walked |
| 3 | **Codelco** | ~7% | 🟥 State (Chile) | Post-launch (annual report only) |
| 4 | **Glencore** | ~5% | 🟨 LSE | ✅ Walked |
| 5 | Rio Tinto | ~3% | 🟩 SEC 20-F | ✅ Walked |
| 6 | Anglo American | ~3% | 🟨 LSE | Post-launch |
| 7 | Vale | ~2% | 🟩 SEC 20-F | ✅ Walked |

**Cumulative coverage after Vale+BHP+Rio+Freeport = ~24% of world copper (~35% if we can add Codelco + Glencore).**

### Cobalt (~230 kt/yr world)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **CMOC Group** (Tenke + KFM) | ~35-40% | 🟥 HKEX/SSE | ✅ Walked |
| 2 | **Glencore** (Katanga + Mutanda) | ~18% | 🟨 LSE | ✅ Walked |
| 3 | Norilsk Nickel | ~5% | 🟥 MOEX | Limited |
| 4 | Sumitomo Metal Mining | ~2% | 🟨 TSE | Post-launch |
| 5 | Vale | ~2% | 🟩 SEC 20-F | ✅ Walked |

**Cobalt is structurally hard — the top two producers together control ~55% and neither files with SEC. Post-launch priority for non-SEC scraping.**

### Manganese (~19 Mt/yr)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **South32** (Groote Eylandt + Hotazel) | ~14% | 🟨 ASX/LSE | ✅ Walked |
| 2 | **Eramet** (Moanda Gabon) | ~10% | 🟨 Euronext | Post-launch |
| 3 | Anglo American (Samancor JV) | ~9% | 🟨 LSE | Post-launch (via Rio/Anglo) |
| 4 | Vale (small) | ~1% | 🟩 SEC 20-F | ✅ (marginal) |

**South32 walk unlocks ~14% manganese; adding Anglo American or Eramet gets to ~25%.**

### Aluminum (~70 Mt/yr primary)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | China Hongqiao | ~10% | 🟥 HKEX | Post-launch |
| 2 | **Chalco** (Aluminum Corp of China) | ~9% | 🟨 HKEX/NYSE ADR | Post-launch |
| 3 | Rio Tinto | ~5% | 🟩 SEC 20-F | ✅ Walked |
| 4 | Rusal (Russia, sanctioned) | ~5% | 🟥 MOEX | Limited |
| 5 | Emirates Global Aluminium | ~4% | 🟥 Private | Not walkable |
| 6 | **Alcoa** | ~3% | 🟩 SEC 10-K | ✅ Walked |
| 7 | Norsk Hydro | ~3% | 🟨 Oslo | Post-launch |

**Rio Tinto + Alcoa covers ~8% of aluminum. Adding Norsk Hydro takes it to ~11%. Chinese producers add most but are harder to walk.**

### Phosphate (world 220 Mt rock)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | **OCP Group** (Morocco) | ~30%+ | 🟥 Private | Post-launch (annual report only) |
| 2 | **Mosaic** | ~15% | 🟩 SEC 10-K | Priority 5 |
| 3 | **Nutrien** | ~10% | 🟨 TSX/NYSE dual | ✅ Walked |
| 4 | ICL Group | ~3% | 🟨 TASE | Post-launch |
| 5 | Ma'aden (Saudi) | ~3% | 🟥 Saudi Tadawul | Not walkable |

**Mosaic + Nutrien = ~25% covered via 2 filer walks.**

### REE (world ~350 kt REO)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | China Northern Rare Earth (Baotou) | ~25% | 🟥 SSE | Post-launch (limited) |
| 2 | China Minmetals + Southern | ~30% | 🟥 SSE (multiple) | Post-launch (limited) |
| 3 | **MP Materials** (Mountain Pass) | ~15% | 🟩 SEC 10-K | ✅ Walked |
| 4 | **Lynas** (Mt Weld + Kalgoorlie + Kuantan) | ~8% | 🟨 ASX | Priority 8 |
| 5 | Iluka Resources | ~1% | 🟨 ASX | Post-launch |
| 6 | Neo Performance Materials | ~1% | 🟨 TSX | Post-launch |

**MP + Lynas = ~23% covered. China dominates (~55%) but isn't walkable via SEC filings.**

### Natural Graphite (~1.6 Mt/yr world)
| Rank | Company | Share | Filer | Status |
|---:|---|---:|---|---|
| 1 | Chinese state-affiliated producers | ~65% | 🟥 SSE/private | Not walkable |
| 2 | BTR (anode) | ~15% of anode | 🟥 SZSE | Post-launch |
| 3 | Shanshan | ~10% of anode | 🟥 SZSE | Post-launch |
| 4 | **Syrah Resources** (Balama Mozambique) | ~5-7% flake | 🟨 ASX | ✅ Walked |
| 5 | Nouveau Monde Graphite | future | 🟨 TSX | Post-launch |

**Natural Graphite is structurally hard — ~65% China-dominated. Syrah is the only realistic non-China walkable target. Consider low-priority for v1.**

---

## Prioritized Walkthrough Sequence

Order optimized for market-share × coverage × walkthrough ease:

| # | Company | Filer | Materials | Est. sessions | Completed |
|---:|---|---|---|---:|---|
| 1 | **BHP Group** | 🟩 SEC 20-F | Iron Ore, Copper, Nickel | 4 | ✅ |
| 2 | **Rio Tinto** | 🟩 SEC 20-F | Iron Ore, Aluminum, Copper, Lithium (Arcadium) | 4-5 | ✅ |
| 3 | **SQM** | 🟩 SEC 20-F | Lithium, Iodine | 3-4 | ✅ |
| 4 | **Freeport-McMoRan** | 🟩 SEC 10-K | Copper (Grasberg, Chile) | 3 | ✅ |
| 5 | **Mosaic** | 🟩 SEC 10-K | Phosphate, Potash | 3 |  |
| 6 | **MP Materials** | 🟩 SEC 10-K | Rare Earth Elements | 3 | ✅ |
| 7 | **South32** | 🟨 ASX/LSE | Manganese, Aluminum, Silver, Zinc | 3-4 | ✅ |
| 8 | **Nutrien / Lynas** | 🟨 TSX / ASX | Phosphate / REE | 3 each | ✅ |
| 9 | **Fortescue** | 🟨 ASX/LSE | Iron Ore | 3 |  |
| 10 | **Alcoa** | 🟩 SEC 10-K | Aluminum | 3 | ✅ |

**Post-launch batch (harder walks, non-SEC):**
- Glencore (LSE) — massive multi-material (Cobalt, Copper, Nickel, Zinc)
- CMOC (HKEX) — Cobalt #1
- Codelco (Chile state) — Copper #1
- OCP (Morocco private) — Phosphate #1
- Norilsk Nickel (Russia sanctioned) — Nickel, Palladium
- Tsingshan (China private) — Nickel, Stainless
- Anglo American (LSE) — Iron Ore, Copper, Manganese, PGM

### After Priorities 1-10 walked, launch-mineral coverage becomes

| Mineral | Coverage % of world |
|---|---:|
| Iron Ore | ~45% (Vale + BHP + Rio + Fortescue) |
| Lithium | ~28% + captive (Albemarle + SQM + Rio/Arcadium + Talison/Wodgina) |
| Copper | ~24% (Vale + BHP + Rio + Freeport) |
| Nickel | ~8% (Vale + BHP) — structural gap |
| Cobalt | ~2% (Vale only) — structural gap for v1 |
| Manganese | ~15% (South32) |
| Aluminum | ~8% (Rio + Alcoa) |
| Phosphate | ~25% (Mosaic + Nutrien) |
| REE | ~23% (MP + Lynas) |
| Natural Graphite | ~0% — structural gap |

**Interpretation:** Priorities 1-10 give reasonable coverage of most launch-10 minerals except cobalt, nickel, and graphite — those need post-launch non-SEC walks or third-party data sources.

---

## Timeline (weeks from kickoff)

Assumption: sequential walkthroughs at Vale/Albemarle velocity (~4-5 sessions × ~2 hours each = 8-10 hours per company). Frontend + partner content + news-feed backend run in parallel.

**News feed is v1** (partner decision), which adds ~2-3 weeks. Revised total: **11 weeks**.

| Week | Company walkthroughs | Frontend / news-feed work | Partner content |
|---:|---|---|---|
| 1 | BHP Group start | insight_posts migration 011 | Regulation briefs draft |
| 2 | BHP finish + Rio Tinto start | GDELT poll + material×country filter design | 3 articles drafted |
| 3 | Rio Tinto finish | GDELT nightly ingester → risk_events (INFORMATIONAL subtype) | 2 articles drafted |
| 4 | SQM | `/materials/[slug]` pages built | 2 articles + 1 report drafted |
| 5 | Freeport | `/companies/[slug]` pages built (Vale + Albemarle + BHP + Rio) | 2 articles drafted |
| 6 | Mosaic + MP Materials | `/regulations/[slug]` pages built | 2 articles + 1 report drafted |
| 7 | South32 | News feed → intelligence page integration | Content backlog QA |
| 8 | Lynas + Nutrien | Sidebar risk block + article backlinks | Content backlog QA |
| 9 | Fortescue + Alcoa (light-touch batch) | Admin form for partner + SEO polish | Content backlog QA |
| 10 | — | Analytics wire-up + performance / accessibility pass | Content backlog QA |
| 11 | — | **LAUNCH** | 8-12 articles + 2 reports live |

Total: **11 weeks from kickoff to launch.** Assumes the person doing walkthroughs is also doing at least some frontend + backend work; parallel resources compress timeline.

---

## Data Source Additions Needed for v1

All three are v1 scope after partner review:

| Priority | Source | Fills | Effort |
|---:|---|---|---|
| 1 | **GDELT news feed** filtered for launch-10 material × top-30 country combos | Between-filing events; makes scoring "current" not "annual"; feeds intelligence page | 2-3 weeks |
| 2 | LME/SHFE spot prices for Nickel / Cobalt / Manganese / Lithium / REE | Financial Pressure pillar gap for these materials | 1-2 weeks (Alpha Vantage / Yahoo Finance) |
| 3 | CBP UFLPA Entity List automated pull | Automates what's currently seeded manually | 1 week |

**Deferred to v2:** LSE/ASX RNS scraping, subscription data (Benchmark/CRU), refining-vs-mining stage disaggregation, satellite/remote sensing.

---

## Backend Engineering Sequence

Blocking build work needed:

1. **Migration 011: `insight_posts` table** (per design brief). Columns: `id`, `slug`, `type` (enum), `title`, `body_md`, `lede`, `published_at`, `pillar`, `materials` (text[]), `geographies` (text[]), `companies` (text[]), `regulations` (text[]), `pdf_url`, `pages`.
2. **API routes for content**: `/api/posts`, `/api/materials`, `/api/companies`, `/api/regulations` (+ their `/[slug]` versions).
3. **Admin form** for partner to publish/tag posts + upload PDFs.
4. **Static export or ISR for public pages** — Materials/Companies/Regulations shouldn't hit the DB on every page load.

Nice to have:
- RSS feed at `/rss.xml`
- Sitemap.xml auto-generated
- OpenGraph metadata for social sharing

---

## Company Profile Page Structure (v1, info-only)

Each `/companies/[slug]` page renders from seed data:

```
[Header]
Company Name · Country · Ticker · Ownership Type · Segments

[About]
Short partner-written description (2-3 paragraphs)

[Material exposure]
List from Company Material Exposure tab:
  Material | Revenue share | Battery-grade relevance | 2025 production

[Facilities]
List from facility seed (grouped by country):
  Facility · Type · Status · Ownership%

[Filing highlights]
Last 3-5 material risk events from risk_events table (info-only)

[Related intelligence]
Articles tagged with this company slug (backlinks from insight_posts)

[Sources]
Filing references (10-K/20-F links)
```

No risk scores on this page for v1. Sidebar continues to show material risk scores only.

---

## Sidebar Risk Score Layout (v1)

Existing sidebar (`components/hub/Sidebar.tsx`) has:
- Material risk (5 bars)
- Browse by pillar (5 buttons)
- Subscribe form

For v1 launch: **no changes needed to sidebar structure.** Material risk bars are the whole visible-scoring surface at launch.

---

## Post-Launch Roadmap (v2+)

| Version | Timing | Additions |
|---|---|---|
| v1 | Week 9 | Launch bundle: Materials, Companies, Regulations, Reports, Articles |
| v1.1 | Weeks 10-13 | Countries pages, glossary, additional company walks (Alcoa, Fortescue, Nutrien completed) |
| v1.2 | Weeks 14-20 | Non-SEC walkthroughs: Glencore, CMOC, Codelco (annual reports) |
| v2 | Q4 2026 | Phase 5 — `LINK_EVENTS_TO_COMPANIES=True` enables real company scoring; company scores go on company pages + sidebar |
| v2.1 | Q1 2027 | Facility deep-dive pages for tier-1 assets; search UX |
| v2.2 | Q2 2027 | News feed integration; interactive data explorer |

---

## Open Questions for Partner Review

1. **Company-agnostic positioning revisited** — the design brief flagged this as OEM-focused caution. Are upstream miner/refiner profiles (Vale, Albemarle, BHP, Rio, etc.) OK at launch, or does that create the same conflict?

2. **Content backlog target** — is 8-12 articles + 2 reports realistic for launch, or should we lower the bar to 5 articles + 1 report?

3. **Aluminum inclusion in launch-10** — Aluminum is on the list but coverage will be thin at v1 (~8% of world). Should we soft-launch aluminum content ("coming soon") or lower expectations upfront?

4. **News feed at v1 or v2?** GDELT integration would refresh scoring between filings and give the site liveness. But it's 2-3 weeks of extra work — cut it or push launch by 2 weeks?

5. **Prioritized walkthrough sequence** — priorities 1-10 above assume BHP first. Alternative: SQM first if lithium is the flagship material. Partner call.
