# Public Entity Pages — Build Plan v2 (informative-first scope)

**Date:** 2026-07-15 · **Scope:** `/intelligence/companies[, /{slug}]` + `/intelligence/regulations[, /{regulation_key}]`
**Mockups:** DesignSync `ui_kits/intelligence_hub/{companies,company,regulations,regulation}.html`
**Backend:** `/api/v1/intelligence/*` — v2 reflects Nicole's 2026-07-15 scope decisions.

---

## Scope decisions (Nicole, 2026-07-15)

Pages launch **purely informative** — company identity, supply chain, and facility
exposure; regulation facts, dates, and scope. Nothing score-related until the
scoring engine is honed. Concretely:

| Decision | Effect |
|---|---|
| No scores/bands on company pages | Hide band chip in header + list rows; exposure rows show material × stage × source geography only (no risk column, no band) |
| No scoring impact on regulation pages | Hide the impact sidebar entirely (both the mock's fake "+18/×1.15" AND the real compliance-weights panel — deferred together) |
| Hide linked posts/articles everywhere | Only 1 tagged post exists; interlinking starts from other pages later. Also drop the "Coverage: N posts · N events" fact — replaced by "Facilities: N" |
| Hide methodology mentions | No methodology links/asides while the engine is being honed |
| Subscribe block | Tabled — omit from build |
| HQ country-only | Accepted as-is |
| Intro | NEW `companies.public_intro` column (migration 057) — dedicated public copy, partner-authored via workbook `public_intro` column; `notes` stays internal and is never exposed. Frontend: render lede when present, omit block when NULL |
| Facility place | city when present, region as fallback (route updated — was "City, Region" join that almost never had a city) |
| Stage filter chips | Real DB vocabulary: Mining / Refining / Cell / OEM (mock's "Extraction" doesn't exist; `pack` has no rows) |

**Backend changes shipped for this scope (2026-07-15, compiled on device):**
migration 057 `companies.public_intro` · Company model · route `intro=company.public_intro`
· route `place = city or region` · seed_company_workbook loads optional `public_intro`
column (workbook wins on re-run; only path that writes public free text).

The API keeps returning band/risk fields — the contract stays stable so scores can
light up later with zero backend churn. The frontend simply doesn't render them yet.

---

## Prerequisites (down from 3 to 1)

Informative-only scope removes the company-scoring and post-tagging blockers.

| # | Item | State | Unblock |
|---|---|---|---|
| P1 | **0 of 100 companies published** | slugs backfilled ✓; `is_published` all false | re-run `seed-company-workbook` v34 (after `alembic upgrade head` — now through 057) |
| — | ~~company_scores empty~~ | no longer blocking (scores hidden) | company scoring runs later, bands light up when ready |
| — | ~~1 tagged post~~ | no longer blocking (linked feeds hidden) | partner tagging when article production starts |

Partner items that improve display quality but don't block: triage the 10
`policy_theme='pending_review'` regulations (frontend shows "—" for those until then);
author `public_intro` copy in the next workbook version.

---

## Remaining data gaps that shape the design (unchanged facts, informative scope)

**Regulation timeline** — only `publication_date` + `effective_date` exist, on 9 of 19
regulations. No revision/amendment tracking. Timeline renders 0–2 nodes: design as a
simple date strip, hidden at 0 nodes. The mock's 4-node story (Revision, future
Compliance-review window) needs data-model work — partner decision, out of scope.

**Source link** — present on 6/19 regulations (none of the 11 proposed). Hide block when absent.

**Facility place** — city on ~4% of facilities, region on ~78%; some rows have neither.
Row layout must read cleanly with country-only.

**Themes** — 9 snake_case values, `pending_review` on 10/19. Chips derived from real
distinct themes (display-mapped), pending_review shown as "—".

**Statuses in DB** — effective (7) / proposed (11) / enacted (1); display map handles all.

**Effective date column (browse)** — 9/19 filled; render "—".

---

## Build plan

**Phase 1 — foundation (one PR)**
`lib/api/entities.ts` typed client for the four endpoints (slug/regulation_key
identifiers, never numeric ids). Shared components in `components/hub/entity/`:
`EntityHeader` (no band variant), `Breadcrumb`, `Section`, `ScopeChips`,
`CompanyListRow`, `RegulationListRow`, `MaterialExposureRow` (no-risk variant),
`FacilityRow`, `TimelineStrip` (sparse-tolerant). Wine+Stone tokens from `hub.css`
only — no dashboard (Cool Slate) patterns.

**Phase 2 — browse pages** (fully data-backed)
`/intelligence/companies`: search + real-vocab stage chips + count + pagination, rows
without band chip. `/intelligence/regulations`: search + real-theme chips + status
pill + effective ("—" fallback).

**Phase 3 — detail pages** (empty states designed in, not discovered)
Company: header (no band) → lede (public_intro, omit when NULL) → Material exposure
(material × stage × geography) → Facilities (name/type, city-else-region, status pill,
"N of M shown"). Regulation: header → summary → date strip (0–2 nodes) → scope chips
(materials + geographies) → source block (when present). No sidebar on either page at
launch (impact/subscribe/methodology all cut) — single-column layout, or keep the grid
with the aside collapsed.

**Phase 4 — later, in rough order**
Company scoring lights up bands (frontend flips one flag per component) → linked
intelligence sections return when articles exist → compliance-weights panel after band
review → subscribe (Nicole) → admin intro authoring / unpublish flows → industry-events
section (separate workstream).
