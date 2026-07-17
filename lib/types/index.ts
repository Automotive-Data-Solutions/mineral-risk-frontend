/**
 * Domain-type aliases pulled from the auto-generated OpenAPI schema in
 * ``./api.ts``. Always import from ``@/lib/types`` (never from ``./api`` or
 * ``components['schemas']['...']`` directly) so types track the backend.
 *
 * Regenerate ``api.ts`` with ``npm run types:generate:file`` (reads the
 * exported ``openapi.json`` in the backend repo) or ``npm run types:generate``
 * (hits a running backend at ``http://localhost:8000``).
 */

import type { components } from "./api";

type Schemas = components["schemas"];

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export type CompanyListItem = Schemas["CompanyListItem"];
export type CompanyDetail = Schemas["CompanyDetail"];
export type CompanySummary = Schemas["CompanySummary"];
export type CompanyAliasRead = Schemas["CompanyAliasRead"];

// NOTE: `verified` is added via intersection until `npm run types:generate:file`
// is run after the 008_verified_flags Alembic migration is applied.
export type ExposureRead = Schemas["ExposureRead"] & { verified?: boolean };
export type RelationshipsResponse = Schemas["RelationshipsResponse"];
export type RelationshipRead = Schemas["RelationshipRead"] & { verified?: boolean };
export type RelationshipCounterparty = Schemas["RelationshipCounterparty"];
export type RegulationExposureRead = Schemas["RegulationExposureRead"] & { verified?: boolean };
// NOTE: event_link_id, review_status, review_note added via intersection
// until npm run types:generate:file is run after migration 009.
export type CompanyEventRead = Schemas["CompanyEventRead"] & {
  event_link_id?: string;
  review_status?: "pending" | "confirmed" | "excluded";
  review_note?: string | null;
};
// NOTE: company_facility_id, ownership_type, ownership_pct, verified, data_source added
// via intersection until npm run types:generate:file is run after migration 010.
export type FacilityRead = Schemas["FacilityRead"] & {
  company_facility_id?: string;
  ownership_type?: string;
  ownership_pct?: number | null;
  verified?: boolean;
  data_source?: string | null;
};
export type VehicleModelRead = Schemas["VehicleModelRead"] & { verified?: boolean };
export type VehicleModelChemistryRead = Schemas["VehicleModelChemistryRead"];

// ---------------------------------------------------------------------------
// Reference data (Phase 2 — partially generated, partially hand-authored)
// ---------------------------------------------------------------------------

// Computed scoring-impact fields exposed by the backend (added 2026-05-06,
// via @computed_field on RegulationRead).  Layered as an intersection
// until ``npm run types:generate:file`` regenerates ``api.ts`` against
// the updated FastAPI schema.
type RegulationScoringFields = {
  /** Per non-compliant company uplift points from
   *  ``regulatory_risk.COMPLIANCE_OBLIGATIONS``.  0 when the regulation
   *  has no entry in the obligation table.
   */
  compliance_uplift_points?: number;
  /** Per-event severity weight from
   *  ``eurlex.SEVERITY_BY_STATUS`` (effective 0.55 / enacted 0.40 /
   *  proposed 0.25 / default 0.35).
   */
  status_severity_weight?: number;
  /** True when today is within ±90 days of effective_date — recency
   *  multiplier steps up to 1.10–1.20 in that window.
   */
  proximity_window_active?: boolean;
};

export type RegulationRead = Schemas["RegulationRead"] &
  RegulationScoringFields;
export type RegulationMaterialScopeRead = Schemas["RegulationMaterialScopeRead"];
export type RegulationGeographyScopeRead = Schemas["RegulationGeographyScopeRead"];
export type RegulationDetail = Schemas["RegulationDetail"] &
  RegulationScoringFields;
export type RiskEventRead = Schemas["RiskEventRead"];

