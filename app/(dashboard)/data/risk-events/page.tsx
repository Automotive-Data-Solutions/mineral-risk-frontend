"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useRiskEvents } from "@/lib/hooks/use-risk-events";
import type { RiskEventRead } from "@/lib/types";
import { formatDate, humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

interface Filters {
  search: string;
  event_type: string;
  severity_min: number;
}

const INITIAL_FILTERS: Filters = { search: "", event_type: "", severity_min: 0 };

export default function RiskEventsListPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [localType, setLocalType] = useState(filters.event_type);

  useEffect(() => {
    const t = setTimeout(() => {
      if (
        localSearch !== filters.search ||
        localType !== filters.event_type
      ) {
        setFilters((f) => ({
          ...f,
          search: localSearch,
          event_type: localType,
        }));
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, localType]);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search || undefined,
      event_type: filters.event_type || undefined,
      severity_min: filters.severity_min > 0 ? filters.severity_min : undefined,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useRiskEvents(apiParams);

  const columns = useMemo<ColumnDef<RiskEventRead, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Event",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            {row.original.summary && (
              <span className="line-clamp-1 text-xs text-muted-foreground">
                {row.original.summary}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "event_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline">{humanize(row.original.event_type)}</Badge>
        ),
      },
      {
        accessorKey: "event_date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.event_date)}
          </span>
        ),
      },
      {
        accessorKey: "severity_score",
        header: () => <div className="text-right">Severity</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.severity_score} />
          </div>
        ),
      },
      {
        accessorKey: "confidence_score",
        header: () => <div className="text-right">Confidence</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.confidence_score} />
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionsMenu
              entityType="risk_event"
              entityId={String(row.original.id)}
              entityLabel={row.original.title}
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
    filters.search || filters.event_type || filters.severity_min > 0;

  return (
    <PageLayout>
      <PageHeader
        title="Risk Events"
        subtitle="Ingested supply-chain risk signals (incidents, disruptions, policy shocks, sanctions)."
      />

      <DataTableToolbar
        actions={
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {data?.total != null ? `${data.total.toLocaleString()} events` : ""}
          </span>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or summary..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[280px] pl-8"
          />
        </div>
        <Input
          placeholder="Event type"
          value={localType}
          onChange={(e) => setLocalType(e.target.value)}
          className="h-9 w-[160px]"
        />
        <div className="flex w-[240px] items-center gap-2 rounded-md border px-2 py-1 text-xs">
          <span className="text-muted-foreground">Min severity</span>
          <Slider
            className="flex-1"
            value={[filters.severity_min * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(vals) => {
              const v0 = vals[0];
              if (v0 == null) return;
              setFilters({ ...filters, severity_min: v0 / 100 });
              setPage(1);
            }}
          />
          <span className="w-8 tabular-nums text-right font-mono">
            {Math.round(filters.severity_min * 100)}%
          </span>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setLocalSearch("");
              setLocalType("");
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
        emptyTitle="No risk events match your filters"
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
