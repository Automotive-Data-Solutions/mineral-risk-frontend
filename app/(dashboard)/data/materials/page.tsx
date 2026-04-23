"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { MaterialCriticalTags } from "@/components/shared/material-critical-tags";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useMaterials } from "@/lib/hooks/use-materials";
import type { MaterialListItem } from "@/lib/types";
import { humanize } from "@/lib/utils/format";
import {
  INITIAL_MATERIAL_FILTERS,
  MaterialsFilterBar,
  type MaterialsFilters,
} from "./materials-filter-bar";

const DEFAULT_LIMIT = 25;

export default function MaterialsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<MaterialsFilters>(
    INITIAL_MATERIAL_FILTERS,
  );

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      category: filters.category || undefined,
      is_ira_critical: filters.is_ira_critical || undefined,
      is_eu_crma_critical: filters.is_eu_crma_critical || undefined,
      has_mismatched_mappings: filters.has_mismatched_mappings || undefined,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useMaterials(apiParams);

  const columns = useMemo<ColumnDef<MaterialListItem, unknown>[]>(
    () => [
      {
        accessorKey: "canonical_name",
        header: "Material",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.canonical_name}</span>
            <span className="text-xs text-muted-foreground">
              {humanize(row.original.category)}
            </span>
          </div>
        ),
      },
      {
        id: "criticality_flags",
        header: "Critical",
        cell: ({ row }) => (
          <MaterialCriticalTags
            isIraCritical={row.original.is_ira_critical_mineral}
            isEuCrmaCritical={row.original.is_eu_crma_critical}
            emptyLabel="—"
          />
        ),
      },
      {
        accessorKey: "criticality_score",
        header: () => <div className="text-right">Criticality</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.criticality_score} />
          </div>
        ),
      },
      {
        accessorKey: "hs_code_mapping_count",
        header: () => <div className="text-right">HS mappings</div>,
        cell: ({ row }) => (
          <div className="flex flex-col items-end leading-tight">
            <span className="font-mono text-sm">
              {row.original.hs_code_mapping_count}
            </span>
            {row.original.mapping_mismatch_count > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {row.original.mapping_mismatch_count} suspect
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionsMenu
              entityType="material"
              entityId={String(row.original.id)}
              entityLabel={row.original.canonical_name}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const anyMismatches = rows.some((r) => r.mapping_mismatch_count > 0);

  const handleFiltersChange = (next: MaterialsFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materials</h1>
          <p className="text-sm text-muted-foreground">
            Canonical material registry. Click a row to compare against its
            HS-code mappings.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/data/materials/mismatches">
            <AlertTriangle className="h-3.5 w-3.5" />
            All mismatched mappings
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {anyMismatches && !filters.has_mismatched_mappings && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Some materials on this page have HS-code mappings the system
            flagged as suspect.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-amber-900 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
            onClick={() =>
              setFilters((f) => ({ ...f, has_mismatched_mappings: true }))
            }
          >
            Show only those
          </Button>
        </div>
      )}

      <MaterialsFilterBar
        value={filters}
        onChange={handleFiltersChange}
        total={data?.total}
      />

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading || (isFetching && rows.length === 0)}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(row) => router.push(`/data/materials/${row.id}`)}
        emptyTitle="No materials match your filters"
        emptyDescription="Try clearing filters or broadening your search."
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