export type {
  MaterialListItem,
  MaterialListPillarScore,
  MaterialListCountryShare,
  MaterialDetail,
  MaterialCriticalitySignal,
  MaterialChemistryUse,
  MappingHealth,
  HsCodeMaterialMappingRead,
  HsMappingMismatchReason,
  BatteryChemistryRead,
  ChemistryRiskScoreRead,
  ChemistryMaterialRead,
  ChemistryDetailRead,
  MaterialGeographyScoreRead,
  MaterialGeographyScoreDetail,
  MaterialGlobalScoreRead,
  MarketScoreEvidence,
  EvidenceRegulationItem,
  EvidenceFacilityItem,
  EvidenceRiskEventItem,
  MaterialRiskEventRow,
  MaterialRiskEventsSummary,
  MaterialRiskEventsResponse,
  RescoredResult,
  FacilityListItem,
  MaterialListResponse,
  RegulationListResponse,
  RiskEventListResponse,
  FacilityListResponse,
  ChemistryListResponse,
  MarketScoresResponse,
} from "./reference-data";

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export type AnalystNoteRead = Schemas["AnalystNoteRead"];
export type AnalystNoteCreate = Schemas["AnalystNoteCreate"];
export type NoteType = AnalystNoteCreate["note_type"];

/**
 * Entities the Phase 2 ``EntityFlagIssueDialog`` knows how to flag.
 *
 * Mirrors the ``analyst_notes.entity_type`` enum on the backend (see
 * ``.cursorrules`` → "Notes / Flag-Issue Pattern"). Keep these in sync
 * with the per-entity ``POST .../notes`` routes.
 */
export type FlaggableEntityType =
  | "company"
  | "material"
  | "company_material_exposure"
  | "hs_code_material_mapping"
  | "regulation"
  | "risk_event"
  | "facility"
  | "battery_chemistry";

