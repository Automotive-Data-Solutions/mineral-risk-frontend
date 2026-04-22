"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { useCompanyAllNotes } from "@/lib/hooks/use-companies";
import type { AnalystNoteRead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelative, humanize } from "@/lib/utils/format";

const NOTE_TYPE_TONE: Record<string, string> = {
  data_error: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  missing_data: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  outdated: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  other: "bg-muted text-muted-foreground",
};

export function NotesSection({ companyId }: { companyId: string }) {
  const { data = [], isLoading, error, refetch } = useCompanyAllNotes(companyId);
  const columns = useMemo<ColumnDef<AnalystNoteRead, unknown>[]>(
    () => [
      {
        accessorKey: "note_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "border-0",
              NOTE_TYPE_TONE[row.original.note_type] ?? NOTE_TYPE_TONE.other,
            )}
          >
            {humanize(row.original.note_type)}
          </Badge>
        ),
      },
      {
        accessorKey: "note_text",
        header: "Note",
        cell: ({ row }) => (
          <span className="whitespace-pre-wrap text-sm">
            {row.original.note_text}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span title={formatDateTime(row.original.created_at)}>
            {formatRelative(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      emptyTitle="No analyst notes yet"
      emptyDescription='Click "Flag Issue" to record a data-quality note.'
    />
  );
}
