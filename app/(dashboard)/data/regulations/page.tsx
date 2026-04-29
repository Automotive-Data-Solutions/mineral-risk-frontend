"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { CountryFlag } from "@/components/shared/country-flag";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useRegulations } from "@/lib/hooks/use-regulations";
import type { RegulationRead } from "@/lib/types";
import { formatDate, humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  proposed: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  enacted: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  superseded: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
  repealed: "bg-muted text-muted-foreground",
};

interface Filters {
  search: string;
  status: string;
  policy_theme: string;
}

const INITIAL_FILTERS: Filters = { search: "", status: "", policy_theme: "" };

export default function RegulationsListPage() {
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
      status: filters.status || undefined,
      policy_theme: filters.policy_theme || undefined,
    }),
    [page, limit, filters],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useRegulations(apiParams);

  const columns = useMemo<ColumnDef<RegulationRead, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Regulation",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.title || row.original.regulation_key}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.regulation_key}
              {row.original.issuing_body
                ? ` · ${row.original.issuing_body}`
                : ""}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "geography",
        header: "Geography",
        cell: ({ row }) => <CountryFlag code={row.original.geography} />,
      },
      {
        accessorKey: "policy_theme",
        header: "Theme",
        cell: ({ row }) =>
          row.original.policy_theme ? (
            <Badge variant="outline">
              {humanize(row.original.policy_theme)}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status ?? "";
          if (!status) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <Badge
              variant="outline"
              className={`border-0 ${
                STATUS_TONE[status.toLowerCase()] ??
                "bg-muted text-muted-foreground"
              }`}
            >
              {humanize(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "effective_date",
        header: () => <div className="text-right">Effective</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatDate(row.original.effective_date)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionsMenu
              entityType="regulation"
              entityId={String(row.original.id)}
              entityLabel={row.original.title ?? row.original.regulation_key}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasFilters = filters.search || filters.status || filters.policy_theme;

  return (
    <PageLayout>
      <PageHeader
        title="Regulations"
        subtitle="Trade, environmental, and battery-policy regulations the scoring engine consumes."
      />

      <DataTableToolbar
        actions={
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {data?.total != null ? `${data.total.toLocaleString()} regulations` : ""}
          </span>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or key..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[260px] pl-8"
          />
        </div>
        <Select
          value={filters.status || "all"}
          onValueChange={(v) => {
            setFilters({ ...filters, status: v === "all" ? "" : v });
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="enacted">Enacted</SelectItem>
            <SelectItem value="superseded">Superseded</SelectItem>
            <SelectItem value="repealed">Repealed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Policy theme"
          value={filters.policy_theme}
          onChange={(e) => {
            setFilters({ ...filters, policy_theme: e.target.value });
            setPage(1);
          }}
          className="h-9 w-[180px]"
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
        emptyTitle="No regulations match your filters"
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
