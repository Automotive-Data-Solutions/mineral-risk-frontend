"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getRegulation,
  getRegulations,
  type RegulationListParams,
} from "@/lib/api/regulations";
import type { RegulationListResponse, RegulationRead } from "@/lib/types";

export const regulationQueryKeys = {
  all: ["regulations"] as const,
  lists: () => [...regulationQueryKeys.all, "list"] as const,
  list: (params: RegulationListParams) =>
    [...regulationQueryKeys.lists(), params] as const,
  details: () => [...regulationQueryKeys.all, "detail"] as const,
  detail: (id: number | string) =>
    [...regulationQueryKeys.details(), String(id)] as const,
};

export function useRegulations(
  params: RegulationListParams,
  options?: Omit<
    UseQueryOptions<RegulationListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<RegulationListResponse>({
    queryKey: regulationQueryKeys.list(params),
    queryFn: () => getRegulations(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useRegulation(id: number | string) {
  const client = useApiClient();
  return useQuery<RegulationRead>({
    queryKey: regulationQueryKeys.detail(id),
    queryFn: () => getRegulation(client, id),
    enabled: Boolean(id),
  });
}
