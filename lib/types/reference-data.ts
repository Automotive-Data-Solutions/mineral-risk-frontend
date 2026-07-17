/**
 * Phase-2 reference-data types.
 *
 * The FastAPI backend hasn't shipped these schemas yet, so we hand-author
 * them here to match the contract documented in `.cursorrules`. As soon
 * as the backend exposes them through `openapi.json`, run
 *   ``npm run types:generate:file``
 * and replace each interface below with `Schemas["MaterialListItem"]` etc.
 *
 * Do NOT use `any` — keep these in lockstep with the backend Pydantic
 * models. When you swap to generated types, delete this file's interfaces
 * (keep the type aliases in `./index.ts` pointing at the new home).
 */

import type { PaginatedResponse } from "./index";

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export interface MaterialListPillarScore {
  /** Column attr name, e.g. "material_concentration_score". */
  name: string;
  /** Display label, e.g. "Material Concentration". */
  label: string;
  score: number | null;
  /** True when score > 0 (real signal); false when 0 (fallback) or null. */
  has_signal: boolean;
}

export interface MaterialListCountryShare {
  code: string;        // ISO-2
  share_pct: number;   // 0–100, rounded
}

export interface MaterialListItem {
  /** Integer PK from `materials.id` (serialized as number). */
  id: number;
  canonical_name: string;
  category: string | null;
  /** Chemical symbol or short code, e.g. "Li", "Co", "REE". */
  symbol_or_code: string | null;
  /** 0..1 */
  criticality_score: number | null;
  is_ira_critical_mineral: boolean;
  is_eu_crma_critical: boolean;
  data_availability: string | null;
  /** Legacy ISO-2-only list.  Kept for backwards-compat; prefer
   *  `top_producer_shares` for new UI. */
  primary_producing_countries: string[] | null;
  /** Latest global composite risk score (0–100). Null if never scored. */
  latest_overall_risk_score: number | null;
  /** Total rows in `hs_code_material_mappings` for this material.  No
   *  longer rendered (HS mismatch UI retired 2026-05-11); kept on the
   *  type for backwards-compat. */
  hs_mapping_count: number;
  /** Always 0 since 2026-05-11.  Retained for backwards-compat. */
  mapping_mismatch_count: number;
  verified: boolean;

  // 2026-05-11 analyst-view extensions
  /** Whether the material is in the launch list (the v1 core 10). */
  is_launch_list: boolean;
  /** Up to 3 top producers with share %.  Sorted by share descending. */
  top_producer_shares: MaterialListCountryShare[];
  /** Latest per-pillar score data for the 5 risk pillars in canonical
   *  order.  Drives the 5-dot coverage indicator. */
  pillar_scores: MaterialListPillarScore[];
  /** Count of RiskEvents in last 90 days mapped to this material. */
  recent_event_count_90d: number;
}

/**
 * One row from `material_criticality_signals`.
 * Source hierarchy: eu_crma > iea_report > usgs_mcs > manual > patstat
 *
 * All eight signal columns plus ``metadata_json`` and ``created_at`` are
 * exposed by the API (May 2026).  Use them to drive the Overview tab's
 * supply-side / price-trend stat strip without hitting any other endpoint.
 */
export interface MaterialCriticalitySignal {
  id: number;
  /** "usgs_mcs" | "eu_crma" | "iea_report" | "manual" | "patstat" */
  source: string;
  reference_year: number;

  // ── Concentration / criticality ──────────────────────────────────────
  /** Normalised 0..1. For usgs_mcs equals normalised HHI. */
  criticality_score: number | null;
  /** "rising" | "declining" | "stable" — denormalized cache. */
  trend_direction: string | null;
  /** Raw HHI 0..1 (Σ share_i²) on production shares. */
  hhi_score: number | null;

  // ── Supply metrics (migration 019) ───────────────────────────────────
  /** HHI 0..1 over country reserve distribution. Forward-looking concentration. */
  reserve_hhi_score: number | null;
  /** Years of supply at current production rate (world reserves / world annual). */
  reserve_life_index: number | null;
  /** Signed fraction YoY change in world production (e.g. -0.05 = -5%). */
  production_yoy_pct: number | null;
  /** Production / capacity 0..1. NULL when MCS doesn't publish capacity. */
  capacity_utilization: number | null;

