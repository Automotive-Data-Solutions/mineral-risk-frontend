"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { getDashboardOverview } from "@/lib/api/dashboard";
import type { DashboardOverview } from "@/lib/types";

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardQueryKeys.all, "overview"] as const,
};

export function useDashboardOverview() {
  const client = useApiClient();
  return useQuery<DashboardOverview>({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: () => getDashboardOverview(client),
  });
}
