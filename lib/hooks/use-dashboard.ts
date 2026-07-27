"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { getCoverageMatrix, getDashboardOverview } from "@/lib/api/dashboard";
import type { CoverageMatrix, DashboardOverview } from "@/lib/types";

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardQueryKeys.all, "overview"] as const,
  coverageMatrix: () => [...dashboardQueryKeys.all, "coverage-matrix"] as const,
};

export function useDashboardOverview() {
  const client = useApiClient();
  return useQuery<DashboardOverview>({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: () => getDashboardOverview(client),
  });
}

export function useCoverageMatrix() {
  const client = useApiClient();
  return useQuery<CoverageMatrix>({
    queryKey: dashboardQueryKeys.coverageMatrix(),
    queryFn: () => getCoverageMatrix(client),
  });
}
