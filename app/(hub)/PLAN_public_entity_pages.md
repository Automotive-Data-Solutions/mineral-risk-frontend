# Public Hub Entity Pages — Build Plan
**Working doc, 2026-07-15. Review discrepancies before building.**

Scope: bring the public Intelligence Hub (Stack 1, Wine+Stone) into parity with the
DesignSync mockups for company/regulation browse + detail pages. Backend endpoints
already ship (see below). No frontend work yet.

---

## 1. Current state — brutal inventory

### Routes existing under `app/(hub)/`
| Route                        | Status      |
|------------------------------|-------------|
| `/intelligence`              | LIVE (feed) |
| `/intelligence/companies`    | **MISSING** |
| `/intelligence/companies/[slug]` | **MISSING** |
| `/intelligence/regulations`  | **MISSING** |
| `/intelligence/regulations/[regulation_key]` | **MISSING** |

### Components under `components/hub/`
Only feed-oriented components exist: `Nav`, `FeaturedReport`, `FeedRow`, `Sidebar`,
`TypeLegend`, `Footer`, `pillars.ts`, `types.ts`. **Zero entity components.**

### API client under `lib/api/insights.ts`
Only post functions: `listPublishedPosts`, `getPostById`, `updatePost`, `publishPost`,
`unpublishPost`, `pinPost`, `unpinPost`, `uploadDocx`. **Zero entity client functions**,
even though the backend endpoints are live.

**Bottom line: everything for these pages is greenfield.**

---

## 2. Backend contract — what's already served

From `app/schemas/intelligence_entities.py` + `app/api/routes/intelligence_entities.py`.

### `GET /api/v1/intelligence/companies` — browse list
Query: `q` (search), `stage`, `band`, `page`. Filters out `is_published=false`.

Row shape (`PublicCompanyListItem`):
- `slug`, `name`, `legal_name`
- `stage_label` — pre-joined display string (e.g. "Refining · Cell")
- `hq_country` — ISO2
- `materials[]` — top-3 CME material canonical names
- `band` — `{label, level, score}` from latest `CompanyScore.overall`

### `GET /api/v1/intelligence/companies/{slug}` — profile
Shape (`PublicCompanyProfile`):
- `slug`, `name`, `legal_name`, `band`, `intro` (null until admin authoring flow)
- `facts[]` — `{label, value, mono}` — e.g. HQ / ticker / CIK / stage / founded
- `exposures[]` — `{material, stage_label, geography, exposure_score, risk_score, band}`
  - Join = CME × latest L1 `material_geography_risk_scores` on (material, source_geography)
- `facilities[]` — `{name, facility_type, country, place, status, status_level}` — first 8
- `facilities_total` — count
- `linked_posts[]` — tag-driven (posts where `tags[]` contains company canonical_name)
- `linked_events[]` — from `risk_event_companies` (empty until Phase-5 flag flips)

### `GET /api/v1/intelligence/regulations` — browse list
Query: `q`, `theme`, `status`.
Row shape (`PublicRegulationListItem`):
- `regulation_key`, `title`, `issuer`, `geography`
- `theme`, `status` + `status_level` (inforce/proposed/pending/ended)
- `effective_date`

### `GET /api/v1/intelligence/regulations/{regulation_key}` — detail
Shape (`PublicRegulationDetail`):
- Header fields (as above) + `summary`
- `timeline[]` — `{label, date, note, active, future}` — publication / effective / phase-in dates
- `materials_scope[]` — `{material, scope_type, severity_multiplier}` — with SCOPE_SEVERITY_MULTIPLIER pre-joined
- `geographies_scope[]` — `{country_code, scope_type}` (jurisdiction/origin/targeted)
- `compliance_weights[]` — `{country_code, weight}` — top 8 from `geography_compliance_weights` JSONB
- `source_url` — via SourceDocument
- `linked_posts[]` — tag-driven (posts where `tags[]` contains regulation_key)
- `linked_events[]` — from `risk_event_regulations`, plus `linked_event_count`

---

## 3. Mockup content (best-known — from memory, unverified without seeing HTML)

The DesignSync mockups in `ui_kits/intelligence_hub/{companies,company,regulations,regulation}.html`
use these component names in the memory note:

- **EntityHeader** — used at the top of company + regulation detail pages
- **EntityList** — used on browse pages
- **EntityBlocks** — content blocks on detail pages (exposures / facilities / timeline / scope / etc.)
- **Breadcrumb** — nav trail
- **FeedRow** — reused from feed to render linked posts

Vocabulary confirmed by memory:
- Bands: Low / Moderate / High (levels low/med/high)
- Stage labels: "Extraction · Refining · Cell · Cathode"
- Reg status: "In force / Proposed / Pending" (levels inforce/proposed/pending)
- Facility status: op / ramp / build

**I do NOT have the mockup HTML in this repo** — the DesignSync project is a
separate surface. Any specific layout / component structure below is inferred.
Flag anything I got wrong; sections marked ⚠ are my best guesses that need mockup
verification.

