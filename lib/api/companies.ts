import type { ApiClient } from "./client";
import type {
  AnalystNoteCreate,
  AnalystNoteRead,
  CompanyDetail,
  CompanyEventRead,
  CompanyListItem,
  ExposureRead,
  FacilityRead,
  PaginatedResponse,
  RegulationExposureRead,
  RelationshipsResponse,
  VehicleModelRead,
} from "@/lib/types";

export interface CompanyListParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  country?: string;
  parent_id?: string;
  min_confidence?: number;
}

export async function getCompanies(
  client: ApiClient,
  params: CompanyListParams = {},
): Promise<PaginatedResponse<CompanyListItem>> {
  const { data } = await client.get<PaginatedResponse<CompanyListItem>>(
    "/api/v1/companies",
    { params },
  );
  return data;
}

export async function getCompany(
  client: ApiClient,
  id: string,
): Promise<CompanyDetail> {
  const { data } = await client.get<CompanyDetail>(`/api/v1/companies/${id}`);
  return data;
}

export async function getCompanyExposures(
  client: ApiClient,
  id: string,
): Promise<ExposureRead[]> {
  const { data } = await client.get<ExposureRead[]>(
    `/api/v1/companies/${id}/exposures`,
  );
  return data;
}

export async function getCompanyRelationships(
  client: ApiClient,
  id: string,
): Promise<RelationshipsResponse> {
  const { data } = await client.get<RelationshipsResponse>(
    `/api/v1/companies/${id}/relationships`,
  );
  return data;
}

export async function getCompanyRegulations(
  client: ApiClient,
  id: string,
): Promise<RegulationExposureRead[]> {
  const { data } = await client.get<RegulationExposureRead[]>(
    `/api/v1/companies/${id}/regulations`,
  );
  return data;
}

export async function getCompanyEvents(
  client: ApiClient,
  id: string,
  params: { limit?: number; event_type?: string } = {},
): Promise<CompanyEventRead[]> {
  const { data } = await client.get<CompanyEventRead[]>(
    `/api/v1/companies/${id}/events`,
    { params },
  );
  return data;
}

export async function getCompanyFacilities(
  client: ApiClient,
  id: string,
): Promise<FacilityRead[]> {
  const { data } = await client.get<FacilityRead[]>(
    `/api/v1/companies/${id}/facilities`,
  );
  return data;
}

export async function getCompanyVehicleModels(
  client: ApiClient,
  id: string,
): Promise<VehicleModelRead[]> {
  const { data } = await client.get<VehicleModelRead[]>(
    `/api/v1/companies/${id}/vehicle-models`,
  );
  return data;
}

export async function getCompanyNotes(
  client: ApiClient,
  id: string,
): Promise<AnalystNoteRead[]> {
  const { data } = await client.get<AnalystNoteRead[]>(
    `/api/v1/companies/${id}/notes`,
  );
  return data;
}

export async function createCompanyNote(
  client: ApiClient,
  id: string,
  body: AnalystNoteCreate,
): Promise<AnalystNoteRead> {
  const { data } = await client.post<AnalystNoteRead>(
    `/api/v1/companies/${id}/notes`,
    body,
  );
  return data;
}
