"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "./use-api-client";
import {
  setChemistryVerified,
  setCompanyFacilityVerified,
  setCompanyVerified,
  setExposureVerified,
  setFacilityVerified,
  setMaterialVerified,
  setRegulationExposureVerified,
  setRegulationVerified,
  setRelationshipVerified,
  setRiskEventVerified,
  setVehicleModelVerified,
} from "@/lib/api/verified";

/** Shared options so callers can hook into success/error without re-implementing toast logic. */
interface ToggleOptions {
  /** Called after a successful toggle. */
  onSuccess?: (verified: boolean) => void;
  /** Suppress the default success toast. */
  silent?: boolean;
  /** Extra query keys to invalidate on success (in addition to any built-in ones). */
  invalidateKeys?: readonly unknown[][];
}

function useToggle<TVariables>(
  mutateFn: (variables: TVariables) => Promise<{ verified: boolean }>,
  invalidateKeys?: readonly unknown[][],
  opts?: ToggleOptions,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: mutateFn,
    onSuccess: ({ verified }) => {
      if (!opts?.silent) {
        toast.success(verified ? "Marked as verified" : "Verification removed");
      }
      const keys = [...(invalidateKeys ?? []), ...(opts?.invalidateKeys ?? [])];
      for (const key of keys) {
        qc.invalidateQueries({ queryKey: key });
      }
      opts?.onSuccess?.(verified);
    },
    onError: () => {
      toast.error("Could not update verified status");
    },
  });
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

export function useToggleCompanyVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    (verified: boolean) => setCompanyVerified(client, companyId, verified),
    [["companies", "list"], ["companies", "detail", companyId]],
    opts,
  );
}

// ---------------------------------------------------------------------------
// Company relationship rows
// ---------------------------------------------------------------------------

export function useToggleExposureVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ exposureId, verified }: { exposureId: number; verified: boolean }) =>
      setExposureVerified(client, companyId, exposureId, verified),
    [["companies", "detail", companyId, "exposures"]],
    opts,
  );
}

export function useToggleRelationshipVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ relationshipId, verified }: { relationshipId: number; verified: boolean }) =>
      setRelationshipVerified(client, companyId, relationshipId, verified),
    [["companies", "detail", companyId, "relationships"]],
    opts,
  );
}

export function useToggleRegulationExposureVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ exposureId, verified }: { exposureId: number; verified: boolean }) =>
      setRegulationExposureVerified(client, companyId, exposureId, verified),
    [["companies", "detail", companyId, "regulations"]],
    opts,
  );
}

export function useToggleVehicleModelVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ modelId, verified }: { modelId: number; verified: boolean }) =>
      setVehicleModelVerified(client, companyId, modelId, verified),
    [["companies", "detail", companyId, "vehicle-models"]],
    opts,
  );
}

// ---------------------------------------------------------------------------
// Reference / global entities
// ---------------------------------------------------------------------------

export function useToggleMaterialVerified(opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ materialId, verified }: { materialId: number; verified: boolean }) =>
      setMaterialVerified(client, materialId, verified),
    [["materials"]],
    opts,
  );
}

export function useToggleRegulationVerified(opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ regulationId, verified }: { regulationId: number; verified: boolean }) =>
      setRegulationVerified(client, regulationId, verified),
    [["regulations"]],
    opts,
  );
}

/**
 * Company-scoped facility verification.
 *
 * Toggles the ``verified`` flag on the ``company_facilities`` junction row
 * (not the global facility record). The mutation variable is
 * ``{ companyFacilityId: string; verified: boolean }``.
 */
export function useToggleFacilityVerified(companyId: string, opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ companyFacilityId, verified }: { companyFacilityId: string; verified: boolean }) =>
      setCompanyFacilityVerified(client, companyId, companyFacilityId, verified),
    [["companies", "detail", companyId, "facilities"]],
    opts,
  );
}

/**
 * Global facility verification (facility physically exists / data is real).
 * Useful from a global facilities admin page. Not used from company detail.
 */
export function useToggleGlobalFacilityVerified(opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ facilityId, verified }: { facilityId: string; verified: boolean }) =>
      setFacilityVerified(client, facilityId, verified),
    [["facilities"]],
    opts,
  );
}

export function useToggleChemistryVerified(opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ chemistryId, verified }: { chemistryId: number; verified: boolean }) =>
      setChemistryVerified(client, chemistryId, verified),
    [["chemistries"]],
    opts,
  );
}

export function useToggleRiskEventVerified(opts?: ToggleOptions) {
  const client = useApiClient();
  return useToggle(
    ({ eventId, verified }: { eventId: number; verified: boolean }) =>
      setRiskEventVerified(client, eventId, verified),
    [["risk-events"]],
    opts,
  );
}
