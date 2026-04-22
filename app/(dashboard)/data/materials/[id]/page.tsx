"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { DataTable } from "@/components/data-table/data-table";
import { MismatchBadgeList } from "@/components/materials/mismatch-badge";
import { useMaterial } from "@/lib/hooks/use-materials";
import type { HsCodeMaterialMappingRead, MappingHealth } from "@/lib/types";
import { formatDate, humanize } from "@/lib/utils/format";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "mappings", label: "HS Mappings" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: material, isLoading, error, refetch } = useMaterial(id);
  const [tab, setTab] = useState<TabValue>("overview");

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="mx-auto max-w-7xl">
        <ErrorState
          error={error ?? new Error("Material not found")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/data/materials">
            <ArrowLeft className="h-3.5 w-3.5" />
            All Materials
          </Link>
        </Button>
        <EntityFlagIssueDialog
          entityType="material"
          entityId={String(material.id)}
          entityLabel={material.canonical_name}
        />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {material.canonical_name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{humanize(material.category)}</span>
              {material.is_ira_critical_mineral && (
                <Badge
                  variant="outline"
                  className="border-0 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                >
                  IRA critical
                </Badge>
              )}
              {material.is_eu_crma_critical && (
                <Badge
                  variant="outline"
                  className="border-0 bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"
                >
                  EU CRMA
                </Badge>
              )}
              {material.data_availability && (
                <span>· data: {material.data_availability}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Criticality
            </div>
            <ConfidenceBadge value={material.criticality_score} />
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
              {t.value === "mappings" &&
                material.hs_code_mappings.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                    {material.hs_code_mappings.length}
                  </span>
                )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            material={material}
            onJumpToMappings={() => setTab("mappings")}
          />
        </TabsContent>

        <TabsContent value="mappings" className="mt-4">
          <MappingsTab
            materialId={String(material.id)}
            materialName={material.canonical_name}
            mappings={material.hs_code_mappings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewTabProps {
  material: import("@/lib/types").MaterialDetail;
  onJumpToMappings: () => void;
}

function OverviewTab({ material, onJumpToMappings }: OverviewTabProps) {
  const health = material.mapping_health;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Criticality signals</CardTitle>
        </CardHeader>
        <CardContent>
          {material.criticality_signals.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No criticality signals on file.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {material.criticality_signals.map((s, i) => (
                <li
                  key={`${material.id}-criticality-${i}-${String(s.signal_key ?? "")}`}
                  className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">{s.label}</div>
                    {s.source && (
                      <div className="text-xs text-muted-foreground">
                        {s.source}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-sm">
                    {s.value == null ? "—" : String(s.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chemistry uses</CardTitle>
        </CardHeader>
        <CardContent>
          {material.chemistry_uses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not used by any catalogued chemistry.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {material.chemistry_uses.map((u, i) => (
                <li
                  key={`${material.id}-chemistry-${i}-${u.battery_chemistry_id}`}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono">{u.chemistry_slug}</span>
                  <span className="text-xs text-muted-foreground">
                    {u.share_pct == null
                      ? "—"
                      : `${(u.share_pct * 100).toFixed(0)}%`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <MappingHealthCard health={health} onClick={onJumpToMappings} />
    </div>
  );
}

interface MappingHealthCardProps {
  health: MappingHealth;
  onClick: () => void;
}

function MappingHealthCard({ health, onClick }: MappingHealthCardProps) {
  const allClear =
    health.mismatched === 0 &&
    health.low_confidence === 0 &&
    health.missing_description === 0;
  return (
    <Card className="md:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">HS-mapping health</CardTitle>
        <Button variant="outline" size="sm" onClick={onClick}>
          Open mappings
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total mappings" value={health.total} />
        <Stat
          label="Suspect (any reason)"
          value={health.mismatched}
          tone={health.mismatched > 0 ? "amber" : "ok"}
        />
        <Stat
          label="Low confidence"
          value={health.low_confidence}
          tone={health.low_confidence > 0 ? "amber" : "ok"}
        />
        <Stat
          label="Missing description"
          value={health.missing_description}
          tone={health.missing_description > 0 ? "amber" : "ok"}
        />
        {allClear && (
          <div className="col-span-full flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            All HS mappings look healthy.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatProps {
  label: string;
  value: number;
  tone?: "ok" | "amber";
}

function Stat({ label, value, tone = "ok" }: StatProps) {
  const valueColor =
    tone === "amber"
      ? "text-amber-700 dark:text-amber-300"
      : "text-foreground";
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`text-xl font-semibold tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

interface MappingsTabProps {
  materialId: string;
  materialName: string;
  mappings: HsCodeMaterialMappingRead[];
}

function MappingsTab({
  materialId,
  materialName,
  mappings,
}: MappingsTabProps) {
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
        header: "HS description (per customs schedule)",
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
        id: "comparison",
        header: `Mapped to "${materialName}"`,
        cell: () => <span className="text-sm">{materialName}</span>,
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
        header: "Status",
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
              parentId={materialId}
              entityLabel={`HS ${row.original.hs_code_prefix}`}
              sectionLabel="HS Mappings"
            />
          </div>
        ),
      },
    ],
    [materialId, materialName],
  );

  const suspectCount = mappings.filter(
    (m) => (m.mismatch_reasons?.length ?? 0) > 0,
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {mappings.length === 0
            ? "No HS codes have been mapped to this material yet."
            : `${mappings.length} HS code${
                mappings.length === 1 ? "" : "s"
              } map to this material.`}
        </div>
        {suspectCount > 0 && (
          <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-3 w-3" />
            {suspectCount} flagged as suspect
          </div>
        )}
      </div>

      <DataTable
        data={mappings}
        columns={columns}
        emptyTitle="No HS mappings"
        emptyDescription="Add a mapping in the backend, or flag this material so an analyst can investigate."
      />
    </div>
  );
}
