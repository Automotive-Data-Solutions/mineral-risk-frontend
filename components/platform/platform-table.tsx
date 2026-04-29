"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import type { CSSProperties, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

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
}: PlatformTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
                {hg.headers.map((header) => (
                  <th key={header.id} className={thClass}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
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
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    striped && row.index % 2 === 1 && "bg-muted/25 dark:bg-muted/15",
                    onRowClick &&
                      "cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/25",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={tdClasses()}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
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
