"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  getMarketScores,
  rescoreMarket,
  type MarketScoresParams,
} from "@/lib/api/market-scores";
import type { MarketScoresResponse } from "@/lib/types";

export const marketScoreQueryKeys = {
  all: ["market-scores"] as const,
  lists: () => [...marketScoreQueryKeys.all, "list"] as const,
  list: (params: MarketScoresParams) =>
    [...marketScoreQueryKeys.lists(), params] as const,
};

export function useMarketScores(
  params: MarketScoresParams,
  options?: Omit<
    UseQueryOptions<MarketScoresResponse>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery<MarketScoresResponse>({
    queryKey: marketScoreQueryKeys.list(params),
    queryFn: () => getMarketScores(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useRescoreMarket() {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => rescoreMarket(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketScoreQueryKeys.all });
    },
  });
}
