"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { CountryFlag } from "@/components/shared/country-flag";
import { useCompanyFacilities } from "@/lib/hooks/use-companies";
import type { FacilityRead } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

export function FacilitiesSection({ companyId }: { companyId: string }) {
  const { data = [], isLoading, error, refetch } = useCompanyFacilities(companyId);
  const columns = useMemo<ColumnDef<FacilityRead, unknown>[]>(
    () => [
      {
        accessorKey: "facility_type",
        header: "Type",
        cell: ({ row }) => humanize(row.original.facility_type),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CountryFlag code={row.original.country} showCode={false} />
            <span>
              {[row.original.city, row.original.region, row.original.country]
                .filter(Boolean)
                .join(", ") || row.original.country}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline">{humanize(row.original.status)}</Badge>
        ),
      },
      {
        accessorKey: "capacity_notes",
        header: "Capacity",
        cell: ({ row }) => row.original.capacity_notes ?? "—",
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
      emptyTitle="No facilities recorded"
    />
  );
}
