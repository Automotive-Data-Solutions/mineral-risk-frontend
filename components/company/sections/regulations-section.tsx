"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { DataTable } from "@/components/data-table/data-table";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { useCompanyRegulations } from "@/lib/hooks/use-companies";
import { useRegulation } from "@/lib/hooks/use-regulations";
import type { RegulationExposureRead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, humanize } from "@/lib/utils/format";

const STATUS_TONES: Record<string, string> = {
  compliant: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  at_risk: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  non_compliant: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  unknown: "bg-muted text-muted-foreground",
};

export function RegulationsSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<RegulationExposureRead | null>(null);
  const { data = [], isLoading, error, refetch } = useCompanyRegulations(companyId);
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
              STATUS_TONES[row.original.compliance_status] ?? STATUS_TONES.unknown,
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
          <div className="flex justify-end">
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
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={setSelected}
        emptyTitle="No regulatory exposures recorded"
      />
      <RegulationExposureSideSheet
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
  exposure,
  open,
  onOpenChange,
}: {
  exposure: RegulationExposureRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const regulationId = exposure ? String(exposure.regulation_id) : "";
  const { data: regulation, isLoading, error } = useRegulation(regulationId);

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>
              {exposure?.regulation_title ?? exposure?.regulation_key ?? "Regulation details"}
            </DialogTitle>
            <DialogDescription>
              Company-specific regulation exposure details.
            </DialogDescription>
          </DialogHeader>

          {exposure ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValue label="Regulation key" value={exposure.regulation_key} />
              <KeyValue
                label="Company compliance status"
                value={humanize(exposure.compliance_status)}
              />
              <KeyValue
                label="Company exposure reason"
                value={exposure.exposure_reason || "No exposure reason provided"}
              />
              <KeyValue
                label="Company assessed date"
                value={formatDate(exposure.assessed_at)}
              />
            </div>
          ) : null}

          <h3 className="text-sm font-semibold">Regulation profile</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading regulation details...</p>
          ) : error ? (
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Could not load regulation detail for this row yet. Placeholder shown until the
              regulation detail endpoint is available.
            </div>
          ) : regulation ? (
            <div className="space-y-2 text-sm">
              <KeyValue label="Title" value={regulation.title || "—"} />
              <KeyValue
                label="Location of effect"
                value={regulation.geography || "No geography/location provided"}
              />
              <KeyValue label="Status" value={regulation.status || "—"} />
              <KeyValue
                label="Effective date"
                value={formatDate(regulation.effective_date)}
              />
              <KeyValue
                label="Publication date"
                value={formatDate(regulation.publication_date)}
              />
              <KeyValue label="Issuing body" value={regulation.issuing_body || "—"} />
              <KeyValue label="Summary" value={regulation.summary || "—"} />
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

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[170px_minmax(0,1fr)] items-start gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium">{value}</span>
    </div>
  );
}
