"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { ScoreChip } from "@/components/platform/score-chip";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { useChemistries } from "@/lib/hooks/use-chemistries";
import type { BatteryChemistryRead } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

export default function ChemistriesListPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const apiParams = useMemo(
    () => ({ page, limit, search: search || undefined }),
    [page, limit, search],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useChemistries(apiParams);

  const columns = useMemo<ColumnDef<BatteryChemistryRead, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Chemistry",
        cell: ({ row }) => (
          <Link
            href={`/data/chemistries/${row.original.id}`}
            className="hover:underline"
          >
            <div className="flex flex-col">
              <span className="font-medium">{row.original.name}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {row.original.slug}
              </span>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span className="p-badge p-badge-outline">{humanize(row.original.status)}</span>
        ),
      },
      {
        id: "risk_score",
        header: () => <div className="text-right">Risk</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ScoreChip
              score={row.original.latest_risk_score?.composite_risk_score}
            />
          </div>
        ),
      },
      {
        id: "score_confidence",
        header: () => <div className="text-right">Confidence</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge
              value={row.original.latest_risk_score?.score_confidence ?? null}
            />
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) =>
          row.original.description ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.description}
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
              entityType="battery_chemistry"
              entityId={String(row.original.id)}
              entityLabel={row.original.name}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageLayout>
      <PageHeader
        title="Battery Chemistries"
        subtitle="Catalogued cell chemistries (LFP, NMC, NCA, …) and their latest chemistry-level risk score."
      />

      <DataTableToolbar
        actions={
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {data?.total != null
              ? `${data.total.toLocaleString()} chemistries`
              : ""}
          </span>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slug or display name..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[280px] pl-8"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
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
        emptyTitle="No chemistries match your search"
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
