"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getMaterial,
  getMaterialGlobalScore,
  getMaterialHsCodeMappings,
  getMaterialMarketScores,
  getMaterialMarketScoreDetail,
  getMaterials,
  type MaterialHsCodeMappingsParams,
  type MaterialListParams,
} from "@/lib/api/materials";
import type {
  HsCodeMaterialMappingRead,
  MaterialDetail,
  MaterialGeographyScoreDetail,
  MaterialGeographyScoreRead,
  MaterialGlobalScoreRead,
  MaterialListResponse,
} from "@/lib/types";

export const materialQueryKeys = {
  all: ["materials"] as const,
  lists: () => [...materialQueryKeys.all, "list"] as const,
  list: (params: MaterialListParams) =>
    [...materialQueryKeys.lists(), params] as const,
  details: () => [...materialQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...materialQueryKeys.details(), id] as const,
  hsCodeMappings: (id: string, params: MaterialHsCodeMappingsParams) =>
    [...materialQueryKeys.detail(id), "hs-code-mappings", params] as const,
  globalScore: (id: string) =>
    [...materialQueryKeys.detail(id), "global-score"] as const,
  marketScores: (id: string) =>
    [...materialQueryKeys.detail(id), "market-scores"] as const,
  marketScoreDetail: (id: string, geoCode: string) =>
    [...materialQueryKeys.detail(id), "market-scores", geoCode] as const,
};

export function useMaterials(
  params: MaterialListParams,
  options?: Omit<
    UseQueryOptions<MaterialListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<MaterialListResponse>({
    queryKey: materialQueryKeys.list(params),
    queryFn: () => getMaterials(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useMaterial(id: string) {
  const client = useApiClient();
  return useQuery<MaterialDetail>({
    queryKey: materialQueryKeys.detail(id),
    queryFn: () => getMaterial(client, id),
    enabled: Boolean(id),
  });
}

export function useMaterialGlobalScore(id: string) {
  const client = useApiClient();
  return useQuery<MaterialGlobalScoreRead | null>({
    queryKey: materialQueryKeys.globalScore(id),
    queryFn: () => getMaterialGlobalScore(client, id),
    enabled: Boolean(id),
  });
}

export function useMaterialMarketScores(id: string) {
  const client = useApiClient();
  return useQuery<MaterialGeographyScoreRead[]>({
    queryKey: materialQueryKeys.marketScores(id),
    queryFn: () => getMaterialMarketScores(client, id),
    enabled: Boolean(id),
  });
}

/**
 * Lazily fetches the detail row (with rationale_json) for a single
 * material × geography pair.  Only fires when `geoCode` is non-null —
 * pass null to keep the query idle (i.e. before a row is expanded).
 */
export function useMaterialMarketScoreDetail(
  materialId: string,
  geoCode: string | null,
) {
  const client = useApiClient();
  return useQuery<MaterialGeographyScoreDetail | null>({
    queryKey: materialQueryKeys.marketScoreDetail(materialId, geoCode ?? ""),
    queryFn: () => getMaterialMarketScoreDetail(client, materialId, geoCode!),
    enabled: Boolean(materialId) && Boolean(geoCode),
    staleTime: 5 * 60 * 1000, // 5 min — rationale rarely changes within a session
  });
}

export function useMaterialHsCodeMappings(
  id: string,
  params: MaterialHsCodeMappingsParams = {},
) {
  const client = useApiClient();
  return useQuery<HsCodeMaterialMappingRead[]>({
    queryKey: materialQueryKeys.hsCodeMappings(id, params),
    queryFn: () => getMaterialHsCodeMappings(client, id, params),
    enabled: Boolean(id),
  });
}
