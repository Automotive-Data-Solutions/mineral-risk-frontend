"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { CountryFlag } from "@/components/shared/country-flag";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useFacilities } from "@/lib/hooks/use-facilities";
import type { FacilityListItem } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

interface Filters {
  search: string;
  country: string;
  facility_type: string;
  status: string;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  country: "",
  facility_type: "",
  status: "",
};

export default function FacilitiesListPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== filters.search) {
        setFilters((f) => ({ ...f, search: localSearch }));
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      country: filters.country || undefined,
      facility_type: filters.facility_type || undefined,
      status: filters.status || undefined,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useFacilities(apiParams);

  const columns = useMemo<ColumnDef<FacilityListItem, unknown>[]>(
    () => [
      {
        id: "company",
        header: "Operator",
        cell: ({ row }) =>
          row.original.company_name ? (
            <Link
              href={`/companies/${row.original.company_id}`}
              className="font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.original.company_name}
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">unknown</span>
          ),
      },
      {
        accessorKey: "facility_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">
            {humanize(row.original.facility_type)}
          </Badge>
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex flex-col leading-tight">
            <span className="text-sm">
              {[row.original.city, row.original.region]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
            <CountryFlag code={row.original.country} />
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
        header: "Capacity notes",
        cell: ({ row }) =>
          row.original.capacity_notes ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.capacity_notes}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionsMenu
              entityType="facility"
              entityId={row.original.id}
              entityLabel={
                row.original.company_name
                  ? `${row.original.company_name} · ${humanize(row.original.facility_type)}`
                  : humanize(row.original.facility_type)
              }
            />
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasFilters =
    filters.search ||
    filters.country ||
    filters.facility_type ||
    filters.status;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Facilities</h1>
        <p className="text-sm text-muted-foreground">
          Mines, refineries, cell plants, recyclers — every physical site we
          track.
        </p>
      </div>

      <DataTableToolbar
        actions={
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {data?.total != null ? `${data.total.toLocaleString()} facilities` : ""}
          </span>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search operator or city..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[260px] pl-8"
          />
        </div>
        <Input
          placeholder="Country (ISO-2)"
          maxLength={2}
          value={filters.country}
          onChange={(e) => {
            setFilters({
              ...filters,
              country: e.target.value.toUpperCase(),
            });
            setPage(1);
          }}
          className="h-9 w-[120px] uppercase"
        />
        <Input
          placeholder="Facility type"
          value={filters.facility_type}
          onChange={(e) => {
            setFilters({ ...filters, facility_type: e.target.value });
            setPage(1);
          }}
          className="h-9 w-[160px]"
        />
        <Input
          placeholder="Status"
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setPage(1);
          }}
          className="h-9 w-[140px]"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setLocalSearch("");
              setPage(1);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </DataTableToolbar>

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading || (isFetching && rows.length === 0)}
        error={error}
        onRetry={() => refetch()}
        emptyTitle="No facilities match your filters"
      />

      <DataTablePagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}
