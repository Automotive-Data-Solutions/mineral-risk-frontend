import type { ApiClient } from "./client";
import type { CoverageMatrix, DashboardOverview } from "@/lib/types";

export async function getDashboardOverview(
  client: ApiClient,
): Promise<DashboardOverview> {
  const { data } = await client.get<DashboardOverview>(
    "/api/v1/dashboard/overview",
  );
  return data;
}

/** Per launch-list-material × per-source × per-pillar coverage view
 *  (2026-05-11).  Separate from /overview so the dashboard can refresh
 *  the matrix independently — e.g. after kicking off a new ingest. */
export async function getCoverageMatrix(
  client: ApiClient,
): Promise<CoverageMatrix> {
  const { data } = await client.get<CoverageMatrix>(
    "/api/v1/dashboard/coverage-matrix",
  );
  return data;
}
