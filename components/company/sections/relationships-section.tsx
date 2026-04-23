"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { FlagEntityButton } from "@/components/shared/flag-entity-button";
import { StageBadge } from "@/components/shared/stage-badge";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { Separator } from "@/components/ui/separator";
import { useCompanyRelationships } from "@/lib/hooks/use-companies";
import { useToggleRelationshipVerified } from "@/lib/hooks/use-verified";
import type { RelationshipRead } from "@/lib/types";
import { formatDate, formatPercent, humanize } from "@/lib/utils/format";

type Side = "buyer" | "supplier";

function useColumns(
  side: Side,
): ColumnDef<RelationshipRead, unknown>[] {
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
              onClick={(e) => e.stopPropagation()}
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
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <VerifiedBadge verified={row.original.verified ?? false} />
          </div>
        ),
      },
    ],
    [side],
  );
}

export function RelationshipsSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<RelationshipRead | null>(null);
  const { data, isLoading, error, refetch } = useCompanyRelationships(companyId);
  const asBuyerCols = useColumns("buyer");
  const asSupplierCols = useColumns("supplier");

  const asBuyer = data?.as_buyer ?? [];
  const asSupplier = data?.as_supplier ?? [];

  return (
    <>
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
            onRowClick={setSelected}
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
            onRowClick={setSelected}
            emptyTitle="No downstream buyer relationships"
          />
        </div>
      </div>
      <RelationshipSideSheet
        companyId={companyId}
        relationship={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

function RelationshipSideSheet({
  companyId,
  relationship,
  open,
  onOpenChange,
}: {
  companyId: string;
  relationship: RelationshipRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const verifyToggle = useToggleRelationshipVerified(companyId);

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>
              {relationship?.counterparty.canonical_name ?? "Relationship details"}
            </DialogTitle>
            <DialogDescription>
              Supply chain relationship details for this company.
            </DialogDescription>
          </DialogHeader>
          {relationship ? (
            <div className="flex items-center gap-2">
              <VerifyToggleButton
                verified={relationship.verified ?? false}
                disabled={verifyToggle.isPending}
                onToggle={() =>
                  verifyToggle.mutate({
                    relationshipId: relationship.id,
                    verified: !(relationship.verified ?? false),
                  })
                }
              />
              <FlagEntityButton
                entityType="company"
                entityId={companyId}
                entityLabel={relationship.counterparty.canonical_name}
                sectionLabel="Relationships"
                buttonLabel="Flag relationship"
              />
            </div>
          ) : null}
          {relationship ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValue
                label="Counterparty"
                value={
                  <Link
                    href={`/companies/${relationship.counterparty.id}`}
                    className="font-medium hover:underline"
                  >
                    {relationship.counterparty.canonical_name}
                  </Link>
                }
              />
              <KeyValue
                label="Relationship type"
                value={humanize(relationship.relationship_type)}
              />
              <KeyValue
                label="Material"
                value={relationship.material_name ?? "—"}
              />
              <KeyValue
                label="Volume share"
                value={formatPercent(relationship.volume_share_pct, 1)}
              />
              <KeyValue
                label="Confidence"
                value={<ConfidenceBadge value={relationship.data_confidence} />}
              />
              <KeyValue
                label="Valid period"
                value={
                  relationship.valid_from || relationship.valid_to
                    ? `${formatDate(relationship.valid_from)} → ${
                        relationship.valid_to
                          ? formatDate(relationship.valid_to)
                          : "present"
                      }`
                    : "—"
                }
              />
            </div>
          ) : null}

          <Separator />

          
        </div>
      </SideSheetContent>
    </SideSheet>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium">{value}</span>
    </div>
  );
}
