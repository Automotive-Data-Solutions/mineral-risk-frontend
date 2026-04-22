import type { ApiClient } from "./client";
import type { RiskEventListResponse } from "@/lib/types";

export interface RiskEventListParams {
  page?: number;
  limit?: number;
  search?: string;
  event_type?: string;
  severity_min?: number;
  date_from?: string;
  date_to?: string;
}

export async function getRiskEvents(
  client: ApiClient,
  params: RiskEventListParams = {},
): Promise<RiskEventListResponse> {
  const { data } = await client.get<RiskEventListResponse>(
    "/api/v1/risk-events",
    { params },
  );
  return data;
}
