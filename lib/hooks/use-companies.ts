"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import {
  createCompanyNote,
  getCompanies,
  getCompany,
  getCompanyEvents,
  getCompanyExposures,
  getCompanyFacilities,
  getCompanyNotes,
  getCompanyRegulations,
  getCompanyRelationships,
  getCompanyVehicleModels,
  type CompanyListParams,
} from "@/lib/api/companies";
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

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const companyQueryKeys = {
  all: ["companies"] as const,
  lists: () => [...companyQueryKeys.all, "list"] as const,
  list: (params: CompanyListParams) => [...companyQueryKeys.lists(), params] as const,
  details: () => [...companyQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...companyQueryKeys.details(), id] as const,
  exposures: (id: string) => [...companyQueryKeys.detail(id), "exposures"] as const,
  relationships: (id: string) =>
    [...companyQueryKeys.detail(id), "relationships"] as const,
  regulations: (id: string) =>
    [...companyQueryKeys.detail(id), "regulations"] as const,
  events: (id: string, params: { limit?: number; event_type?: string }) =>
    [...companyQueryKeys.detail(id), "events", params] as const,
  facilities: (id: string) =>
    [...companyQueryKeys.detail(id), "facilities"] as const,
  vehicleModels: (id: string) =>
    [...companyQueryKeys.detail(id), "vehicle-models"] as const,
  notes: (id: string) => [...companyQueryKeys.detail(id), "notes"] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useCompanies(
  params: CompanyListParams,
  options?: Omit<
    UseQueryOptions<PaginatedResponse<CompanyListItem>>,
    "queryKey" | "queryFn"
  >,
) {
  const client = useApiClient();
  return useQuery({
    queryKey: companyQueryKeys.list(params),
    queryFn: () => getCompanies(client, params),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCompany(id: string) {
  const client = useApiClient();
  return useQuery<CompanyDetail>({
    queryKey: companyQueryKeys.detail(id),
    queryFn: () => getCompany(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyExposures(id: string) {
  const client = useApiClient();
  return useQuery<ExposureRead[]>({
    queryKey: companyQueryKeys.exposures(id),
    queryFn: () => getCompanyExposures(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyRelationships(id: string) {
  const client = useApiClient();
  return useQuery<RelationshipsResponse>({
    queryKey: companyQueryKeys.relationships(id),
    queryFn: () => getCompanyRelationships(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyRegulations(id: string) {
  const client = useApiClient();
  return useQuery<RegulationExposureRead[]>({
    queryKey: companyQueryKeys.regulations(id),
    queryFn: () => getCompanyRegulations(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyEvents(
  id: string,
  params: { limit?: number; event_type?: string } = {},
) {
  const client = useApiClient();
  return useQuery<CompanyEventRead[]>({
    queryKey: companyQueryKeys.events(id, params),
    queryFn: () => getCompanyEvents(client, id, params),
    enabled: Boolean(id),
  });
}

export function useCompanyFacilities(id: string) {
  const client = useApiClient();
  return useQuery<FacilityRead[]>({
    queryKey: companyQueryKeys.facilities(id),
    queryFn: () => getCompanyFacilities(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyVehicleModels(id: string) {
  const client = useApiClient();
  return useQuery<VehicleModelRead[]>({
    queryKey: companyQueryKeys.vehicleModels(id),
    queryFn: () => getCompanyVehicleModels(client, id),
    enabled: Boolean(id),
  });
}

export function useCompanyNotes(id: string) {
  const client = useApiClient();
  return useQuery<AnalystNoteRead[]>({
    queryKey: companyQueryKeys.notes(id),
    queryFn: () => getCompanyNotes(client, id),
    enabled: Boolean(id),
  });
}

export function useCreateCompanyNote(
  id: string,
  options?: UseMutationOptions<AnalystNoteRead, unknown, AnalystNoteCreate>,
) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<AnalystNoteRead, unknown, AnalystNoteCreate>({
    mutationFn: (body) => createCompanyNote(client, id, body),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({ queryKey: companyQueryKeys.notes(id) });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onSuccess as any)?.(data, vars, ctx);
    },
    ...options,
  });
}
