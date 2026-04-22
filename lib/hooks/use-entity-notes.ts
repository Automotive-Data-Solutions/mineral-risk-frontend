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
  const externalOnSuccess = options?.onSuccess;
  const externalOnError = options?.onError;

  return useMutation<AnalystNoteRead, unknown, EntityNoteCreate>({
    ...options,
    mutationFn: (body) =>
      createEntityNote(client, entityType, entityId, body, parentId),
    onSuccess: (data, vars, onMutateResult, ctx) => {
      // Update the visible notes list immediately so side sheets reflect the
      // newly created note without needing a manual refresh/reopen.
      qc.setQueryData<AnalystNoteRead[]>(
        entityNoteKeys.list(entityType, entityId, parentId),
        (prev) => {
          if (!prev || prev.length === 0) return [data];
          if (prev.some((note) => note.id === data.id)) return prev;
          return [data, ...prev];
        },
      );
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
      externalOnSuccess?.(data, vars, onMutateResult, ctx);
    },
    onError: (error, vars, onMutateResult, ctx) => {
      externalOnError?.(error, vars, onMutateResult, ctx);
    },
  });
}
