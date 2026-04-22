import type { ApiClient } from "./client";
import type { ChemistryListResponse } from "@/lib/types";

export interface ChemistryListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getChemistries(
  client: ApiClient,
  params: ChemistryListParams = {},
): Promise<ChemistryListResponse> {
  const { data } = await client.get<ChemistryListResponse>(
    "/api/v1/chemistries",
    { params },
  );
  return data;
}
