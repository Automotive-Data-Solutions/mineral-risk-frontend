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
  /** 0..1 */
  criticality_score: number | null;
  is_ira_critical_mineral: boolean;
  is_eu_crma_critical: boolean;
  data_availability: string | null;
  /** Total rows in `hs_code_material_mappings` for this material. */
  hs_code_mapping_count: number;
  /** Subset of those mappings the backend flagged as suspect. */
  mapping_mismatch_count: number;
}

export interface MaterialCriticalitySignal {
  signal_key: string;
  label: string;
  value: number | string | null;
  source: string | null;
}

export interface MaterialChemistryUse {
  battery_chemistry_id: number;
  chemistry_slug: string;
  /** 0..1 — share of the chemistry mass made up by this material. */
  share_pct: number | null;
}

export interface MappingHealth {
  total: number;
  mismatched: number;
  low_confidence: number;
  missing_description: number;
}

export interface MaterialDetail extends MaterialListItem {
  criticality_signals: MaterialCriticalitySignal[];
  chemistry_uses: MaterialChemistryUse[];
  hs_code_mappings: HsCodeMaterialMappingRead[];
  mapping_health: MappingHealth;
  notes_count: number;
  created_at: string;
  updated_at: string;
  /** ISO-2 country codes for top producing nations, e.g. ["CN", "CD", "AU"]. Stored as JSONB. */
  primary_producing_countries?: string[] | null;
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
 *   description (varchar 512), confidence (double precision), created_at (timestamptz)
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

export interface BatteryChemistryRead {
  id: number;
  slug: string;
  display_name: string;
  category: string | null;
  /** 0..1 — most recent chemistry_risk_scores.overall, joined server-side. */
  latest_risk_score: number | null;
  latest_risk_band: string | null;
  notes: string | null;
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
