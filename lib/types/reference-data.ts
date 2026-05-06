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
  /** ISO-2 country codes for primary producing countries, e.g. ["CN","CD","AU"]. */
  primary_producing_countries: string[] | null;
  /** Latest global composite risk score (0–100). Null if never scored. */
  latest_overall_risk_score: number | null;
  /** Total rows in `hs_code_material_mappings` for this material. */
  hs_mapping_count: number;
  /** Subset of those mappings the backend flagged as suspect. */
  mapping_mismatch_count: number;
  verified: boolean;
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
  event_count: number;
  scoring_version: string;
  /** ISO datetime. */
  created_at: string;
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
// Paginated wrappers
// ---------------------------------------------------------------------------

export type MaterialListResponse = PaginatedResponse<MaterialListItem>;
export type RegulationListResponse =
  PaginatedResponse<import("./index").RegulationRead>;
export type RiskEventListResponse =
  PaginatedResponse<import("./index").RiskEventRead>;
export type FacilityListResponse = PaginatedResponse<FacilityListItem>;
export type ChemistryListResponse = PaginatedResponse<BatteryChemistryRead>;
export type HsCodeMappingMismatchListResponse =
  PaginatedResponse<HsCodeMaterialMappingRead>;
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
