"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { MismatchBadgeList } from "@/components/materials/mismatch-badge";
import { useHsCodeMappingMismatches } from "@/lib/hooks/use-materials";
import type { HsCodeMaterialMappingRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

const DEFAULT_LIMIT = 50;

export default function HsMappingMismatchesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "">("");

  const { data, isLoading, error, refetch, isFetching } =
    useHsCodeMappingMismatches({
      page,
      limit,
      severity: severity || undefined,
    });

  const columns = useMemo<ColumnDef<HsCodeMaterialMappingRead, unknown>[]>(
    () => [
      {
        accessorKey: "hs_code_prefix",
        header: "HS code prefix",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">
            {row.original.hs_code_prefix}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "HS description",
        cell: ({ row }) =>
          row.original.description ? (
            <span className="text-sm">{row.original.description}</span>
          ) : (
            <span className="text-xs italic text-amber-700 dark:text-amber-300">
              missing
            </span>
          ),
      },
      {
        id: "material",
        header: "Mapped material",
        cell: ({ row }) => (
          <Link
            href={`/data/materials/${row.original.material_id}`}
            className="text-sm font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.original.material_name ?? `#${row.original.material_id}`}
          </Link>
        ),
      },
      {
        accessorKey: "confidence",
        header: () => <div className="text-right">Confidence</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.confidence} />
          </div>
        ),
      },
      {
        id: "mismatch",
        header: "Reasons",
        cell: ({ row }) => (
          <MismatchBadgeList
            reasons={row.original.mismatch_reasons ?? []}
          />
        ),
      },
      {
        id: "created",
        header: () => <div className="text-right">Created</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatDate(row.original.created_at)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionsMenu
              entityType="hs_code_material_mapping"
              entityId={String(row.original.id)}
              parentId={String(row.original.material_id)}
              entityLabel={`HS ${row.original.hs_code_prefix}`}
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
        <Button asChild variant="ghost" size="sm">
          <Link href="/data/materials">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Materials
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Mismatched HS mappings
        </h1>
        <p className="text-sm text-muted-foreground">
          Every HS-code ↔ material mapping the system has flagged as suspect.
          Click a material to review and confirm or flag the row directly.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <SeverityToggle
          value={severity}
          onChange={(s) => {
            setSeverity(s);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading || (isFetching && rows.length === 0)}
        error={error}
        onRetry={() => refetch()}
        emptyTitle="No mismatched mappings"
        emptyDescription="Every catalogued HS-code mapping currently passes the health checks."
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

interface SeverityToggleProps {
  value: "low" | "medium" | "high" | "";
  onChange: (next: "low" | "medium" | "high" | "") => void;
}

function SeverityToggle({ value, onChange }: SeverityToggleProps) {
  const options: { value: "low" | "medium" | "high" | ""; label: string }[] = [
    { value: "", label: "All severities" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt.value || "all"}
          type="button"
          onClick={() => onChange(opt.value)}
          className={
            value === opt.value
              ? "rounded bg-muted px-2 py-1 font-medium"
              : "rounded px-2 py-1 text-muted-foreground hover:bg-muted/60"
          }
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
