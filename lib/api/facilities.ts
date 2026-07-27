import type { ApiClient } from "./client";
import type { FacilityListResponse } from "@/lib/types";

export interface FacilityListParams {
  page?: number;
  limit?: number;
  search?: string;
  company_id?: string;
  country?: string;
  facility_type?: string;
  status?: string;
}

export async function getFacilities(
  client: ApiClient,
  params: FacilityListParams = {},
): Promise<FacilityListResponse> {
  const { data } = await client.get<FacilityListResponse>(
    "/api/v1/facilities",
    { params },
  );
  return data;
}
