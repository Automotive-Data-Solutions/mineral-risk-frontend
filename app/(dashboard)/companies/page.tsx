"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PlatformTable } from "@/components/platform/platform-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { StageBadge } from "@/components/shared/stage-badge";
import { CountryFlag } from "@/components/shared/country-flag";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ScoreBadge } from "@/components/scoring/score-badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { useCompanies } from "@/lib/hooks/use-companies";
import type { CompanyListItem, RiskBand } from "@/lib/types";
import {
  CompaniesFilterBar,
  INITIAL_FILTERS,
  type CompaniesFilters,
} from "./companies-filter-bar";

const DEFAULT_LIMIT = 25;

export default function CompaniesListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<CompaniesFilters>(INITIAL_FILTERS);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      stage: filters.stage || undefined,
      country: filters.country || undefined,
      min_confidence: filters.min_confidence > 0 ? filters.min_confidence : undefined,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, error, refetch, isFetching } = useCompanies(apiParams);

  const columns = useMemo<ColumnDef<CompanyListItem, unknown>[]>(
    () => [
      {
        accessorKey: "canonical_name",
        header: "Company",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.canonical_name}</span>
            {row.original.legal_name &&
              row.original.legal_name !== row.original.canonical_name && (
                <span className="text-xs text-muted-foreground">
                  {row.original.legal_name}
                </span>
              )}
          </div>
        ),
      },
      {
        accessorKey: "supply_chain_stage",
        header: "Stage",
        cell: ({ row }) => <StageBadge stage={row.original.supply_chain_stage} />,
      },
      {
        accessorKey: "headquarters_country",
        header: "HQ",
        cell: ({ row }) => (
          <CountryFlag code={row.original.headquarters_country} />
        ),
      },
      {
        accessorKey: "parent_company_name",
        header: "Parent",
        cell: ({ row }) =>
          row.original.parent_company_name ? (
            <span className="text-sm">{row.original.parent_company_name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
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
        id: "score",
        header: () => <div className="text-right">Risk Score</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ScoreBadge
              score={row.original.latest_overall_score}
              band={(row.original.latest_risk_band as RiskBand | null) ?? null}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleFiltersChange = (next: CompaniesFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <PageLayout>
      <PageHeader
        title="Companies"
        subtitle="Browse and search the canonical company directory."
      />

      <CompaniesFilterBar
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
        onRowClick={(row) => router.push(`/companies/${row.id}`)}
        emptyTitle="No companies match your filters"
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
