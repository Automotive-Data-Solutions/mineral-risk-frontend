"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { useCompanyEvents } from "@/lib/hooks/use-companies";
import type { CompanyEventRead } from "@/lib/types";
import { formatDate, formatNumber, humanize } from "@/lib/utils/format";

export function EventsSection({ companyId }: { companyId: string }) {
  const { data = [], isLoading, error, refetch } = useCompanyEvents(companyId, {
    limit: 100,
  });
  const columns = useMemo<ColumnDef<CompanyEventRead, unknown>[]>(
    () => [
      {
        accessorKey: "event_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.event_date),
      },
      {
        accessorKey: "event_type",
        header: "Type",
        cell: ({ row }) => humanize(row.original.event_type),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            {row.original.summary && (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {row.original.summary}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "severity_score",
        header: () => <div className="text-right">Severity</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.severity_score, 1)}
          </div>
        ),
      },
      {
        accessorKey: "relevance_score",
        header: () => <div className="text-right">Relevance</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.relevance_score, 2)}
          </div>
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
      emptyTitle="No linked risk events"
    />
  );
}
