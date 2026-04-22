import type { ApiClient } from "./client";
import type {
  HsCodeMappingMismatchListResponse,
  HsCodeMaterialMappingRead,
  MaterialDetail,
  MaterialListResponse,
} from "@/lib/types";

export interface MaterialListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  is_ira_critical?: boolean;
  is_eu_crma_critical?: boolean;
  has_mismatched_mappings?: boolean;
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
  /** Legacy/alternate key some backends may return until OpenAPI is aligned. */
  hs_mappings?: HsCodeMaterialMappingRead[];
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

export async function getMaterial(
  client: ApiClient,
  id: string,
): Promise<MaterialDetail> {
  const { data } = await client.get<MaterialDetailResponse>(
    `/api/v1/materials/${id}`,
  );
  return normalizeMaterialDetail(data);
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

export interface HsCodeMappingMismatchParams {
  page?: number;
  limit?: number;
  severity?: "low" | "medium" | "high";
}

export async function getHsCodeMappingMismatches(
  client: ApiClient,
  params: HsCodeMappingMismatchParams = {},
): Promise<HsCodeMappingMismatchListResponse> {
  const { data } = await client.get<HsCodeMappingMismatchListResponse>(
    "/api/v1/hs-code-mappings/mismatches",
    { params },
  );
  return {
    ...data,
    data: (data.data ?? []).map(normalizeHsCodeMappingRow),
  };
}
