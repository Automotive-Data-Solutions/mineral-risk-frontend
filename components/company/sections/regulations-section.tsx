"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { Separator } from "@/components/ui/separator";
import { PlatformTable } from "@/components/platform/platform-table";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { FlagEntityButton } from "@/components/shared/flag-entity-button";
import { KeyValueRow } from "@/components/shared/key-value-row";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { useCompanyRegulations } from "@/lib/hooks/use-companies";
import { useRegulation } from "@/lib/hooks/use-regulations";
import { useToggleRegulationExposureVerified } from "@/lib/hooks/use-verified";
import type { RegulationExposureRead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, humanize } from "@/lib/utils/format";

const STATUS_TONES: Record<string, string> = {
  compliant:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  at_risk: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  non_compliant: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  unknown: "bg-muted text-muted-foreground",
};
const SIDE_SHEET_GRID = "grid-cols-[170px_minmax(0,1fr)]";

export function RegulationsSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<RegulationExposureRead | null>(null);
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useCompanyRegulations(companyId);
  const columns = useMemo<ColumnDef<RegulationExposureRead, unknown>[]>(
    () => [
      {
        id: "regulation",
        header: "Regulation",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.regulation_title ?? row.original.regulation_key}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {row.original.regulation_key}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "policy_theme",
        header: "Theme",
        cell: ({ row }) =>
          row.original.policy_theme ? humanize(row.original.policy_theme) : "—",
      },
      {
        accessorKey: "compliance_status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "border-0",
              STATUS_TONES[row.original.compliance_status] ??
                STATUS_TONES.unknown,
            )}
          >
            {humanize(row.original.compliance_status)}
          </Badge>
        ),
      },
      {
        accessorKey: "effective_date",
        header: "Effective",
        cell: ({ row }) => formatDate(row.original.effective_date),
      },
      {
        accessorKey: "assessed_at",
        header: "Assessed",
        cell: ({ row }) => formatDate(row.original.assessed_at),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <VerifiedBadge verified={row.original.verified ?? false} />
            <RowActionsMenu
              entityType="regulation"
              entityId={String(row.original.regulation_id)}
              entityLabel={
                row.original.regulation_title ?? row.original.regulation_key
              }
              sectionLabel="Regulations"
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PlatformTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={setSelected}
        emptyTitle="No regulatory exposures recorded"
      />
      <RegulationExposureSideSheet
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

function RegulationExposureSideSheet({
  companyId,
  exposure,
  open,
  onOpenChange,
}: {
  companyId: string;
  exposure: RegulationExposureRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const regulationId = exposure ? String(exposure.regulation_id) : "";
  const { data: regulation, isLoading, error } = useRegulation(regulationId);
  const verifyToggle = useToggleRegulationExposureVerified(companyId);

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>
              {exposure?.regulation_title ??
                exposure?.regulation_key ??
                "Regulation details"}
            </DialogTitle>
            <DialogDescription>
              Company-specific regulation exposure details.
            </DialogDescription>
          </DialogHeader>
          {exposure && (
            <div className="flex items-center gap-2">
              <VerifyToggleButton
                verified={exposure.verified ?? false}
                disabled={verifyToggle.isPending}
                onToggle={() =>
                  verifyToggle.mutate({
                    exposureId: exposure.id,
                    verified: !(exposure.verified ?? false),
                  })
                }
              />
              <FlagEntityButton
                entityType="regulation"
                entityId={String(exposure.regulation_id)}
                entityLabel={
                  exposure.regulation_title ?? exposure.regulation_key
                }
                sectionLabel="Regulations"
                buttonLabel="Flag regulation"
              />
            </div>
          )}
          {exposure ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValueRow
                label="Regulation key"
                value={exposure.regulation_key}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Company compliance status"
                value={humanize(exposure.compliance_status)}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Company exposure reason"
                value={
                  exposure.exposure_reason || "No exposure reason provided"
                }
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Company assessed date"
                value={formatDate(exposure.assessed_at)}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
            </div>
          ) : null}

          {exposure ? (
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Regulation profile</h3>
            </div>
          ) : (
            <h3 className="text-sm font-semibold">Regulation profile</h3>
          )}
          <Separator />
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading regulation details...
            </p>
          ) : error ? (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Could not load regulation detail for this row yet. Placeholder
              shown until the regulation detail endpoint is available.
            </div>
          ) : regulation ? (
            <div className="space-y-2 text-sm">
              <KeyValueRow
                label="Title"
                value={regulation.title || "—"}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Location of effect"
                value={regulation.geography || "No geography/location provided"}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Status"
                value={regulation.status || "—"}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Effective date"
                value={formatDate(regulation.effective_date)}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Publication date"
                value={formatDate(regulation.publication_date)}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Issuing body"
                value={regulation.issuing_body || "—"}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <KeyValueRow
                label="Summary"
                value={regulation.summary || "—"}
                gridTemplateClassName={SIDE_SHEET_GRID}
              />
              <div className="space-y-1 rounded-md border bg-muted/20 p-3">
                <p className="text-muted-foreground">`metadata_json`</p>
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {regulation.metadata_json
                    ? JSON.stringify(regulation.metadata_json, null, 2)
                    : "No metadata_json provided"}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </SideSheetContent>
    </SideSheet>
  );
}
