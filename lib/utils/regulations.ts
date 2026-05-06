/**
 * Display helpers for regulation reference data.
 *
 * The backend stores enum-like fields (``policy_theme``, ``scope_type``,
 * ``status``) as snake_case strings to match the database column values
 * exactly. The UI shows them in human-readable form via the helpers
 * below. Country codes are translated to English names for the same
 * reason — partner reviewers shouldn't have to recognise ``CD`` as DR
 * Congo or ``KP`` as North Korea.
 *
 * Scope-type weight context (see backend
 * ``app/services/scoring/evidence_query.py::_SCOPE_TYPE_WEIGHT``):
 *
 *     banned                 0.70
 *     strategic_raw_material 0.65
 *     restricted             0.60
 *     disclosure_required    0.50
 *     covered                0.40
 *
 * Higher weight = the material's link to the regulation contributes
 * more to the regulatory pillar score. The visual severity ramp below
 * mirrors that ordering.
 */

import { humanize } from "./format";

// ---------------------------------------------------------------------------
// Scoring constants (mirrored from backend)
// ---------------------------------------------------------------------------
//
// Policy-stable constants the regulation-detail UI shows for partner review.
// Single source of truth for each lives on the backend — the values here
// MUST be kept in sync.  Source files:
//
//   MATERIAL_SCOPE_WEIGHTS  →  app/services/scoring/evidence_query.py
//                              :_SCOPE_TYPE_WEIGHT
//   COMPLIANCE_STATUS_WEIGHTS → app/services/scoring/evidence_query.py
//                              :_STATUS_WEIGHT (in get_active_compliance_obligations)
//   PILLAR_NAMES            →  docs/scoring.md
//
// Per-regulation values that DO change without code edits (status weight,
// uplift points, proximity window) come from the API as computed fields
// on RegulationRead — see types/index.ts ``RegulationScoringFields``.

/**
 * Weight applied to each material's link to a regulation, based on
 * scope_type.  Mirrors backend _SCOPE_TYPE_WEIGHT.  Higher = stronger
 * regulatory signal contribution at Level 1 (material × geography
 * regulatory pillar).
 */
export const MATERIAL_SCOPE_WEIGHTS: Record<string, number> = {
  banned: 0.7,
  strategic_raw_material: 0.65,
  restricted: 0.6,
  disclosure_required: 0.5,
  covered: 0.4,
};

export function materialScopeWeight(
  scopeType: string | null | undefined,
): number {
  if (!scopeType) return 0.5; // matches backend fallback
  return MATERIAL_SCOPE_WEIGHTS[scopeType] ?? 0.5;
}

/**
 * Per-company compliance status weight applied to obligation uplift.
 * non_compliant fully realises the regulation's compliance_uplift_points;
 * compliant produces zero uplift.  Mirrors backend _STATUS_WEIGHT.
 */
export const COMPLIANCE_STATUS_WEIGHTS: Record<string, number> = {
  non_compliant: 1.0,
  unknown: 0.5,
  partial: 0.4,
  compliant: 0.0,
};

/**
 * Maximum total obligation_score contribution at Level 4 (company
 * scoring), summed across all this company's regulation exposures.
 * Source: regulatory_risk.score_regulatory_profile
 *   ``obligation_score = min(40.0, sum(...))``.
 */
export const OBLIGATION_SCORE_CAP = 40;

/**
 * Maximum event-driven contribution to the regulatory pillar at Level 1.
 * Source: regulatory_risk.score_regulatory_profile
 *   ``event_score = (sum(top_3) / len(top_3)) * proximity * 60``.
 */
export const EVENT_SCORE_CAP = 60;

// ---------------------------------------------------------------------------
// Policy theme — descriptive only, does NOT affect scoring
// ---------------------------------------------------------------------------

const POLICY_THEME_LABELS: Record<string, string> = {
  supply_chain_due_diligence: "Supply chain due diligence",
  domestic_content_incentives: "Domestic content incentives",
  supply_chain_resilience: "Supply chain resilience",
  battery_lifecycle_compliance: "Battery lifecycle compliance",
  responsible_sourcing: "Responsible sourcing",
  chemicals_regulatory: "Chemicals regulatory",
  climate_disclosure: "Climate disclosure",
  carbon_pricing: "Carbon pricing",
  carbon_pricing_trade: "Carbon pricing (trade)",
  critical_materials_supply_security: "Critical materials supply security",
};

export function humanizePolicyTheme(value: string | null | undefined): string {
  if (!value) return "—";
  return POLICY_THEME_LABELS[value] ?? humanize(value);
}

