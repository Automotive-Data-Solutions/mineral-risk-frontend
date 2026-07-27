/**
 * PATCH …/verified API helpers.
 *
 * Every flaggable entity that carries a ``verified`` boolean has a
 * corresponding PATCH endpoint. Call the matching function with the
 * entity id(s) and the desired boolean to toggle verification state.
 */

import type { ApiClient } from "./client";

export interface VerifiedResponse {
  verified: boolean;
}

async function patchVerified(
  client: ApiClient,
  url: string,
  verified: boolean,
): Promise<VerifiedResponse> {
  const { data } = await client.patch<VerifiedResponse>(url, { verified });
  return data;
}

// ---------------------------------------------------------------------------
// Company-level
// ---------------------------------------------------------------------------

export const setCompanyVerified = (
  client: ApiClient,
  companyId: string,
  verified: boolean,
) => patchVerified(client, `/api/v1/companies/${companyId}/verified`, verified);

// ---------------------------------------------------------------------------
// Company relationship rows
// ---------------------------------------------------------------------------

export const setExposureVerified = (
  client: ApiClient,
  companyId: string,
  exposureId: number,
  verified: boolean,
) =>
  patchVerified(
    client,
    `/api/v1/companies/${companyId}/exposures/${exposureId}/verified`,
    verified,
  );

export const setRelationshipVerified = (
  client: ApiClient,
  companyId: string,
  relationshipId: number,
  verified: boolean,
) =>
  patchVerified(
    client,
    `/api/v1/companies/${companyId}/relationships/${relationshipId}/verified`,
    verified,
  );

export const setRegulationExposureVerified = (
  client: ApiClient,
  companyId: string,
  exposureId: number,
  verified: boolean,
) =>
  patchVerified(
    client,
    `/api/v1/companies/${companyId}/regulation-exposures/${exposureId}/verified`,
    verified,
  );

export const setVehicleModelVerified = (
  client: ApiClient,
  companyId: string,
  modelId: number,
  verified: boolean,
) =>
  patchVerified(
    client,
    `/api/v1/companies/${companyId}/vehicle-models/${modelId}/verified`,
    verified,
  );

// ---------------------------------------------------------------------------
// Reference / global entities
// ---------------------------------------------------------------------------

export const setMaterialVerified = (
  client: ApiClient,
  materialId: number,
  verified: boolean,
) => patchVerified(client, `/api/v1/materials/${materialId}/verified`, verified);

export const setRegulationVerified = (
  client: ApiClient,
  regulationId: number,
  verified: boolean,
) => patchVerified(client, `/api/v1/regulations/${regulationId}/verified`, verified);

export const setFacilityVerified = (
  client: ApiClient,
  facilityId: string,
  verified: boolean,
) => patchVerified(client, `/api/v1/facilities/${facilityId}/verified`, verified);

/**
 * Company-scoped facility verification — toggles the ``verified`` flag on the
 * ``company_facilities`` junction row, not the global facility record.
 * Use this from any company detail page.
 */
export const setCompanyFacilityVerified = (
  client: ApiClient,
  companyId: string,
  companyFacilityId: string,
  verified: boolean,
) =>
  patchVerified(
    client,
    `/api/v1/companies/${companyId}/facilities/${companyFacilityId}/verified`,
    verified,
  );

export const setChemistryVerified = (
  client: ApiClient,
  chemistryId: number,
  verified: boolean,
) => patchVerified(client, `/api/v1/chemistries/${chemistryId}/verified`, verified);

export const setRiskEventVerified = (
  client: ApiClient,
  eventId: number,
  verified: boolean,
) => patchVerified(client, `/api/v1/risk-events/${eventId}/verified`, verified);