---

## 4. Discrepancy table — decide keep/drop/add per row

Legend:
- **⚡ Direct match** — mockup asks for X, backend serves X. Just build the UI.
- **🔧 Frontend derives** — backend has raw data, frontend needs to derive/format.
- **➕ New backend field** — mockup wants something backend doesn't return.
- **❓ Verify** — I'm inferring; need mockup HTML or your call.
- **🗑 Consider dropping** — mockup has it but low value for launch.

### Company browse (`/intelligence/companies`)

| Mockup feature | Backend field | Status | Notes |
|---|---|---|---|
| Company name + legal name | `name`, `legal_name` | ⚡ | |
| HQ country flag | `hq_country` (ISO2) | 🔧 | Frontend needs flag renderer (already have `CountryFlag` in components/shared/ from dashboard — can reuse if hub reads dashboard-shared, otherwise port the flag map) |
| Stage tags ("Refining · Cell") | `stage_label` | ⚡ | Server-formatted string, no work |
| Top-3 materials | `materials[]` | ⚡ | |
| Risk band pill | `band.{label,level,score}` | ⚡ | Renders as dashes until scores populate |
| Search box | `q` param | ⚡ | |
| Stage filter | `stage` param | ⚡ | |
| Band filter | `band` param | ⚡ | |
| Pagination | `page` param | ⚡ | |
| ❓ Sort options | — | ❓ | Mockup may show a sort dropdown; backend doesn't advertise sort options. If mockup has it, need `?sort=name|band|updated`. |
| ❓ Result count / "X companies" | — | ❓ | List endpoint returns array; not clear if it returns total count. **Check `PublicCompanyListItem`'s wrapper** — may need to add `{items[], total, page}` envelope. |

### Company detail (`/intelligence/companies/[slug]`)

