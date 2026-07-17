import type { ApiClient } from "./client";
import type {
  HsCodeMaterialMappingRead,
  MaterialDetail,
  MaterialGlobalScoreRead,
  MaterialListResponse,
} from "@/lib/types";

export interface MaterialListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  is_ira_critical?: boolean;
  is_eu_crma_critical?: boolean;
  /** 2026-05-11: scope to launch-list materials (the core 10 v1 minerals).
   *  Replaces the retired ``has_mismatched_mappings`` filter. */
  is_launch_list?: boolean;
}

export async function getMaterials(
  client: ApiClient,
  params: MaterialListParams = {},
): Promise<MaterialListResponse> {
  const { data } = await client.get<MaterialListResponse>(
    "/api/v1/materials",
    { params },
  );
  return data;
}

type MaterialDetailResponse = MaterialDetail & {
  /**
   * The backend uses `hs_mappings` as the key; we normalize to `hs_code_mappings`
   * for consistency with the rest of the frontend type system.
   */
  hs_mappings?: HsCodeMaterialMappingRead[];
  /**
   * Some backend builds currently omit ``verified`` on material detail while
   * still returning it on list rows. Keep this optional so we can backfill.
   */
  verified?: boolean;
  // Backend also emits chapter_mismatch / cross_mapped inside mapping_health —
  // the frontend type drops them (only the four fields used by the UI are kept).
};

/** Backend may omit server-derived ``mismatch_reasons`` until scoring is wired. */
function normalizeHsCodeMappingRow(
  row: HsCodeMaterialMappingRead,
): HsCodeMaterialMappingRead {
  return {
    ...row,
    mismatch_reasons: row.mismatch_reasons ?? [],
  };
}

function normalizeMaterialDetail(raw: MaterialDetailResponse): MaterialDetail {
  const {
    hs_mappings: legacyMappings,
    hs_code_mappings,
    criticality_signals,
    chemistry_uses,
    mapping_health,
    ...rest
  } = raw;

  const rawMappings = hs_code_mappings ?? legacyMappings ?? [];

  return {
    ...rest,
    hs_code_mappings: rawMappings.map(normalizeHsCodeMappingRow),
    criticality_signals: criticality_signals ?? [],
    chemistry_uses: chemistry_uses ?? [],
    mapping_health: mapping_health ?? {
      total: 0,
      mismatched: 0,
      low_confidence: 0,
      missing_description: 0,
    },
  };
}

/**
 * Temporary compatibility shim:
 * ``GET /api/v1/materials/{id}`` may omit ``verified`` in some backend
 * deployments while ``GET /api/v1/materials`` includes it. When absent, fetch
 * a narrow list slice and backfill by id.
 */
async function resolveMaterialVerified(
  client: ApiClient,
  raw: MaterialDetailResponse,
): Promise<boolean> {
  if (typeof raw.verified === "boolean") return raw.verified;
  try {
    const { data } = await client.get<MaterialListResponse>("/api/v1/materials", {
      params: {
        page: 1,
        limit: 25,
        search: raw.canonical_name,
      },
    });
    const match = (data.data ?? []).find((item) => item.id === raw.id);
    if (typeof match?.verified === "boolean") return match.verified;
  } catch {
    // Best-effort fallback only; detail should still render.
  }
  return false;
}

export async function getMaterial(
  client: ApiClient,
  id: string,
): Promise<MaterialDetail> {
  const { data } = await client.get<MaterialDetailResponse>(
    `/api/v1/materials/${id}`,
  );
  const normalized = normalizeMaterialDetail(data);
  return {
    ...normalized,
    verified: await resolveMaterialVerified(client, data),
  };
}

export interface MaterialHsCodeMappingsParams {
  /** Filter by leading digits of the prefix (e.g. "25" for HS chapter 25). */
  prefix_starts_with?: string;
  /** 0..1 — minimum value of `confidence`. */
  min_confidence?: number;
}

export async function getMaterialHsCodeMappings(
  client: ApiClient,
  id: string,
  params: MaterialHsCodeMappingsParams = {},
): Promise<HsCodeMaterialMappingRead[]> {
  const { data } = await client.get<HsCodeMaterialMappingRead[]>(
    `/api/v1/materials/${id}/hs-code-mappings`,
    { params },
  );
  return (data ?? []).map(normalizeHsCodeMappingRow);
}

export async function getMaterialGlobalScore(
  client: ApiClient,
  id: string,
): Promise<MaterialGlobalScoreRead | null> {
  try {
    const { data } = await client.get<MaterialGlobalScoreRead>(
      `/api/v1/materials/${id}/global-score`,
    );
    return data;
  } catch (err: unknown) {
    // 404 means no rollup computed yet — not an error state worth surfacing
    if (
      err != null &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export async function getMaterialMarketScores(
  client: ApiClient,
  id: string,
): Promise<import("@/lib/types").MaterialGeographyScoreRead[]> {
  const { data } = await client.get<import("@/lib/types").MaterialGeographyScoreRead[]>(
    `/api/v1/materials/${id}/market-scores`,
  );
  return data ?? [];
}

export async function getMaterialMarketScoreDetail(
  client: ApiClient,
  materialId: string,
  geoCode: string,
): Promise<import("@/lib/types").MaterialGeographyScoreDetail | null> {
  try {
    const { data } = await client.get<import("@/lib/types").MaterialGeographyScoreDetail>(
      `/api/v1/materials/${materialId}/market-scores/${geoCode}`,
    );
    return data;
  } catch (err: unknown) {
    if (
      err != null &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export interface MaterialRiskEventsParams {
  window_days?: number;
  pillar?: string;
  source?: string;
  event_type?: string;
  severity_min?: number;
  verified_only?: boolean;
  search?: string;
  /** title | event_type | source_system | severity_score | event_date */
  sort_by?: string;
  /** asc | desc */
  sort_dir?: string;
  page?: number;
  limit?: number;
}

/**
 * Per-material risk events tab feed — summary cards + table rows.
 * Window/source/pillar/type/severity/verified filters all flow through
 * to the backend so summary cards stay in sync with the table.
 */
export async function getMaterialRiskEvents(
  client: ApiClient,
  materialId: string,
  params: MaterialRiskEventsParams = {},
): Promise<import("@/lib/types").MaterialRiskEventsResponse> {
  const { data } = await client.get<
    import("@/lib/types").MaterialRiskEventsResponse
  >(`/api/v1/materials/${materialId}/risk-events`, { params });
  return data;
}

/**
 * Drill-down evidence for one (material × country) pair — regulations,
 * facilities, risk events at strict intersection.  Backs the expanded
 * country-scores row on the material detail page.
 */
export async function getMaterialMarketScoreEvidence(
  client: ApiClient,
  materialId: string,
  geoCode: string,
): Promise<import("@/lib/types").MarketScoreEvidence | null> {
  try {
    const { data } = await client.get<import("@/lib/types").MarketScoreEvidence>(
      `/api/v1/materials/${materialId}/market-scores/${geoCode}/evidence`,
    );
    return data;
  } catch (err: unknown) {
    if (
      err != null &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw err;
  }
}
