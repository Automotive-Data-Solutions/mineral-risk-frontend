"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getFacilities,
  type FacilityListParams,
} from "@/lib/api/facilities";
import type { FacilityListResponse } from "@/lib/types";

export const facilityQueryKeys = {
  all: ["facilities"] as const,
  lists: () => [...facilityQueryKeys.all, "list"] as const,
  list: (params: FacilityListParams) =>
    [...facilityQueryKeys.lists(), params] as const,
};

export function useFacilities(
  params: FacilityListParams,
  options?: Omit<
    UseQueryOptions<FacilityListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<FacilityListResponse>({
    queryKey: facilityQueryKeys.list(params),
    queryFn: () => getFacilities(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}
