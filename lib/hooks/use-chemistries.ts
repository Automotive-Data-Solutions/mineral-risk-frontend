"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getChemistries,
  type ChemistryListParams,
} from "@/lib/api/chemistries";
import type { ChemistryListResponse } from "@/lib/types";

export const chemistryQueryKeys = {
  all: ["chemistries"] as const,
  lists: () => [...chemistryQueryKeys.all, "list"] as const,
  list: (params: ChemistryListParams) =>
    [...chemistryQueryKeys.lists(), params] as const,
};

export function useChemistries(
  params: ChemistryListParams,
  options?: Omit<
    UseQueryOptions<ChemistryListResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<ChemistryListResponse>({
    queryKey: chemistryQueryKeys.list(params),
    queryFn: () => getChemistries(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}
