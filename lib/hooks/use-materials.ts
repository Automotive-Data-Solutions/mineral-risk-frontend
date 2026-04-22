"use client";

import {
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getHsCodeMappingMismatches,
  getMaterial,
  getMaterialHsCodeMappings,
  getMaterials,
  type HsCodeMappingMismatchParams,
  type MaterialHsCodeMappingsParams,
  type MaterialListParams,
} from "@/lib/api/materials";
import type {
  HsCodeMappingMismatchListResponse,
  HsCodeMaterialMappingRead,
  MaterialDetail,
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
  mismatches: (params: HsCodeMappingMismatchParams) =>
    [...materialQueryKeys.all, "mismatches", params] as const,
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

export function useHsCodeMappingMismatches(
  params: HsCodeMappingMismatchParams = {},
) {
  const client = useApiClient();
  return useQuery<HsCodeMappingMismatchListResponse>({
    queryKey: materialQueryKeys.mismatches(params),
    queryFn: () => getHsCodeMappingMismatches(client, params),
    placeholderData: (prev) => prev,
  });
}
