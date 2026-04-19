"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { useCompanyVehicleModels } from "@/lib/hooks/use-companies";
import type { VehicleModelRead } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils/format";

export function VehicleModelsSection({ companyId }: { companyId: string }) {
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useCompanyVehicleModels(companyId);
  const columns = useMemo<ColumnDef<VehicleModelRead, unknown>[]>(
    () => [
      {
        accessorKey: "model_name",
        header: "Model",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.model_name}</span>
            {row.original.data_source && (
              <span className="text-xs text-muted-foreground">
                {row.original.data_source}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "years",
        header: "Years",
        cell: ({ row }) => {
          const { model_year_start, model_year_end } = row.original;
          if (!model_year_start && !model_year_end) return "—";
          return `${model_year_start ?? "?"} – ${model_year_end ?? "present"}`;
        },
      },
      {
        id: "production",
        header: "Production",
        cell: ({ row }) => {
          const units = row.original.production_volume_units;
          const year = row.original.production_volume_year;
          if (units == null) return "—";
          return (
            <span className="font-mono">
              {formatNumber(units)}
              {year && <span className="text-muted-foreground"> ({year})</span>}
            </span>
          );
        },
      },
      {
        id: "chemistries",
        header: "Chemistries",
        cell: ({ row }) => {
          const items = row.original.chemistries ?? [];
          if (items.length === 0) return "—";
          return (
            <div className="flex flex-wrap gap-1">
              {items.map((c) => (
                <Badge key={c.id} variant="outline" className="font-mono text-[11px]">
                  {c.chemistry_slug} · {formatPercent(c.share_pct, 0)}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "active",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge className="bg-emerald-600 text-white">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
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
      emptyTitle="No vehicle models linked"
    />
  );
}
