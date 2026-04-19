"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { StageBadge } from "@/components/shared/stage-badge";
import { useCompanyRelationships } from "@/lib/hooks/use-companies";
import type { RelationshipRead } from "@/lib/types";
import { formatDate, formatPercent, humanize } from "@/lib/utils/format";

type Side = "buyer" | "supplier";

function useColumns(side: Side): ColumnDef<RelationshipRead, unknown>[] {
  return useMemo(
    () => [
      {
        id: "counterparty",
        header: side === "buyer" ? "Supplier" : "Buyer",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/companies/${row.original.counterparty.id}`}
              className="font-medium hover:underline"
            >
              {row.original.counterparty.canonical_name}
            </Link>
            <StageBadge
              stage={row.original.counterparty.supply_chain_stage}
              className="mt-1 w-fit"
            />
          </div>
        ),
      },
      {
        accessorKey: "relationship_type",
        header: "Type",
        cell: ({ row }) => humanize(row.original.relationship_type),
      },
      {
        accessorKey: "material_name",
        header: "Material",
        cell: ({ row }) => row.original.material_name ?? "—",
      },
      {
        accessorKey: "volume_share_pct",
        header: () => <div className="text-right">Volume %</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatPercent(row.original.volume_share_pct, 1)}
          </div>
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
        id: "valid",
        header: "Valid",
        cell: ({ row }) => {
          const { valid_from, valid_to } = row.original;
          if (!valid_from && !valid_to) return "—";
          return `${formatDate(valid_from)} → ${valid_to ? formatDate(valid_to) : "present"}`;
        },
      },
    ],
    [side],
  );
}

export function RelationshipsSection({ companyId }: { companyId: string }) {
  const { data, isLoading, error, refetch } = useCompanyRelationships(companyId);
  const asBuyerCols = useColumns("buyer");
  const asSupplierCols = useColumns("supplier");

  const asBuyer = data?.as_buyer ?? [];
  const asSupplier = data?.as_supplier ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Upstream suppliers{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (this company buys from)
          </span>
        </h3>
        <DataTable
          data={asBuyer}
          columns={asBuyerCols}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="No upstream supplier relationships"
        />
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Downstream buyers{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            (this company sells to)
          </span>
        </h3>
        <DataTable
          data={asSupplier}
          columns={asSupplierCols}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
          emptyTitle="No downstream buyer relationships"
        />
      </div>
    </div>
  );
}