/** Body sent to every per-entity ``POST .../notes`` route. */
export interface EntityNoteCreate {
  note_type: NoteType;
  note_text: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface ProductionCountryItem {
  code: string;
  share_pct: number;
}
export interface TopMaterialRisk {
  material_id: number;
  canonical_name: string;
  symbol_or_code: string | null;
  category: string | null;
  overall_risk_score: number;
  top_countries: ProductionCountryItem[];
  trend: string | null;
  as_of_date: string;
}
export interface PillarProgress {
  name: string;
  label: string;
  signal_pct: number;   // % pairs with score > 0 (actual data driving it)
  computed_pct: number; // % pairs with non-null score (includes floor zeros)
}
export interface ScoreRunProgress {
  last_run_date: string | null;
  valid_geographies: number;   // distinct geos with event_count > 0
  valid_materials: number;     // distinct materials with event_count > 0
  scored_geographies: number;
  scored_materials: number;
  total_geographies: number;
  total_materials: number;
  pillars: PillarProgress[];
}
export interface RecentNoteItem {
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  note_type: string;
  note_text: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// New launch-list-centric KPI shapes (2026-05-11)
// ---------------------------------------------------------------------------
// The Overview dashboard pivoted from generic platform metrics to launch-
// list-centric analyst metrics ("how many of the core 10 minerals are
// scored / have signal / need attention?").  These three shapes back the
// new KPI strip; the legacy fields (material_count_total etc.) remain in
// the response object for backwards-compat but are no longer rendered.

export interface CoreMineralsScored {
  scored: number;
  total: number;
  /** Canonical names of launch-list materials WITHOUT a current global
   * score.  Click-through views render the full list. */
  unscored_names: string[];
}

export interface SourceCount {
  source_name: string;
  count: number;
}

export interface RecentRiskEvents30d {
  count: number;
  /** Same query for the [60d, 30d) window — used to compute the
   * up/down delta in the KPI card. */
  prev_period_count: number;
  /** Top sources by event count in the trailing 30-day window, capped
   * at 5 by the backend. */
  top_sources: SourceCount[];
}

export interface CoverageGapItem {
  material_id: number; // -1 sentinel = material row missing entirely
  canonical_name: string;
  /** Composable reason tags.  Any combination of:
   *   "no_global_score"        — no MaterialGlobalRiskScore row
   *   "material_row_missing"   — material not in DB at all
   *   "stale_score"            — latest as_of_date > 30 days old
   *   "thin_events"            — < 5 events in last 90 days
   *   "thin_pillars"           — < 3 pillars have non-fallback signal
   *   "no_facility_coverage"   — zero FacilityMaterialLink rows with
   *                              annual_capacity_tpy set (operational
   *                              pillar can't get credible signal)
   */
  reasons: string[];
}

export interface CoverageGaps {
  count: number;
  materials: CoverageGapItem[];
}

// ---------------------------------------------------------------------------
// Coverage matrix (separate endpoint, 2026-05-11)
// ---------------------------------------------------------------------------

export interface CoverageMatrixPillar {
  name: string;        // e.g. "material_concentration_score"
  label: string;       // e.g. "Material Concentration"
  score: number | null;
  /** True when score > 0 — the cell has real data behind it.  False when
   *  score is 0 (fallback / floor) or null (no row at all). */
  has_signal: boolean;
}

export interface CoverageMatrixSourceCount {
  source_name: string;
  event_count_90d: number;
}

export interface CoverageMatrixRow {
  material_id: number; // -1 sentinel = material not in DB
  canonical_name: string;
  sources: CoverageMatrixSourceCount[];
  pillars: CoverageMatrixPillar[];
}

export interface PillarCoverageStat {
  /** Column attribute name on MaterialGlobalRiskScore. */
  name: string;
  /** Display label, e.g. "Material Concentration". */
  label: string;
  /** Launch-list materials where this pillar's score > 0. */
  materials_with_signal: number;
  /** Launch-list materials where this pillar's score is non-null
   *  (includes 0 / fallback values). */
  materials_with_score: number;
  /** Launch-list size minus sentinel rows.  Denominator for the bar. */
  total: number;
}

export interface CoverageMatrix {
  window_days: number;       // 90 in the current calibration
  /** All sources that produced any event in the window, ordered by
   *  descending total event count (highest-signal source first). */
  sources_in_order: string[];
  /** Pillar column labels in canonical order. */
  pillar_columns: string[];
  /** One row per launch-list material, in canonical launch-list order. */
  rows: CoverageMatrixRow[];
  /** Per-pillar aggregate stats over the launch list.  Drives the
   *  dedicated Pillar Coverage card.  Same data as ``rows[].pillars[]``
   *  in a different shape. */
  pillar_coverage: PillarCoverageStat[];
}

// Extended until api.ts is regenerated after new dashboard fields are deployed
export type DashboardOverview = Schemas["DashboardOverview"] & {
  // Legacy fields — present for backwards-compat with the 2026-04 KPI
  // strip; the new analyst-view strip ignores these.
  material_count_total?: number;
  material_count_this_quarter?: number;
  suspect_mappings_count?: number;
  recent_notes_entity_count_7d?: number;
  // 2026-05-11 launch-list-centric KPIs
  core_minerals_scored?: CoreMineralsScored | null;
  recent_risk_events_30d?: RecentRiskEvents30d | null;
  coverage_gaps?: CoverageGaps | null;
  // Sections below the KPI strip
  top_materials_by_risk?: TopMaterialRisk[];
  score_run_progress?: ScoreRunProgress | null;
  recent_activity?: RecentNoteItem[];
};
export type StageCount = Schemas["StageCount"];
export type ConfidenceBucket = Schemas["ConfidenceBucket"];

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

export type RiskBand = "LOW" | "MOD" | "HIGH" | "CRIT";

/**
 * Paginated list envelope. The generated OpenAPI schema describes only one
 * PaginatedResponse (for ``CompanyListItem``), so we expose a generic here
 * for reuse by future list endpoints.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Shape of the FastAPI ``HTTPException``-handler response. */
export interface ApiErrorPayload {
  error: string;
  detail: string | Record<string, unknown> | unknown[];
}

/** Supply-chain-stage enum values (used by badges + filters). */
export type SupplyChainStage =
  | "oem"
  | "cell_maker"
  | "miner"
  | "refiner"
  | "recycler"
  | "holding"
  | "pack_maker"
  | "trader"
  | "other";

export const SUPPLY_CHAIN_STAGES: SupplyChainStage[] = [
  "oem",
  "cell_maker",
  "miner",
  "refiner",
  "recycler",
  "holding",
  "pack_maker",
  "trader",
  "other",
];

/** Analyst note types offered by the Flag Issue dialog. */
export const NOTE_TYPES: NoteType[] = [
  "data_error",
  "missing_data",
  "outdated",
  "other",
];
