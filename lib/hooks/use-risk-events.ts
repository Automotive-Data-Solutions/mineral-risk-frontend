"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getRiskEvents,
  type RiskEventListParams,
} from "@/lib/api/risk-events";
import type { RiskEventListResponse } from "@/lib/types";

export const riskEventQueryKeys = {
  all: ["risk-events"] as const,
  lists: () => [...riskEventQueryKeys.all, "list"] as const,
  list: (params: RiskEventListParams) =>
    [...riskEventQueryKeys.lists(), params] as const,
};

export function useRiskEvents(
  params: RiskEventListParams,
  options?: Omit<
    UseQueryOptions<RiskEventListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<RiskEventListResponse>({
    queryKey: riskEventQueryKeys.list(params),
    queryFn: () => getRiskEvents(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}
