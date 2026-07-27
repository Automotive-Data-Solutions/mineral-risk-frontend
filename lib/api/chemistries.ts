import type { ApiClient } from "./client";
import type {
  ChemistryDetailRead,
  ChemistryListResponse,
  ChemistryRiskScoreRead,
} from "@/lib/types";

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

export async function getChemistryDetail(
  client: ApiClient,
  id: number,
): Promise<ChemistryDetailRead> {
  const { data } = await client.get<ChemistryDetailRead>(
    `/api/v1/chemistries/${id}`,
  );
  return data;
}

export async function getChemistryRiskHistory(
  client: ApiClient,
  id: number,
  limit = 24,
): Promise<ChemistryRiskScoreRead[]> {
  const { data } = await client.get<ChemistryRiskScoreRead[]>(
    `/api/v1/chemistries/${id}/risk/history`,
    { params: { limit } },
  );
  return data ?? [];
}

export async function rescoreChemistry(
  client: ApiClient,
  id: number,
): Promise<ChemistryRiskScoreRead> {
  const { data } = await client.post<ChemistryRiskScoreRead>(
    `/api/v1/chemistries/${id}/rescore`,
  );
  return data;
}