  // ── Price-trend metrics (migration 036) ──────────────────────────────
  /** Signed fraction YoY price change (e.g. 1.44 = +144%). Sourced from MCS Fig 10. */
  price_yoy_pct: number | null;
  /** Signed fraction 5-year CAGR of price. */
  price_cagr_5yr_pct: number | null;

  // ── US-dependency metrics (migration 038, promoted from metadata_json) ─
  /** USGS Net Import Reliance % (0..100). Bounded estimates stored as midpoints. */
  us_net_import_reliance_pct: number | null;
  /** US apparent consumption volume (latest year, source unit). */
  us_apparent_consumption: number | null;

  /**
   * Source-specific extras still living in JSONB.  Common keys:
   *   ``mcs_publication_year``: number
   *   ``fig10_source_rows``: string[]
   */
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

/**
 * One junction row from `battery_chemistry_materials`, enriched with
 * the parent chemistry's slug and name by the route handler.
 */
export interface MaterialChemistryUse {
  id: number;
  battery_chemistry_id: number;
  chemistry_slug: string | null;
  chemistry_name: string | null;
  /** "cathode_active" | "anode" | "electrolyte" | "current_collector" | "other" */
  role: string;
  /** 0..1 — relative material intensity within the chemistry. */
  intensity: number;
  is_substitutable: boolean;
}

export interface MappingHealth {
  total: number;
  mismatched: number;
  low_confidence: number;
  missing_description: number;
}

export interface CountryShareItem {
  /** ISO-2 country code, uppercased. */
  code: string;
  /** Rounded integer percentage, e.g. 47. */
  share_pct: number;
}

export interface MaterialDetail extends MaterialListItem {
  criticality_signals: MaterialCriticalitySignal[];
  chemistry_uses: MaterialChemistryUse[];
  /**
   * Normalized from backend's `hs_mappings` key by the API client.
   */
  hs_code_mappings: HsCodeMaterialMappingRead[];
  mapping_health: MappingHealth;
  created_at: string;
  updated_at: string;
  // symbol_or_code and primary_producing_countries are now inherited from MaterialListItem
  /** Production share breakdown from material_production_shares, latest year only. */
  country_production_shares: CountryShareItem[];
  /** "per_mt" | "per_kg" */
  price_unit?: string | null;
  /** "rising" | "declining" | "stable" — denormalized cache from criticality_signals. */
  patent_occurrence_trend?: string | null;
  /** Free-text analyst notes on this material. */
  notes?: string | null;
  /**
   * Official HS codes recorded on the material record itself (JSONB array,
   * e.g. ["2825.20", "2836.91"]). Distinct from the many-to-many
   * hs_code_material_mappings rows — this is the "source of truth" list
   * used to validate mappings.
   */
  hs_codes?: string[] | null;

