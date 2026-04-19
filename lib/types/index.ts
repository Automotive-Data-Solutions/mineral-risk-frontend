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

export type ExposureRead = Schemas["ExposureRead"];
export type RelationshipsResponse = Schemas["RelationshipsResponse"];
export type RelationshipRead = Schemas["RelationshipRead"];
export type RelationshipCounterparty = Schemas["RelationshipCounterparty"];
export type RegulationExposureRead = Schemas["RegulationExposureRead"];
export type CompanyEventRead = Schemas["CompanyEventRead"];
export type FacilityRead = Schemas["FacilityRead"];
export type VehicleModelRead = Schemas["VehicleModelRead"];
export type VehicleModelChemistryRead = Schemas["VehicleModelChemistryRead"];

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export type AnalystNoteRead = Schemas["AnalystNoteRead"];
export type AnalystNoteCreate = Schemas["AnalystNoteCreate"];
export type NoteType = AnalystNoteCreate["note_type"];

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