| Mockup feature | Backend field | Status | Notes |
|---|---|---|---|
| Company name + legal name + HQ | `name`, `legal_name`, facts | ⚡ | HQ likely lives in `facts[]` |
| Risk band header | `band` | ⚡ | |
| Facts strip (HQ / Ticker / CIK / Stage / Founded etc.) | `facts[]` | ⚡ | Backend authored |
| Intro paragraph | `intro` | ⚡ | Null until admin flow — frontend needs fallback ("Placeholder generated one-liner" per memory) |
| Exposures table (material / stage / geography / risk band / risk score) | `exposures[]` | ⚡ | Renders as dashes for score/band until L1 populated |
| ❓ Exposure "exposure_score" (CME 0-1 dependence) | `exposures[].exposure_score` | ❓ | Backend returns this; verify mockup surfaces it (may be a bar / weight indicator) |
| Facilities list (name, type, country, place, status pill) | `facilities[]` + `facilities_total` | ⚡ | Backend limits to 8; if mockup shows all, need `?limit=all` param OR pagination |
| Facilities status pills (op / ramp / build) | `facilities[].status_level` | ⚡ | Server-formatted |
| ❓ Facility map | — | ❓ | Common on mining-industry pages. Backend has lat/lon in facility rows but NOT exposed via `FacilityOut` — would need `➕ new backend fields lat, lon`. **Ask Nicole: mockup shows a map?** |
| Linked posts feed | `linked_posts[]` | ⚡ | Reuse `FeedRow` component |
| Linked events list | `linked_events[]` | ⚡ | Empty until Phase-5 flag flips — render fallback "No linked events yet" |
| ❓ Score breakdown by pillar (Material / Geo / Regulatory / Ops) | — | ❓ | If mockup shows a pillar breakdown card, need `➕ backend to return `pillar_scores{material,geo,regulatory,operational}` on the profile. Currently only overall `band`. |
| ❓ "Related companies" or peer set | — | ❓ | If mockup shows peers, need `➕ new endpoint or field`. Consider dropping — low signal until we have curated peer sets. |
| ❓ Data source citations | — | 🗑❓ | Mockup may show a "sources" footer. Facilities have source_url on the underlying row; not exposed via `FacilityOut`. Consider dropping for launch (public site is editorial not audit trail). |

### Regulation browse (`/intelligence/regulations`)

| Mockup feature | Backend field | Status | Notes |
|---|---|---|---|
| Regulation title + issuer | `title`, `issuer` | ⚡ | |
| Geography (issuing jurisdiction) | `geography` | ⚡ | |
| Theme chip | `theme` | ⚡ | |
| Status pill (In force / Proposed / Pending) | `status`, `status_level` | ⚡ | Server-formatted |
| Effective date | `effective_date` | ⚡ | |
| Search | `q` | ⚡ | |
| Theme filter | `theme` | ⚡ | |
| Status filter | `status` | ⚡ | |
| ❓ Result count / pagination | — | ❓ | Same envelope question as companies list |
| ❓ Sort | — | ❓ | Same as companies |

### Regulation detail (`/intelligence/regulations/[regulation_key]`)

| Mockup feature | Backend field | Status | Notes |
|---|---|---|---|
| Regulation title + issuer + geography | `title`, `issuer`, `geography` | ⚡ | |
| Theme chip + status pill | `theme`, `status_level` | ⚡ | |
| Summary paragraph | `summary` | ⚡ | |
| Timeline (published / effective / phase-in) | `timeline[]` | ⚡ | Includes `active` + `future` flags for styling |
| Materials scope list | `materials_scope[]` | ⚡ | Includes scope_type + severity_multiplier |
| Geographies scope | `geographies_scope[]` | ⚡ | Distinguishes jurisdiction / origin_country / targeted_country |
| Compliance weights (top-8 countries) | `compliance_weights[]` | ⚡ | Values 0-1; per memory this REPLACES the mock "+18/×1.15" placeholder |
| Source URL | `source_url` | ⚡ | |
| Linked posts | `linked_posts[]` | ⚡ | Reuse `FeedRow` |
| Linked events + count | `linked_events[]`, `linked_event_count` | ⚡ | |
| ❓ "Countries most affected" ranked list | — | ❓ | The `compliance_weights[]` field basically is this — verify mockup uses this list rather than a separate ranked view |
| ❓ Related regulations | — | ❓ | Not in backend. Consider dropping. |
| ❓ Full-text PDF viewer | — | 🗑❓ | If mockup embeds PDF, big scope. Consider "Read full text →" link to `source_url` instead. |

---

## 5. Questions to answer before building

Please review and mark answers:

1. **Do you have the DesignSync mockup HTML somewhere I can read?** If yes,
   drop the files under `app/(hub)/_mockup_reference/` (git-ignored is fine) so
   I can replace the ❓ inferences with actual matches. If no, I can build against
   what the backend already serves and iterate when we see the pages side-by-side.

2. **List/detail envelope shape.** Do the browse endpoints return `[item, ...]` or
   `{items: [...], total: N, page: N}`? Verify in
   `app/api/routes/intelligence_entities.py`. If it's a bare array, decide whether
   to add a wrapper now (small backend change) or handle "no total" client-side.

3. **Facility map on company detail.** If mockup shows a map, add `lat`/`lon` to
   `FacilityOut`. If not, skip.

4. **Pillar score breakdown on company detail.** If mockup shows Material / Geo /
   Regulatory / Operational pillar bars, add `pillar_scores` to `PublicCompanyProfile`.
   If just the overall band, skip.

5. **Search / sort / filter parity across list pages.** Confirm whether mockups
   show a sort dropdown or if search + filters are enough.

6. **Related entities.** Do mockups show "related companies" / "related regulations"
   sections? If yes, that's new backend work. If no, drop.

7. **Consumption of dashboard-shared components.** Can hub pages import from
   `components/shared/` (CountryFlag, etc.) or should hub components be strictly
   isolated to `components/hub/`? The former saves duplication; the latter keeps
   the Wine+Stone design surface pure.

---

## 6. Proposed build order (once discrepancies resolved)

Assuming mostly ⚡/🔧 matches:

**Phase 1 — API client + types**
- `lib/api/entities.ts` — add `listCompanies`, `getCompany`, `listRegulations`, `getRegulation` against `/api/v1/intelligence/*`
- `components/hub/entityTypes.ts` — TypeScript mirrors of `PublicCompanyProfile` / `PublicRegulationDetail`

**Phase 2 — shared entity primitives**
- `components/hub/EntityHeader.tsx` — title + subtitle + band pill (reused by company + regulation)
- `components/hub/RiskBand.tsx` — pill component consuming `band.{label,level}` (align with `hub.css` `--risk-high/med/low` tokens)
- `components/hub/EntityFacts.tsx` — key-value strip (reused by both)
- `components/hub/Breadcrumb.tsx`

**Phase 3 — company pages**
- `app/(hub)/intelligence/companies/page.tsx` — list + filters
- `app/(hub)/intelligence/companies/[slug]/page.tsx` — profile
- `components/hub/company/ExposuresTable.tsx`
- `components/hub/company/FacilitiesList.tsx`

**Phase 4 — regulation pages**
- `app/(hub)/intelligence/regulations/page.tsx`
- `app/(hub)/intelligence/regulations/[regulation_key]/page.tsx`
- `components/hub/regulation/Timeline.tsx`
- `components/hub/regulation/ScopePanels.tsx` (materials + geographies + compliance weights)

**Phase 5 — linked intelligence integration**
- Reuse existing `components/hub/FeedRow.tsx` for `linked_posts[]` sections on
  both detail pages
- Simple event list for `linked_events[]` (grouped by date, with severity indicator)

---

## 7. Non-goals for this round (be honest about scope)

- Admin authoring UI for `intro` — separate track, per memory
- Post-tagging UI hint — separate track
- Company unpublish action — separate track (backend already respects `is_published`)
- Live map with global facility overlays — likely a v2 feature
- User accounts / bookmarking on the public hub — not in launch scope