  // 2026-05-11 analyst-view extensions for the Materials detail Overview.
  // ``recent_event_count_90d`` is inherited from MaterialListItem (which
  // also surfaces it on the list rows); declared on the parent so the
  // type narrowing stays consistent and we don't re-declare here.
  /** Count of FacilityMaterialLink rows for this material. */
  facility_count?: number;
  /** Composite risk-score trend — "rising" / "stable" / "declining" / null.
   *  Compares the latest MaterialGlobalRiskScore.overall to the most
   *  recent snapshot at least 7 days older (max 30 days lookback).
   *  ±5-point threshold on the 0-100 scale.  null when there's no prior
   *  snapshot (insufficient history) — UI renders "—".  Semantic answer
   *  to "is risk going up?" rather than "are there more events?". */
  score_trend_7d?: string | null;
}

// ---------------------------------------------------------------------------
// HS-code ↔ material mappings (rows from the existing
// `hs_code_material_mappings` table)
// ---------------------------------------------------------------------------

export type HsMappingMismatchReason =
  | "low_confidence"
  | "missing_description"
  | "category_chapter_mismatch"
  | "duplicate_hs_prefix";

/**
 * Mirrors the `hs_code_material_mappings` table 1:1 plus a server-derived
 * ``mismatch_reasons`` array (computed in the route, not stored).
 *
 * Stored columns (from the live DB):
 *   id (serial PK), hs_code_prefix (varchar), material_id (int FK→materials),
 *   description (varchar 512), confidence (double precision),
 *   supply_chain_stage (varchar 16), stage_sequence (smallint),
 *   digit_count (smallint), market_scope (varchar 8),
 *   keywords (jsonb array), created_at (timestamptz)
 */
export interface HsCodeMaterialMappingRead {
  id: number;
  /**
   * The leading digits of an HS trade code (typically 2/4/6 digit prefix,
   * e.g. "2504"). Any HS code starting with this prefix is treated as the
   * mapped material.
   */
  hs_code_prefix: string;
  /** Integer FK → materials.id. */
  material_id: number;
  /** Joined from materials.canonical_name for the global mismatches view. */
  material_name?: string | null;
  /** Trade description from the HS reference (varchar 512). */
  description: string | null;
  /** 0..1 mapping confidence. */
  confidence: number | null;
  /**
   * Supply-chain stage assignment from seed_hs_mappings. One of
   * ``ore | concentrate | intermediate | refined | battery_grade |
   * fabricated | scrap`` or null when not yet assigned.
   */
  supply_chain_stage: string | null;
  /**
   * Numeric ordering of the stage (1=ore … 7=scrap). Used by the
   * frontend to sort stage groupings without re-encoding the order.
   */
  stage_sequence: number | null;
  /** 4 | 6 | 8 | 10 — precision of the prefix. */
  digit_count: number;
  /** ``"global"`` (4/6-digit WCO) or ``"us"`` (10-digit US HTS) or ``"eu"``. */
  market_scope: string;
  /**
   * Partner-curated compound/trade-name aliases used by the resolver for
   * event attribution (e.g. ``["bauxite", "aluminum ore"]`` for HS 2606).
   * Null means not yet seeded — treat as empty.
   */
  keywords: string[] | null;
  created_at: string;
  /**
   * Server-derived (NOT a stored column). Computed by the FastAPI route and
   * attached to each row so the comparison view can render badges without a
   * second request. See "Mismatched detection criteria" in `.cursorrules`.
   */
  mismatch_reasons: HsMappingMismatchReason[];
}

// ---------------------------------------------------------------------------
// Battery chemistries
// ---------------------------------------------------------------------------

/**
 * One row from `chemistry_risk_scores`. Mirrors the backend
 * ``ChemistryRiskScoreRead`` Pydantic schema 1:1.
 */
export interface ChemistryRiskScoreRead {
  id: number;
  /** ISO date. */
  as_of_date: string;
  methodology_version: string;
  material_concentration_score: number | null;
  geopolitical_score: number | null;
  composite_risk_score: number | null;
  /** 0..1 confidence in the composite score. */
  score_confidence: number | null;
  /** ISO datetime. */
  computed_at: string;
  metadata_json: Record<string, unknown> | null;
}

/**
 * Mirrors the backend ``BatteryChemistryRead`` schema 1:1.
 *
 * NOTE: backend uses ``name`` (not ``display_name``) and exposes the
 * latest joined risk score as a nested object rather than a scalar.
 */
export interface BatteryChemistryRead {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  current_market_share_pct: number | null;
  market_share_as_of_date: string | null;
  is_active: boolean;
  verified: boolean;
  created_at: string;
  updated_at: string;
  latest_risk_score: ChemistryRiskScoreRead | null;
}

/**
 * Single row from ``chemistry_materials`` joined with
 * ``materials.canonical_name`` server-side.
 */
export interface ChemistryMaterialRead {
  id: number;
  material_id: number;
  material_canonical_name: string;
  role: string;
  /** 0..1 — fraction of the chemistry mass made up by this material. */
  intensity: number;
  is_substitutable: boolean;
  /** ISO date. */
  valid_from: string;
  /** ISO date or null for open-ended. */
  valid_to: string | null;
  notes: string | null;
}

export interface ChemistryDetailRead extends BatteryChemistryRead {
  active_materials: ChemistryMaterialRead[];
}

// ---------------------------------------------------------------------------
// Market scores (material × geography)
// ---------------------------------------------------------------------------

export interface MaterialGeographyScoreRead {
  id: number;
  material_id: number;
  /** ISO-2 country code, uppercase. */
  geography_code: string;
  /** ISO date. */
  as_of_date: string;
  material_concentration_score: number | null;
  geopolitical_trade_score: number | null;
  regulatory_compliance_score: number | null;
  operational_score: number | null;
  financial_pressure_score: number | null;
  overall_risk_score: number | null;
  /**
   * UNION of material-anchored and geography-anchored events consumed by
   * the pillar sub-input derivation. Preserves the audit trail of what was
   * actually fed into the score. For "this country × this material" reads,
   * use `event_count_geo_specific` instead — see migration 042.
   */
  event_count: number;
  /**
   * INTERSECTION (RiskEventMaterial ∩ RiskEventGeography) — count of events
   * tagged to BOTH this material AND this country, within each category's
   * lookback window. This is what the Events column should display and what
   * the Country-scores exposure filter keys off. `null` on rows produced
   * before migration 042 — re-run `POST /market/rescore` to populate.
   */
  event_count_geo_specific?: number | null;
  scoring_version: string;
  /** ISO datetime. */
  created_at: string;
  /**
   * Percentage share of global production for this material from this country
   * (latest reference_year). `null` if the country isn't a tracked producer.
   * Drives the "Share" column and the default material-exposure filter on the
   * Country scores tab.
   */
  production_share_pct?: number | null;
  /**
   * Number of FacilityMaterialLink rows whose facility sits in this country
   * AND links to this material. Helps the analyst spot operational exposure
   * (a country that doesn't produce but houses processing/refining facilities).
   */
  facility_count?: number;
}

/**
 * Single-pair detail view — includes rationale_json for evidence display.
 * Returned by GET /materials/{id}/market-scores/{geography_code}.
 */
export interface MaterialGeographyScoreDetail extends MaterialGeographyScoreRead {
  rationale_json: {
    run_id?: string;
    scoring_version?: string;
    as_of_date?: string;
    criticality_signal?: {
      source?: string | null;
      reference_year?: number | null;
      criticality_score?: number | null;
      hhi_score?: number | null;
    };
    sub_inputs?: {
      material?: {
        criticality?: number;
        concentration?: number;
        trade_volatility?: number;
        stage_rollup_method?: string;
        stage_rollup_count?: number;
      };
      geopolitical?: {
        country_concentration?: number;
        export_restriction_exposure?: number;
        tariff_exposure?: number;
      };
      regulatory?: {
        top_event_count?: number;
        scope_obligations?: number;
        policy_proximity_adjustment?: number;
      };
      operational?: {
        structural_dependency?: number;
        structural_dependency_source?: string;
        event_impact_count?: number;
      };
      financial_pressure?: {
        base_filing_signal?: number;
        leverage_warning_bonus?: number;
        liquidity_stress_bonus?: number;
        evidence_count?: number;
        sec_edgar_company_signal?: Record<string, unknown>;
      };
    };
    pillar_scores?: Record<string, number>;
    weights_used?: Record<string, number>;
    event_counts?: {
      trade_events?: number;
      operational_events?: number;
    };
    notes?: string;
  } | null;
}

/**
 * Trade-flow-weighted global rollup — one row per material per scoring date.
 * Mirrors ``material_global_risk_scores`` and feeds chemistry risk scoring.
 */
export interface MaterialGlobalScoreRead {
  id: number;
  material_id: number;
  /** ISO date. */
  as_of_date: string;
  material_concentration_score: number | null;
  geopolitical_trade_score: number | null;
  regulatory_compliance_score: number | null;
  operational_score: number | null;
  financial_pressure_score: number | null;
  overall_risk_score: number | null;
  /** How many geographies contributed a non-zero weight. */
  trade_weighted_geo_count: number;
  /** Sum of trade_value_usd used as denominator; null when production shares or equal weights used. */
  total_trade_value_usd: number | null;
  /** ISO datetime. */
  created_at: string;
}

export interface RescoredResult {
  scored: number;
  /** ISO date. */
  as_of_date: string;
  run_id: string;
}

// ---------------------------------------------------------------------------
// Market-score drill-down evidence (single (material × country) aggregation)
// ---------------------------------------------------------------------------

/**
 * One regulation scoping BOTH this material AND this country.
 * Returned by GET /materials/{id}/market-scores/{geo}/evidence.
 */
export interface EvidenceRegulationItem {
  id: number;
  regulation_key: string;
  title: string | null;
  issuing_body: string | null;
  status: string | null;
  /** ISO date. */
  effective_date: string | null;
  summary: string | null;
  /** covered | restricted | banned | disclosure_required — from RegulationMaterialScope.scope_type. */
  material_scope_type: string;
  /** jurisdiction | origin_country | targeted_country — from RegulationGeographyScope.scope_type. */
  geography_scope_type: string;
  /** Per-geography curation 0.0–1.0; null when default (0.50) applies. */
  geography_compliance_weight: number | null;
}

/**
 * One facility located in this country and linked to this material.
 */
export interface EvidenceFacilityItem {
  /** UUID. */
  id: string;
  name: string | null;
  /** mine | refinery | cell_factory | pack_plant | recycling | r_and_d | hq. */
  facility_type: string;
  /** operating | planned | under_construction | mothballed | closed. */
  status: string;
  region: string | null;
  city: string | null;
  capacity_notes: string | null;
  is_primary_product: boolean;
  /** Nameplate capacity in tonnes/year. */
  annual_capacity_tpy: number | null;
  /** ore | concentrate | intermediate | refined | battery_grade | fabricated | scrap. */
  supply_chain_stage: string | null;
}

/**
 * One risk event tagged to BOTH this material AND this country.
 */
export interface EvidenceRiskEventItem {
  id: number;
  title: string;
  event_type: string;
  event_subtype: string | null;
  severity_score: number | null;
  confidence_score: number | null;
  /** ISO date or null. */
  event_date: string | null;
  summary: string | null;
  /** Source.name — federal_register | global_trade_alert | eurlex | iea | etc. */
  source_system: string | null;
}

// ---------------------------------------------------------------------------
// Per-material Risk events tab (table rows + drawer + summary stats)
// ---------------------------------------------------------------------------

/** One row in the per-material Risk events table. */
export interface MaterialRiskEventRow {
  id: number;
  title: string;
  summary: string | null;
  event_type: string;
  event_subtype: string | null;
  severity_score: number | null;
  confidence_score: number | null;
  /** ISO datetime. */
  event_date: string | null;
  verified: boolean;
  /** Decoded pillar slugs from risk_categories_json. */
  pillars_affected: string[];
  /** Source.name — global_trade_alert / federal_register / etc. */
  source_system: string | null;
  /** Direct URL on the originating source (View source button). */
  source_url: string | null;
  /** ISO2 country codes tagged via RiskEventGeography. */
  geography_codes: string[];
}

/** Top-of-tab signal summary card data. */
export interface MaterialRiskEventsSummary {
  /** Mirrored from the request — drives the "Trailing N days" label. */
  window_days: number;
  total_events: number;
  /** Events with severity_score >= 0.75 within the window. */
  high_severity_count: number;
  verified_count: number;
  /** Pillar slug → event count.  Sums can exceed total when events have
   * multiple pillars. */
  events_by_pillar: Record<string, number>;
}

/** Response for GET /api/v1/materials/{id}/risk-events. */
export interface MaterialRiskEventsResponse {
  summary: MaterialRiskEventsSummary;
  events: MaterialRiskEventRow[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Aggregated evidence for one (material, country) pair.
 * Strict intersection — see backend module docstring for membership semantics.
 */
export interface MarketScoreEvidence {
  material_id: number;
  geography_code: string;
  regulations: EvidenceRegulationItem[];
  facilities: EvidenceFacilityItem[];
  risk_events: EvidenceRiskEventItem[];
  /** Pre-truncation counts so the UI can render "showing 6 of 27". */
  regulation_total: number;
  facility_total: number;
  risk_event_total: number;
  /** Days of lookback used for risk events (matches longest EVIDENCE_WINDOWS entry). */
  risk_event_window_days: number;
}

// ---------------------------------------------------------------------------
// Paginated wrappers
// ---------------------------------------------------------------------------

export type MaterialListResponse = PaginatedResponse<MaterialListItem>;
export type RegulationListResponse =
  PaginatedResponse<import("./index").RegulationRead>;
export type RiskEventListResponse =
  PaginatedResponse<import("./index").RiskEventRead>;
export type FacilityListResponse = PaginatedResponse<FacilityListItem>;
export type ChemistryListResponse = PaginatedResponse<BatteryChemistryRead>;
export type MarketScoresResponse =
  PaginatedResponse<MaterialGeographyScoreRead>;

// ---------------------------------------------------------------------------
// Facility list item
// ---------------------------------------------------------------------------

/**
 * Shape returned by ``GET /api/v1/facilities`` (global list).
 *
 * After migration 010, facilities are linked to companies via the
 * ``company_facilities`` junction table. The global list endpoint returns
 * pure facility data without company-scoped fields. Use
 * ``GET /api/v1/companies/{id}/facilities`` (which returns ``FacilityRead``)
 * when you need ownership and verified-link context.
 */
export interface FacilityListItem {
  id: string;
  facility_type: string;
  country: string;
  region: string | null;
  city: string | null;
  status: string;
  capacity_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  data_source: string | null;
  verified: boolean;
}
