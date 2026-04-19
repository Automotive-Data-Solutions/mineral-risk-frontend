"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { useCompanyRegulations } from "@/lib/hooks/use-companies";
import type { RegulationExposureRead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, humanize } from "@/lib/utils/format";

const STATUS_TONES: Record<string, string> = {
  compliant: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  at_risk: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  non_compliant: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  unknown: "bg-muted text-muted-foreground",
};

export function RegulationsSection({ companyId }: { companyId: string }) {
  const { data = [], isLoading, error, refetch } = useCompanyRegulations(companyId);
  const columns = useMemo<ColumnDef<RegulationExposureRead, unknown>[]>(
    () => [
      {
        id: "regulation",
        header: "Regulation",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.regulation_title ?? row.original.regulation_key}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {row.original.regulation_key}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "policy_theme",
        header: "Theme",
        cell: ({ row }) =>
          row.original.policy_theme ? humanize(row.original.policy_theme) : "—",
      },
      {
        accessorKey: "compliance_status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "border-0",
              STATUS_TONES[row.original.compliance_status] ?? STATUS_TONES.unknown,
            )}
          >
            {humanize(row.original.compliance_status)}
          </Badge>
        ),
      },
      {
        accessorKey: "effective_date",
        header: "Effective",
        cell: ({ row }) => formatDate(row.original.effective_date),
      },
      {
        accessorKey: "assessed_at",
        header: "Assessed",
        cell: ({ row }) => formatDate(row.original.assessed_at),
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
      emptyTitle="No regulatory exposures recorded"
    />
  );
}
