"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getChemistryDetail,
  getChemistryRiskHistory,
  rescoreChemistry,
} from "@/lib/api/chemistries";
import { chemistryQueryKeys } from "./use-chemistries";
import type {
  ChemistryDetailRead,
  ChemistryRiskScoreRead,
} from "@/lib/types";

export const chemistryDetailQueryKeys = {
  detail: (id: number) => [...chemistryQueryKeys.all, "detail", id] as const,
  history: (id: number) => [...chemistryQueryKeys.all, "history", id] as const,
};

export function useChemistryDetail(id: number) {
  const client = useApiClient();
  return useQuery<ChemistryDetailRead>({
    queryKey: chemistryDetailQueryKeys.detail(id),
    queryFn: () => getChemistryDetail(client, id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useChemistryRiskHistory(id: number) {
  const client = useApiClient();
  return useQuery<ChemistryRiskScoreRead[]>({
    queryKey: chemistryDetailQueryKeys.history(id),
    queryFn: () => getChemistryRiskHistory(client, id, 24),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useRescoreChemistry(id: number) {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ChemistryRiskScoreRead>({
    mutationFn: () => rescoreChemistry(client, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chemistryDetailQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: chemistryDetailQueryKeys.history(id),
      });
      queryClient.invalidateQueries({ queryKey: chemistryQueryKeys.lists() });
    },
  });
}
