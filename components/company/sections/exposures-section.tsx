"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { CountryFlag } from "@/components/shared/country-flag";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { useCompanyExposures } from "@/lib/hooks/use-companies";
import type { ExposureRead } from "@/lib/types";
import { formatDate, formatNumber, humanize } from "@/lib/utils/format";

export function ExposuresSection({ companyId }: { companyId: string }) {
  const { data = [], isLoading, error, refetch } = useCompanyExposures(companyId);
  const columns = useMemo<ColumnDef<ExposureRead, unknown>[]>(
    () => [
      { accessorKey: "material_name", header: "Material" },
      {
        accessorKey: "supply_chain_stage",
        header: "Stage",
        cell: ({ row }) => humanize(row.original.supply_chain_stage),
      },
      {
        accessorKey: "source_geography",
        header: "Source",
        cell: ({ row }) => <CountryFlag code={row.original.source_geography} />,
      },
      {
        accessorKey: "exposure_score",
        header: () => <div className="text-right">Exposure</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.exposure_score, 2)}
          </div>
        ),
      },
      {
        accessorKey: "data_confidence",
        header: () => <div className="text-right">Confidence</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.data_confidence} />
          </div>
        ),
      },
      {
        accessorKey: "as_of_date",
        header: "As of",
        cell: ({ row }) => formatDate(row.original.as_of_date),
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
      emptyTitle="No material exposures recorded"
    />
  );
}
