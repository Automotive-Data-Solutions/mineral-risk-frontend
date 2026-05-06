"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { PageLayout } from "@/components/platform/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { RegulationCard } from "@/components/regulations/regulation-card";
import { useMaterials } from "@/lib/hooks/use-materials";
import { useRegulations } from "@/lib/hooks/use-regulations";
import { cn } from "@/lib/utils";
import type { RegulationRead } from "@/lib/types";

type StatusFilter = "all" | "effective" | "enacted" | "proposed";
type JurisdictionFilter = "all" | "US" | "EU";

const PAGE_LIMIT = 200;

export default function RegulationsListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [jurisdictionFilter, setJurisdictionFilter] =
    useState<JurisdictionFilter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Single fetch of all regulations.  Server-side filtering would re-query
  // on every pill click; client-side filtering is faster at this scale.
  const {
    data: regulationsResp,
    isLoading,
    error,
    refetch,
  } = useRegulations({ page: 1, limit: PAGE_LIMIT });

  // Pull material list once so chip labels can render canonical names
  // instead of bare IDs.  39-row request, cached after first load.
  const { data: materialsResp } = useMaterials({
    page: 1,
    limit: 200,
  });

  const materialNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const m of materialsResp?.data ?? []) {
      map[m.id] = m.canonical_name;
    }
    return map;
  }, [materialsResp]);

  const filtered = useMemo(() => {
    const all = regulationsResp?.data ?? [];
    return all.filter((r: RegulationRead) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (
        jurisdictionFilter !== "all" &&
        r.geography !== jurisdictionFilter
      )
        return false;
      if (verifiedOnly && !r.verified) return false;
      return true;
    });
  }, [regulationsResp, statusFilter, jurisdictionFilter, verifiedOnly]);

  const total = regulationsResp?.total ?? 0;
  const verifiedCount =
    regulationsResp?.data?.filter((r) => r.verified).length ?? 0;

  return (
    <PageLayout>
      <PageHeader
        title="Regulations"
        subtitle="Curated regulatory instruments affecting battery supply chains. Each card shows the materials and geographies in scope."
      />

      {/* Filter pills */}
      <div className="mb-3 mt-4 flex flex-wrap gap-2">
        <FilterGroup
          label="Status"
          options={[
            ["all", "All status"],
            ["effective", "Effective"],
            ["enacted", "Enacted"],
            ["proposed", "Proposed"],
          ]}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
        />
        <FilterGroup
          label="Jurisdiction"
          options={[
            ["all", "All jurisdictions"],
            ["US", "US"],
            ["EU", "EU"],
          ]}
          value={jurisdictionFilter}
          onChange={(v) => setJurisdictionFilter(v as JurisdictionFilter)}
        />
        <Button
          variant={verifiedOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setVerifiedOnly((v) => !v)}
        >
          {verifiedOnly ? "Verified only" : "All verification"}
        </Button>
      </div>

      {/* Counts strip */}
      <div className="mb-4 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <strong className="font-medium text-foreground">
            {filtered.length}
          </strong>{" "}
          of {total} regulations
        </span>
        <span>
          Verified{" "}
          <strong className="font-medium text-foreground">
            {verifiedCount}
          </strong>
        </span>
      </div>

      {/* Card list */}
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No regulations match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <RegulationCard
              key={r.id}
              regulation={r}
              materialNameById={materialNameById}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

// ---------------------------------------------------------------------------
// Small inline filter-pill group component
// ---------------------------------------------------------------------------

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<readonly [T, string]>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-md border border-border/60"
    >
      {options.map(([opt, optLabel]) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 text-xs transition-colors",
            "border-r border-border/60 last:border-r-0",
            value === opt
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted",
          )}
        >
          {optLabel}
        </button>
      ))}
    </div>
  );
}
