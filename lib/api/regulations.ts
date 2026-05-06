import type { ApiClient } from "./client";
import type {
  RegulationDetail,
  RegulationListResponse,
} from "@/lib/types";

export interface RegulationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  policy_theme?: string;
  issuing_body?: string;
  effective_after?: string;
}

export async function getRegulations(
  client: ApiClient,
  params: RegulationListParams = {},
): Promise<RegulationListResponse> {
  const { data } = await client.get<RegulationListResponse>(
    "/api/v1/regulations",
    { params },
  );
  return data;
}

export async function getRegulation(
  client: ApiClient,
  id: number | string,
): Promise<RegulationDetail> {
  const { data } = await client.get<RegulationDetail>(
    `/api/v1/regulations/${id}`,
  );
  return data;
}
