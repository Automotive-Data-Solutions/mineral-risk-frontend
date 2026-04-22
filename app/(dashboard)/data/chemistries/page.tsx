"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useChemistries } from "@/lib/hooks/use-chemistries";
import type { BatteryChemistryRead } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

const RISK_BAND_TONE: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  MOD: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  HIGH: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  CRIT: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

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
        accessorKey: "display_name",
        header: "Chemistry",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.display_name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <Badge variant="outline">{humanize(row.original.category)}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "latest_risk_band",
        header: "Risk band",
        cell: ({ row }) => {
          const band = row.original.latest_risk_band;
          if (!band) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <Badge
              variant="outline"
              className={`border-0 ${
                RISK_BAND_TONE[band.toUpperCase()] ??
                "bg-muted text-muted-foreground"
              }`}
            >
              {band.toUpperCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "latest_risk_score",
        header: () => <div className="text-right">Score</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.latest_risk_score} />
          </div>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) =>
          row.original.notes ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.notes}
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
              entityLabel={row.original.display_name}
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
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Battery Chemistries
        </h1>
        <p className="text-sm text-muted-foreground">
          Catalogued cell chemistries (LFP, NMC, NCA, …) and their latest
          chemistry-level risk score.
        </p>
      </div>

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
    </div>
  );
}
