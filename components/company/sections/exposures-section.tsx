"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, CheckCircle2, Flag } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { CountryFlag } from "@/components/shared/country-flag";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { KeyValueRow } from "@/components/shared/key-value-row";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { Separator } from "@/components/ui/separator";
import { useEntityNotes } from "@/lib/hooks/use-entity-notes";
import { useCompanyExposures } from "@/lib/hooks/use-companies";
import { useMaterial } from "@/lib/hooks/use-materials";
import { useToggleExposureVerified } from "@/lib/hooks/use-verified";
import type { ExposureRead } from "@/lib/types";
import { formatDate, formatNumber, humanize } from "@/lib/utils/format";

export function ExposuresSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<ExposureRead | null>(null);
  const { data = [], isLoading, error, refetch } = useCompanyExposures(companyId);
  const columns = useMemo<ColumnDef<ExposureRead, unknown>[]>(
    () => [
      { accessorKey: "material_name", header: "Material" },
      {
        accessorKey: "supply_chain_stage",
        header: "Stage",
        cell: ({ row }) => humanize(row.original.supply_chain_stage),
      },
      {
        accessorKey: "source_geography",
        header: "Source",
        cell: ({ row }) => <CountryFlag code={row.original.source_geography} />,
      },
      {
        accessorKey: "exposure_score",
        header: () => <div className="text-right">Exposure</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.exposure_score, 2)}
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
        accessorKey: "as_of_date",
        header: "As of",
        cell: ({ row }) => formatDate(row.original.as_of_date),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <VerifiedBadge verified={row.original.verified ?? false} />
            <RowActionsMenu
              entityType="company_material_exposure"
              entityId={String(row.original.id)}
              parentId={companyId}
              entityLabel={row.original.material_name}
              sectionLabel="Exposures"
            />
          </div>
        ),
      },
    ],
    [companyId],
  );

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={setSelected}
        emptyTitle="No material exposures recorded"
      />
      <MaterialExposureSideSheet
        companyId={companyId}
        exposure={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

function MaterialExposureSideSheet({
  companyId,
  exposure,
  open,
  onOpenChange,
}: {
  companyId: string;
  exposure: ExposureRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const exposureId = exposure ? String(exposure.id) : "";
  const materialId = exposure ? String(exposure.material_id) : "";
  const verifyToggle = useToggleExposureVerified(companyId);
  const { data: material, isLoading, error } = useMaterial(materialId);
  const {
    data: exposureNotes = [],
    isLoading: notesLoading,
    error: notesError,
  } = useEntityNotes("company_material_exposure", exposureId, companyId, {
    enabled: open && Boolean(exposureId),
  });

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>{exposure?.material_name ?? "Material quick view"}</DialogTitle>
            <DialogDescription>
              Exposure quick view for this company-material row.
            </DialogDescription>
          </DialogHeader>
          {exposure ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={verifyToggle.isPending}
                  onClick={() =>
                    verifyToggle.mutate({
                      exposureId: exposure.id,
                      verified: !(exposure.verified ?? false),
                    })
                  }
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {exposure.verified ? "Remove verification" : "Mark as verified"}
                </Button>
                <EntityFlagIssueDialog
                  entityType="company_material_exposure"
                  entityId={String(exposure.id)}
                  parentId={companyId}
                  entityLabel={exposure.material_name}
                  sectionLabel="Exposures"
                  trigger={
                    <Button variant="outline" size="sm">
                      <Flag className="h-3.5 w-3.5" />
                      Flag exposure
                    </Button>
                  }
                />
              </div>
            ) : null}
          {exposure ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValueRow
                label="Exposure score"
                value={formatNumber(exposure.exposure_score, 2)}
              />
              <KeyValueRow
                label="Supply-chain stage"
                value={humanize(exposure.supply_chain_stage)}
              />
              <KeyValueRow
                label="Source geography"
                value={
                  exposure.source_geography ? (
                    <CountryFlag code={exposure.source_geography} />
                  ) : (
                    "—"
                  )
                }
              />
              <KeyValueRow
                label="Data confidence"
                value={<ConfidenceBadge value={exposure.data_confidence} />}
              />
              <KeyValueRow label="As of date" value={formatDate(exposure.as_of_date)} />
              <KeyValueRow label="Rationale" value={exposure.rationale || "—"} />
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Material profile</h3>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading material details...</p>
          ) : error ? (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Could not load material detail for this row yet. Placeholder shown until the
              material detail endpoint is available.
            </div>
          ) : material ? (
            <div className="space-y-3 text-sm">
              <KeyValueRow label="Name" value={material.canonical_name} />
              <KeyValueRow label="Category" value={material.category || "—"} />
              <KeyValueRow
                label="Criticality score"
                value={
                  material.criticality_score == null
                    ? "—"
                    : formatNumber(material.criticality_score, 2)
                }
              />
              <div className="flex flex-wrap gap-2">
                {material.is_ira_critical_mineral ? (
                  <Badge variant="outline">IRA critical mineral</Badge>
                ) : null}
                {material.is_eu_crma_critical ? (
                  <Badge variant="outline">EU CRMA critical</Badge>
                ) : null}
                {!material.is_ira_critical_mineral && !material.is_eu_crma_critical ? (
                  <span className="text-muted-foreground">No critical tags</span>
                ) : null}
              </div>
              <KeyValueRow
                label="HS code prefixes"
                value={
                  material.hs_code_mappings.length > 0
                    ? material.hs_code_mappings
                        .slice(0, 8)
                        .map((m) => m.hs_code_prefix)
                        .join(", ")
                    : "No HS code mappings"
                }
              />
              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Primary producing countries unavailable
                </p>
                <p className="mt-1">
                  Placeholder: this quick view needs a dedicated material field (for example
                  `primary_producing_countries`) from the backend.
                </p>
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Exposure notes on this row</h3>
            {notesLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            ) : notesError ? (
              <p className="text-sm text-muted-foreground">
                Could not load exposure notes yet.
              </p>
            ) : exposureNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notes yet for this exposure row.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {exposureNotes.slice(0, 5).map((note) => (
                  <li key={note.id} className="rounded-md border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      {humanize(note.note_type)} · {formatDate(note.created_at)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{note.note_text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </SideSheetContent>
    </SideSheet>
  );
}
