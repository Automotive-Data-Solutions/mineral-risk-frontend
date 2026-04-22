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
export type CompanyEventRead = Schemas["CompanyEventRead"];
export type FacilityRead = Schemas["FacilityRead"] & { verified?: boolean };
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
  FacilityListItem,
  MaterialListResponse,
  RegulationListResponse,
  RiskEventListResponse,
  FacilityListResponse,
  ChemistryListResponse,
  HsCodeMappingMismatchListResponse,
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

export type DashboardOverview = Schemas["DashboardOverview"];
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
