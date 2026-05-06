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

export type RegulationRead = Schemas["RegulationRead"];
export type RiskEventRead = Schemas["RiskEventRead"];

export type {
  MaterialListItem,
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
  RescoredResult,
  FacilityListItem,
  MaterialListResponse,
  RegulationListResponse,
  RiskEventListResponse,
  FacilityListResponse,
  ChemistryListResponse,
  HsCodeMappingMismatchListResponse,
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

// Extended until api.ts is regenerated after new dashboard fields are deployed
export type DashboardOverview = Schemas["DashboardOverview"] & {
  material_count_total?: number;
  material_count_this_quarter?: number;
  suspect_mappings_count?: number;
  recent_notes_entity_count_7d?: number;
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