// ---------------------------------------------------------------------------
// Material scope type — DOES affect scoring (see _SCOPE_TYPE_WEIGHT)
// ---------------------------------------------------------------------------

export type MaterialScopeType =
  | "banned"
  | "restricted"
  | "strategic_raw_material"
  | "disclosure_required"
  | "covered"
  | (string & {});

const MATERIAL_SCOPE_LABELS: Record<string, string> = {
  banned: "Banned",
  restricted: "Restricted use",
  strategic_raw_material: "Strategic raw materials",
  disclosure_required: "Disclosure required",
  covered: "Materials covered",
};

const MATERIAL_SCOPE_SHORT_LABELS: Record<string, string> = {
  banned: "Banned",
  restricted: "Restricted",
  strategic_raw_material: "Strategic",
  disclosure_required: "Disclosure",
  covered: "Covered",
};

export function humanizeMaterialScope(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return MATERIAL_SCOPE_LABELS[value] ?? humanize(value);
}

export function humanizeMaterialScopeShort(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return MATERIAL_SCOPE_SHORT_LABELS[value] ?? humanize(value);
}

/**
 * Tailwind class for the chip background + text colour. Visual intensity
 * follows the scoring rank in evidence_query._SCOPE_TYPE_WEIGHT:
 *
 *   banned       0.70  →  red       (most intense)
 *   strategic    0.65  →  orange    (warm, second-most intense)
 *   restricted   0.60  →  violet    (distinct, mid tier)
 *   disclosure   0.50  →  amber     (lighter warm tier)
 *   covered      0.40  →  stone     (neutral, least intense)
 *
 * Updated 2026-05-06: strategic and restricted swapped colour slots so
 * partner reviewers don't infer that strategic-raw-material is less
 * severe than restricted (the previous palette had strategic in violet
 * which read as lower-intensity than restricted's orange even though
 * strategic scores higher).
 */
const MATERIAL_SCOPE_CHIP_DEFAULT =
  "bg-stone-300 text-stone-900 ring-1 ring-stone-400 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600";

const MATERIAL_SCOPE_CHIP_CLASS: Record<string, string> = {
  banned:
    "bg-red-300 text-red-950 ring-1 ring-red-400 dark:bg-red-900 dark:text-red-50 dark:ring-red-800",
  strategic_raw_material:
    "bg-orange-300 text-orange-950 ring-1 ring-orange-400 dark:bg-orange-900 dark:text-orange-50 dark:ring-orange-800",
  restricted:
    "bg-violet-300 text-violet-950 ring-1 ring-violet-400 dark:bg-violet-900 dark:text-violet-50 dark:ring-violet-800",
  disclosure_required:
    "bg-amber-300 text-amber-950 ring-1 ring-amber-400 dark:bg-amber-900 dark:text-amber-50 dark:ring-amber-800",
  covered: MATERIAL_SCOPE_CHIP_DEFAULT,
};

export function materialScopeChipClass(
  value: string | null | undefined,
): string {
  if (!value) return MATERIAL_SCOPE_CHIP_DEFAULT;
  return MATERIAL_SCOPE_CHIP_CLASS[value] ?? MATERIAL_SCOPE_CHIP_DEFAULT;
}

// ---------------------------------------------------------------------------
// Geography scope type — descriptive in scoring (flat 0.50 weight today)
// ---------------------------------------------------------------------------

export type GeographyScopeType =
  | "jurisdiction"
  | "targeted_country"
  | "origin_country"
  | (string & {});

const GEOGRAPHY_SCOPE_LABELS: Record<string, string> = {
  jurisdiction: "Applies in",
  targeted_country: "Targeted",
  origin_country: "Origin",
};

export function humanizeGeographyScope(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return GEOGRAPHY_SCOPE_LABELS[value] ?? humanize(value);
}

const GEOGRAPHY_SCOPE_CHIP_DEFAULT =
  "bg-blue-300 text-blue-950 ring-1 ring-blue-400 dark:bg-blue-900 dark:text-blue-50 dark:ring-blue-800";

const GEOGRAPHY_SCOPE_CHIP_CLASS: Record<string, string> = {
  jurisdiction: GEOGRAPHY_SCOPE_CHIP_DEFAULT,
  targeted_country:
    "bg-red-300 text-red-950 ring-1 ring-red-400 dark:bg-red-900 dark:text-red-50 dark:ring-red-800",
  origin_country:
    "bg-orange-300 text-orange-950 ring-1 ring-orange-400 dark:bg-orange-900 dark:text-orange-50 dark:ring-orange-800",
};

