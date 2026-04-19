import type { ApiClient } from "./client";
import type { DashboardOverview } from "@/lib/types";

export async function getDashboardOverview(
  client: ApiClient,
): Promise<DashboardOverview> {
  const { data } = await client.get<DashboardOverview>(
    "/api/v1/dashboard/overview",
  );
  return data;
}
