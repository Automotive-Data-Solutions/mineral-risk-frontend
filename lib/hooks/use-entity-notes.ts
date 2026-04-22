"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useApiClient } from "./use-api-client";
import { createEntityNote, getEntityNotes } from "@/lib/api/notes";
import type {
  AnalystNoteRead,
  EntityNoteCreate,
  FlaggableEntityType,
} from "@/lib/types";

export const entityNoteKeys = {
  all: ["entity-notes"] as const,
  list: (
    entityType: FlaggableEntityType,
    entityId: string,
    parentId?: string,
  ) =>
    [
      ...entityNoteKeys.all,
      entityType,
      entityId,
      parentId ?? null,
    ] as const,
};

export function useEntityNotes(
  entityType: FlaggableEntityType,
  entityId: string,
  parentId?: string,
  options?: { enabled?: boolean },
) {
  const client = useApiClient();
  return useQuery<AnalystNoteRead[]>({
    queryKey: entityNoteKeys.list(entityType, entityId, parentId),
    queryFn: () => getEntityNotes(client, entityType, entityId, parentId),
    enabled: Boolean(entityId) && (options?.enabled ?? true),
  });
}

export function useCreateEntityNote(
  entityType: FlaggableEntityType,
  entityId: string,
  parentId?: string,
  options?: UseMutationOptions<AnalystNoteRead, unknown, EntityNoteCreate>,
) {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation<AnalystNoteRead, unknown, EntityNoteCreate>({
    mutationFn: (body) =>
      createEntityNote(client, entityType, entityId, body, parentId),
    onSuccess: (data, vars, ctx) => {
      qc.invalidateQueries({
        queryKey: entityNoteKeys.list(entityType, entityId, parentId),
      });
      // The Phase-1 company detail page reads notes through the legacy
      // ``companies.notes(id)`` query key (see `companyQueryKeys` in
      // `use-companies.ts`). Invalidate it too so the FlaggedIssuesPanel
      // refreshes when the dialog is used on a company.
      if (entityType === "company") {
        qc.invalidateQueries({
          queryKey: ["companies", "detail", entityId, "notes"],
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onSuccess as any)?.(data, vars, ctx);
    },
    ...options,
  });
}
