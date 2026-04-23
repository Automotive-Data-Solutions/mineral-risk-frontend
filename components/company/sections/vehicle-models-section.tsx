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
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/data-table/data-table";
import { FlagEntityButton } from "@/components/shared/flag-entity-button";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { useCompanyVehicleModels } from "@/lib/hooks/use-companies";
import { useToggleVehicleModelVerified } from "@/lib/hooks/use-verified";
import type { VehicleModelRead } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils/format";

export function VehicleModelsSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<VehicleModelRead | null>(null);
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useCompanyVehicleModels(companyId);

  const columns = useMemo<ColumnDef<VehicleModelRead, unknown>[]>(
    () => [
      {
        accessorKey: "model_name",
        header: "Model",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.model_name}</span>
            {row.original.data_source && (
              <span className="text-xs text-muted-foreground">
                {row.original.data_source}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "years",
        header: "Years",
        cell: ({ row }) => {
          const { model_year_start, model_year_end } = row.original;
          if (!model_year_start && !model_year_end) return "—";
          return `${model_year_start ?? "?"} – ${model_year_end ?? "present"}`;
        },
      },
      {
        id: "production",
        header: "Production",
        cell: ({ row }) => {
          const units = row.original.production_volume_units;
          const year = row.original.production_volume_year;
          if (units == null) return "—";
          return (
            <span className="font-mono">
              {formatNumber(units)}
              {year && <span className="text-muted-foreground"> ({year})</span>}
            </span>
          );
        },
      },
      {
        id: "chemistries",
        header: "Chemistries",
        cell: ({ row }) => {
          const items = row.original.chemistries ?? [];
          if (items.length === 0) return "—";
          return (
            <div className="flex flex-wrap gap-1">
              {items.map((c) => (
                <Badge key={c.id} variant="outline" className="font-mono text-[11px]">
                  {c.chemistry_slug} · {formatPercent(c.share_pct, 0)}
                </Badge>
              ))}
            </div>
          );
        },
      },
      {
        id: "active",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge className="bg-emerald-600 text-white">Active</Badge>
          ) : (
            <Badge variant="outline">Inactive</Badge>
          ),
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
        emptyTitle="No vehicle models linked"
      />
      <VehicleModelSideSheet
        companyId={companyId}
        model={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

function VehicleModelSideSheet({
  companyId,
  model,
  open,
  onOpenChange,
}: {
  companyId: string;
  model: VehicleModelRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const verifyToggle = useToggleVehicleModelVerified(companyId);

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>{model?.model_name ?? "Vehicle model details"}</DialogTitle>
            <DialogDescription>
              Vehicle model linked to this company.
            </DialogDescription>
          </DialogHeader>
          {model ? (
            <div className="flex items-center gap-2">
              <VerifyToggleButton
                verified={model.verified ?? false}
                disabled={verifyToggle.isPending}
                onToggle={() =>
                  verifyToggle.mutate({
                    modelId: model.id,
                    verified: !(model.verified ?? false),
                  })
                }
              />
              <FlagEntityButton
                entityType="company"
                entityId={companyId}
                entityLabel={model.model_name}
                sectionLabel="Vehicle Models"
                buttonLabel="Flag model"
              />
            </div>
          ) : null}
          {model ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValue label="Model name" value={model.model_name} />
              <KeyValue
                label="Years"
                value={
                  model.model_year_start || model.model_year_end
                    ? `${model.model_year_start ?? "?"} – ${model.model_year_end ?? "present"}`
                    : "—"
                }
              />
              <KeyValue
                label="Production volume"
                value={
                  model.production_volume_units != null
                    ? `${formatNumber(model.production_volume_units)}${
                        model.production_volume_year
                          ? ` (${model.production_volume_year})`
                          : ""
                      }`
                    : "—"
                }
              />
              <KeyValue
                label="Status"
                value={
                  model.is_active ? (
                    <Badge className="bg-emerald-600 text-white">Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )
                }
              />
              <KeyValue label="Data source" value={model.data_source ?? "—"} />
              {model.chemistries && model.chemistries.length > 0 && (
                <KeyValue
                  label="Chemistries"
                  value={
                    <div className="flex flex-wrap gap-1">
                      {model.chemistries.map((c) => (
                        <Badge
                          key={c.id}
                          variant="outline"
                          className="font-mono text-[11px]"
                        >
                          {c.chemistry_slug} · {formatPercent(c.share_pct, 0)}
                        </Badge>
                      ))}
                    </div>
                  }
                />
              )}
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