export function geographyScopeChipClass(
  value: string | null | undefined,
): string {
  if (!value) return GEOGRAPHY_SCOPE_CHIP_DEFAULT;
  return GEOGRAPHY_SCOPE_CHIP_CLASS[value] ?? GEOGRAPHY_SCOPE_CHIP_DEFAULT;
}

// ---------------------------------------------------------------------------
// Status — descriptive; eurlex.py maps status to event severity at ingest time
// ---------------------------------------------------------------------------

export type RegulationStatus =
  | "effective"
  | "enacted"
  | "proposed"
  | "superseded"
  | (string & {});

const STATUS_LABELS: Record<string, string> = {
  effective: "Effective",
  enacted: "Enacted",
  proposed: "Proposed",
  superseded: "Superseded",
};

export function humanizeRegulationStatus(
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return STATUS_LABELS[value] ?? humanize(value);
}

const STATUS_PILL_DEFAULT =
  "bg-stone-300 text-stone-900 ring-1 ring-stone-400 dark:bg-stone-700 dark:text-stone-100 dark:ring-stone-600";

const STATUS_PILL_CLASS: Record<string, string> = {
  effective:
    "bg-emerald-300 text-emerald-950 ring-1 ring-emerald-400 dark:bg-emerald-900 dark:text-emerald-50 dark:ring-emerald-800",
  enacted:
    "bg-amber-300 text-amber-950 ring-1 ring-amber-400 dark:bg-amber-900 dark:text-amber-50 dark:ring-amber-800",
  proposed: STATUS_PILL_DEFAULT,
  superseded:
    "bg-stone-200 text-stone-700 ring-1 ring-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700",
};

const STATUS_DOT_DEFAULT = "bg-stone-500";

const STATUS_DOT_CLASS: Record<string, string> = {
  effective: "bg-emerald-600",
  enacted: "bg-amber-600",
  proposed: STATUS_DOT_DEFAULT,
  superseded: "bg-stone-400",
};

export function regulationStatusPillClass(
  value: string | null | undefined,
): string {
  if (!value) return STATUS_PILL_DEFAULT;
  return STATUS_PILL_CLASS[value] ?? STATUS_PILL_DEFAULT;
}

export function regulationStatusDotClass(
  value: string | null | undefined,
): string {
  if (!value) return STATUS_DOT_DEFAULT;
  return STATUS_DOT_CLASS[value] ?? STATUS_DOT_DEFAULT;
}

// ---------------------------------------------------------------------------
// Country code → English name
// ---------------------------------------------------------------------------
// Only countries that appear in the seed regulation data are mapped here.
// Add more entries as new regulations are seeded — unmapped codes fall
// through to the raw code so partner can spot gaps.

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  EU: "European Union",
  CN: "China",
  CD: "DR Congo",
  RU: "Russia",
  KP: "North Korea",
  IR: "Iran",
  GB: "United Kingdom",
  JP: "Japan",
  KR: "South Korea",
  CA: "Canada",
  AU: "Australia",
  CL: "Chile",
  AR: "Argentina",
  BO: "Bolivia",
  PE: "Peru",
  ID: "Indonesia",
  PH: "Philippines",
  ZA: "South Africa",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  TR: "Türkiye",
  KZ: "Kazakhstan",
  UA: "Ukraine",
  ZM: "Zambia",
  ZW: "Zimbabwe",
  MM: "Myanmar",
  VN: "Vietnam",
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "—";
  const upper = code.toUpperCase();
  return COUNTRY_NAMES[upper] ?? upper;
}

// ---------------------------------------------------------------------------
// Material display name
// ---------------------------------------------------------------------------
// Maps the canonical_name as stored in the materials table to a slightly
// shorter chip-friendly label when needed.  Most names render fine as-is;
// this dict is here for the rare long ones.

const MATERIAL_DISPLAY_NAMES: Record<string, string> = {
  "Silicon (Anode Grade)": "Silicon (anode grade)",
  "Iron Ore (LFP Grade)": "Iron ore (LFP grade)",
  "Phosphate (Battery Grade)": "Phosphate (battery grade)",
  "Platinum-Group Metals": "Platinum-group metals",
  "Rare Earth Elements": "Rare earth elements",
};

export function materialDisplayName(
  canonicalName: string | null | undefined,
): string {
  if (!canonicalName) return "—";
  return MATERIAL_DISPLAY_NAMES[canonicalName] ?? canonicalName;
}
