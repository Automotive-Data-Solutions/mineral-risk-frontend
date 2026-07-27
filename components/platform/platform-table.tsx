"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

// Column meta extension — gives column defs a typed slot for header
// alignment so right-aligned columns (numerics, dates) render the
// sortable button on the right edge.  Other custom meta fields can
// extend this declaration as features are added.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Horizontal alignment hint for sortable header buttons. */
    align?: "left" | "right";
  }
}

/** @deprecated Prefer Tailwind utilities on `PlatformTable`. Kept for any legacy callers. */
export const platformTableHeadCellStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

/** @deprecated Prefer Tailwind utilities on `PlatformTable`. */
export const platformTableBodyCellStyle: CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
};

const thClass =
  "border-b border-border bg-muted/50 px-4 py-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:bg-muted/25";

function tdClasses(): string {
  return cn(
    "border-b border-border/70 px-4 py-[11px] align-middle text-sm text-foreground transition-colors dark:border-border/50",
  );
}

export interface PlatformTableProps<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
  skeletonRows?: number;
  /**
   * When true: no outer card rim — horizontal scroll wrapper only (e.g. inside `PlatformCard`).
   */
  embedded?: boolean;
  /** Title row above grid (dashboard register layout). */
  tableTitle?: ReactNode;
  /** Muted subtitle under title — e.g. counts. */
  tableSubtitle?: ReactNode;
  /** Zebra-striped body rows. Default true */
  striped?: boolean;
  /**
   * When provided, a full-width sub-row is rendered below each row for which
   * `isRowExpanded` returns true.  Requires `onRowClick` to be wired to toggle
   * the expanded state in the parent.
   */
  renderSubComponent?: (row: TData) => ReactNode;
  /** Called per-row to decide whether the sub-component is visible. */
  isRowExpanded?: (row: TData) => boolean;
  /**
   * Sort state for headers that opted in via ``columnDef.enableSorting``.
   * Pass alongside ``onSortingChange`` to make those headers interactive.
   * Per-column opt-in (rather than enabling sort everywhere) keeps the
   * default visual unchanged for tables that don't need sorting.
   *
   * Pair with ``manualSorting=true`` when the row order is decided by the
   * server (e.g. paginated APIs that take ``sort_by`` / ``sort_dir``); the
   * parent translates the ``SortingState`` to query params.  When omitted,
   * TanStack sorts the in-memory ``data`` array client-side.
   */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** When true, parent owns the sort logic (server-side).  Default false. */
  manualSorting?: boolean;
}

/** Dashboard register-style data table — slate header, zebra rows, optional title block */
export function PlatformTable<TData extends RowData>({
  data,
  columns,
  isLoading,
  error,
  onRetry,
  onRowClick,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  className,
  skeletonRows = 8,
  embedded = false,
  tableTitle,
  tableSubtitle,
  striped = true,
  renderSubComponent,
  isRowExpanded,
  sorting,
  onSortingChange,
  manualSorting = false,
}: PlatformTableProps<TData>) {
  // Sortable headers activate only when the parent passes both the state
  // and the change handler.  Per-column opt-in still required via
  // ``columnDef.enableSorting``.
  const sortingEnabled = sorting != null && onSortingChange != null;
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(sortingEnabled
      ? {
          state: { sorting },
          onSortingChange,
          // Default: TanStack does the sort on the in-memory data.
          // When manualSorting=true, the row order is the parent's
          // responsibility (used by server-paginated tables — they
          // translate SortingState to API params and re-fetch).
          ...(manualSorting
            ? { manualSorting: true }
            : { getSortedRowModel: getSortedRowModel() }),
        }
      : {}),
  });

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  const colCount = Math.max(columns.length, 1);
  const hasHeaderBand = Boolean(tableTitle ?? tableSubtitle);

  return (
    <div
      className={cn(
        embedded
          ? "overflow-hidden"
          : "overflow-hidden rounded-lg border border-border bg-card shadow-sm dark:border-border/80 dark:shadow-none",
        className,
      )}
    >
      {hasHeaderBand && (
        <div className={cn(!embedded ? "border-b border-border px-5 py-4" : "px-5 py-4")}>
          {tableTitle != null && (
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {tableTitle}
            </h3>
          )}
          {tableSubtitle != null && (
            <div className="mt-1 text-sm text-muted-foreground">{tableSubtitle}</div>
          )}
        </div>
      )}
      <div className={cn("overflow-x-auto", embedded ? "" : "")}>
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  // Per-column opt-in via ColumnDef.enableSorting — when
                  // that flag is set AND the parent passed sorting props,
                  // wrap the header content in a clickable button with
                  // chevron indicators.  Otherwise render the header
                  // content directly (preserves existing behaviour for
                  // tables that don't use sorting).
                  const canSort = sortingEnabled && header.column.getCanSort();
                  const align = header.column.columnDef.meta?.align ?? "left";
                  const headerContent = header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      );
                  return (
                    <th key={header.id} className={thClass}>
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex select-none items-center gap-1 transition-colors",
                            header.column.getIsSorted()
                              ? "text-foreground"
                              : "hover:text-foreground",
                            align === "right" && "w-full justify-end",
                          )}
                          aria-label={`Sort by ${header.column.id}`}
                        >
                          <span>{headerContent}</span>
                          {header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="h-3 w-3" strokeWidth={2} />
                          ) : header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="h-3 w-3" strokeWidth={2} />
                          ) : (
                            <ArrowUpDown
                              className="h-3 w-3 opacity-40"
                              strokeWidth={1.75}
                            />
                          )}
                        </button>
                      ) : (
                        headerContent
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                <tr
                  key={`skeleton-${rowIdx}`}
                  className={
                    striped && rowIdx % 2 === 1 ? "bg-muted/25 dark:bg-muted/15" : ""
                  }
                >
                  {columns.map((_col, colIdx) => (
                    <td key={`skeleton-${rowIdx}-${colIdx}`} className={tdClasses()}>
                      <Skeleton className="h-4 w-full max-w-[14rem]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const expanded = isRowExpanded ? isRowExpanded(row.original) : false;
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      className={cn(
                        striped && row.index % 2 === 1 && "bg-muted/25 dark:bg-muted/15",
                        onRowClick &&
                          "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/25",
                        expanded && "bg-muted/30 dark:bg-muted/20",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={tdClasses()}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {expanded && renderSubComponent && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="border-b border-border/70 bg-muted/10 px-0 py-0 dark:border-border/50"
                        >
                          {renderSubComponent(row.original)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={colCount} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-0 py-16"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
