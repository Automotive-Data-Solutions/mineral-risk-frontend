"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlatformTable } from "@/components/platform/platform-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { MaterialCriticalTags } from "@/components/shared/material-critical-tags";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { CountrySharePill } from "@/components/shared/country-share-pill";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { ScoreChip } from "@/components/platform/score-chip";
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
        cell: ({ row }) => {
          const { canonical_name, symbol_or_code, category, verified } = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{canonical_name}</span>
                <VerifiedBadge verified={verified} />
              </div>
              <span className="text-xs text-muted-foreground">
                {[symbol_or_code, humanize(category)].filter(Boolean).join(" · ")}
              </span>
            </div>
          );
        },
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
        cell: ({ row }) => {
          const v = row.original.criticality_score;
          if (v == null) return <div className="text-right text-xs text-muted-foreground">—</div>;
          const display = v <= 1 ? Math.round(v * 100) : Math.round(v);
          return (
            <div className="text-right font-mono text-sm tabular-nums">{display}</div>
          );
        },
      },
      {
        id: "top_sources",
        header: "Top Sources",
        cell: ({ row }) => {
          const countries = row.original.primary_producing_countries;
          if (!countries || countries.length === 0)
            return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {countries.slice(0, 4).map((code) => (
                <CountrySharePill key={code} code={code} />
              ))}
            </div>
          );
        },
      },
      {
        id: "risk",
        header: () => <div className="text-right">Risk</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ScoreChip
              score={row.original.latest_overall_risk_score}
              showBandLabel={false}
            />
          </div>
        ),
      },
      {
        id: "hs_mappings",
        header: () => <div className="text-right">HS Mappings</div>,
        cell: ({ row }) => (
          <div className="flex flex-col items-end leading-tight">
            <span className="font-mono text-sm tabular-nums">
              {row.original.hs_mapping_count}
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
    <PageLayout>
      <PageHeader
        title="Materials"
        subtitle="Canonical material registry. Click a row to compare against its HS-code mappings."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/data/materials/mismatches">
              <AlertTriangle className="h-3.5 w-3.5" />
              All mismatched mappings
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        }
      />

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

      <PlatformTable
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
    </PageLayout>
  );
}
