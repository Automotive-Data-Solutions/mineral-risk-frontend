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
import { PlatformTable } from "@/components/platform/platform-table";
import { CountryFlag } from "@/components/shared/country-flag";
import { FlagEntityButton } from "@/components/shared/flag-entity-button";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { useCompanyFacilities } from "@/lib/hooks/use-companies";
import { useToggleFacilityVerified } from "@/lib/hooks/use-verified";
import type { FacilityRead } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

const STATUS_TONES: Record<string, string> = {
  operating: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  under_construction: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  planned: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  mothballed: "bg-muted text-muted-foreground",
  closed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function FacilitiesSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<FacilityRead | null>(null);
  const { data = [], isLoading, error, refetch } = useCompanyFacilities(companyId);

  const columns = useMemo<ColumnDef<FacilityRead, unknown>[]>(
    () => [
      {
        accessorKey: "facility_type",
        header: "Type",
        cell: ({ row }) => humanize(row.original.facility_type),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CountryFlag code={row.original.country} showCode={false} />
            <span>
              {[row.original.city, row.original.region, row.original.country]
                .filter(Boolean)
                .join(", ") || row.original.country}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`border-0 ${STATUS_TONES[row.original.status] ?? ""}`}
          >
            {humanize(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: "ownership_type",
        header: "Role",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.ownership_type
              ? humanize(row.original.ownership_type)
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "capacity_notes",
        header: "Capacity",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-sm">
            {row.original.capacity_notes ?? "—"}
          </span>
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
      <PlatformTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={setSelected}
        emptyTitle="No facilities recorded"
      />
      <FacilitySideSheet
        companyId={companyId}
        facility={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

function FacilitySideSheet({
  companyId,
  facility,
  open,
  onOpenChange,
}: {
  companyId: string;
  facility: FacilityRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const verifyToggle = useToggleFacilityVerified(companyId);

  const title = facility
    ? [humanize(facility.facility_type), facility.city, facility.country]
        .filter(Boolean)
        .join(" · ")
    : "Facility details";

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Facility details and verification status.
            </DialogDescription>
          </DialogHeader>

          {/* Action buttons */}
          {facility ? (
            <div className="flex items-center gap-2">
              <VerifyToggleButton
                verified={facility.verified ?? false}
                disabled={verifyToggle.isPending || !facility.company_facility_id}
                onToggle={() => {
                  if (!facility.company_facility_id) return;
                  verifyToggle.mutate({
                    companyFacilityId: facility.company_facility_id,
                    verified: !(facility.verified ?? false),
                  });
                }}
              />
              <FlagEntityButton
                entityType="facility"
                entityId={facility.id}
                entityLabel={title}
                sectionLabel="Facilities"
                buttonLabel="Flag facility"
              />
            </div>
          ) : null}

          <Separator />

          {/* Detail grid */}
          {facility ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValue label="Type" value={humanize(facility.facility_type)} />
              <KeyValue
                label="Location"
                value={
                  <div className="flex items-center gap-2">
                    <CountryFlag code={facility.country} showCode={false} />
                    <span>
                      {[facility.city, facility.region, facility.country]
                        .filter(Boolean)
                        .join(", ") || facility.country}
                    </span>
                  </div>
                }
              />
              <KeyValue
                label="Status"
                value={
                  <Badge
                    variant="outline"
                    className={`border-0 ${STATUS_TONES[facility.status] ?? ""}`}
                  >
                    {humanize(facility.status)}
                  </Badge>
                }
              />
              {facility.ownership_type && (
                <KeyValue
                  label="Ownership role"
                  value={
                    <span>
                      {humanize(facility.ownership_type)}
                      {facility.ownership_pct != null && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({(facility.ownership_pct * 100).toFixed(0)}%)
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              {facility.latitude != null && facility.longitude != null && (
                <KeyValue
                  label="Coordinates"
                  value={
                    <span className="font-mono text-xs">
                      {facility.latitude.toFixed(4)},{" "}
                      {facility.longitude.toFixed(4)}
                    </span>
                  }
                />
              )}
              {facility.data_source && (
                <KeyValue label="Data source" value={facility.data_source} />
              )}
            </div>
          ) : null}

          {/* Capacity notes — given its own section since it can be long */}
          {facility?.capacity_notes ? (
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">Capacity notes</h3>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/10 p-3 text-sm">
                {facility.capacity_notes}
              </p>
            </div>
          ) : null}
        </div>
      </SideSheetContent>
    </SideSheet>
  );
}

function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium">{value}</span>
    </div>
  );
}
