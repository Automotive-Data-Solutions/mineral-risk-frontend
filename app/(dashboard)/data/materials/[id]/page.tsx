"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeft, CheckCircle2, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { CountryFlag } from "@/components/shared/country-flag";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { DataTable } from "@/components/data-table/data-table";
import { MismatchBadgeList } from "@/components/materials/mismatch-badge";
import {
  useMaterial,
  useMaterialGlobalScore,
  useMaterialMarketScores,
  materialQueryKeys,
} from "@/lib/hooks/use-materials";
import { useToggleMaterialVerified } from "@/lib/hooks/use-verified";
import { useEntityNotes } from "@/lib/hooks/use-entity-notes";
import type {
  AnalystNoteRead,
  HsCodeMaterialMappingRead,
  MappingHealth,
  MaterialGeographyScoreRead,
  MaterialGlobalScoreRead,
} from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, humanize } from "@/lib/utils/format";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "mappings", label: "HS Mappings" },
  { value: "scores", label: "Market Scores" },
  { value: "notes", label: "Notes" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: material, isLoading, error, refetch } = useMaterial(id);
  const { data: globalScore = null } = useMaterialGlobalScore(id);
  const { data: marketScores = [] } = useMaterialMarketScores(id);
  const [tab, setTab] = useState<TabValue>("overview");

  const verifyMutation = useToggleMaterialVerified({
    invalidateKeys: [[...materialQueryKeys.detail(id)]],
  });

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
        <div className="flex items-center gap-2">
          <VerifyToggleButton
            verified={material.verified}
            disabled={verifyMutation.isPending}
            unmarkLabel="Verified"
            highlightWhenVerified
            onToggle={() =>
              verifyMutation.mutate({
                materialId: material.id,
                verified: !material.verified,
              })
            }
          />
          <EntityFlagIssueDialog
            entityType="material"
            entityId={String(material.id)}
            entityLabel={material.canonical_name}
          />
        </div>
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
              {t.value === "scores" && marketScores.length > 0 && (
                <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                  {marketScores.length}
                </span>
              )}
              {/* Note count badge is rendered inside NotesTab after fetch */}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            material={material}
            globalScore={globalScore}
            onJumpToMappings={() => setTab("mappings")}
          />
        </TabsContent>

        <TabsContent value="mappings" className="mt-4">
          <MappingsTab
            materialId={String(material.id)}
            materialName={material.canonical_name}
            mappings={material.hs_code_mappings}
            registeredHsCodes={material.hs_codes ?? []}
          />
        </TabsContent>

        <TabsContent value="scores" className="mt-4">
          <ScoresTab scores={marketScores} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesTab materialId={String(material.id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewTabProps {
  material: import("@/lib/types").MaterialDetail;
  globalScore: MaterialGlobalScoreRead | null;
  onJumpToMappings: () => void;
}

const TREND_CONFIG: Record<string, { label: string; color: string }> = {
  rising: { label: "Rising", color: "text-red-600 dark:text-red-400" },
  stable: { label: "Stable", color: "text-amber-600 dark:text-amber-400" },
  declining: { label: "Declining", color: "text-emerald-600 dark:text-emerald-400" },
};

const ROLE_LABELS: Record<string, string> = {
  cathode_active: "Cathode active material",
  anode: "Anode material",
  electrolyte: "Electrolyte component",
  current_collector: "Current collector",
  other: "Other",
};

function OverviewTab({ material, globalScore, onJumpToMappings }: OverviewTabProps) {
  const health = material.mapping_health;
  const trend = material.patent_occurrence_trend
    ? TREND_CONFIG[material.patent_occurrence_trend]
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* ── Material profile ── */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Material profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {material.symbol_or_code && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Symbol / code
                </div>
                <span className="font-mono text-lg font-semibold">
                  {material.symbol_or_code}
                </span>
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Category
              </div>
              <span className="text-sm">{humanize(material.category) || "—"}</span>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Data availability
              </div>
              <span className="text-sm">{humanize(material.data_availability) || "—"}</span>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Price basis
              </div>
              <span className="text-sm font-mono">
                {material.price_unit === "per_mt"
                  ? "per metric ton"
                  : material.price_unit === "per_kg"
                  ? "per kilogram"
                  : "—"}
              </span>
            </div>

            {trend && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Patent trend
                </div>
                <span className={`text-sm font-medium ${trend.color}`}>
                  {trend.label}
                </span>
              </div>
            )}

            {(material.primary_producing_countries ?? []).length > 0 && (
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Primary producing countries
                </div>
                <div className="flex flex-wrap gap-2">
                  {(material.primary_producing_countries ?? []).map((cc) => (
                    <CountryFlag key={cc} code={cc} />
                  ))}
                </div>
              </div>
            )}

            {material.notes && (
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Analyst notes
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {material.notes}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Found in batteries ── */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Found in batteries</CardTitle>
        </CardHeader>
        <CardContent>
          {material.chemistry_uses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not used by any catalogued battery chemistry.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {material.chemistry_uses.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col gap-1.5 rounded-md border bg-background px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {u.chemistry_name ?? u.chemistry_slug ?? `Chemistry #${u.battery_chemistry_id}`}
                    </span>
                    <ConfidenceBadge value={u.intensity} className="shrink-0" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ROLE_LABELS[u.role] ?? humanize(u.role)}
                  </div>
                  {u.is_substitutable && (
                    <div className="text-xs text-muted-foreground italic">
                      Substitutable
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Global risk score ── */}
      {globalScore && (
        <GlobalScoreCard score={globalScore} className="md:col-span-3" />
      )}

      {/* ── HS-mapping health ── */}
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

interface GlobalScoreCardProps {
  score: MaterialGlobalScoreRead;
  className?: string;
}

const GLOBAL_PILLARS: { key: keyof MaterialGlobalScoreRead; label: string }[] =
  [
    { key: "material_concentration_score", label: "Mat. concentration" },
    { key: "geopolitical_trade_score", label: "Geopolitical" },
    { key: "regulatory_compliance_score", label: "Regulatory" },
    { key: "operational_score", label: "Operational" },
    { key: "financial_pressure_score", label: "Financial pressure" },
  ];

function GlobalScoreCard({ score, className }: GlobalScoreCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Global risk score</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {score.trade_weighted_geo_count} geograph
            {score.trade_weighted_geo_count === 1 ? "y" : "ies"} weighted
          </span>
          <span>·</span>
          <span>as of {formatDate(score.as_of_date)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="sm:col-span-1 flex flex-col items-start justify-center rounded-md border bg-muted/40 px-3 py-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Overall
            </div>
            <ConfidenceBadge
              value={score.overall_risk_score}
              className="text-base px-2 py-1"
            />
          </div>
          {GLOBAL_PILLARS.map((p) => (
            <div
              key={p.key}
              className="flex flex-col items-start justify-center rounded-md border bg-background px-3 py-3"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                {p.label}
              </div>
              <ConfidenceBadge
                value={score[p.key] as number | null}
              />
            </div>
          ))}
        </div>
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
  registeredHsCodes: string[];
}

function MappingsTab({
  materialId,
  materialName,
  mappings,
  registeredHsCodes,
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

  // HS comparison: check which registered codes are covered by at least one
  // mapping prefix and which mappings don't correspond to any registered code.
  // Match rule: a mapping prefix covers a registered code when either is a
  // leading substring of the other (e.g. prefix "2825" covers "2825.20", and
  // prefix "2825.20.10" also covers registered "2825.20").
  const mappingPrefixes = mappings.map((m) => m.hs_code_prefix);

  function prefixesOverlap(a: string, b: string): boolean {
    const an = a.replace(/\./g, "");
    const bn = b.replace(/\./g, "");
    return an.startsWith(bn) || bn.startsWith(an);
  }

  const registeredWithStatus = registeredHsCodes.map((code) => {
    const matchedMapping = mappingPrefixes.find((p) => prefixesOverlap(code, p));
    return { code, matched: Boolean(matchedMapping) };
  });

  const unmatchedMappings = mappings.filter(
    (m) => !registeredHsCodes.some((c) => prefixesOverlap(c, m.hs_code_prefix)),
  );

  const hasComparison = registeredHsCodes.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {hasComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HS code coverage check</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Compares the HS codes recorded on the material record against the
              mapping prefixes. A registered code is "covered" when at least one
              mapping prefix overlaps it.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Registered on material ({registeredHsCodes.length})
                </div>
                {registeredWithStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None on file.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {registeredWithStatus.map(({ code, matched }) => (
                      <li key={code} className="flex items-center gap-2 text-sm font-mono">
                        {matched ? (
                          <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" />
                        )}
                        <span>{code}</span>
                        {!matched && (
                          <span className="text-xs not-italic text-red-600 dark:text-red-400 font-sans">
                            no mapping
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mappings with no registered match ({unmatchedMappings.length})
                </div>
                {unmatchedMappings.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All mappings align to a registered code.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {unmatchedMappings.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm font-mono">
                        <MinusCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>{m.hs_code_prefix}</span>
                        <span className="text-xs not-italic text-amber-600 dark:text-amber-400 font-sans">
                          extra mapping
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

// ---------------------------------------------------------------------------
// Scores tab
// ---------------------------------------------------------------------------

interface ScoresTabProps {
  scores: MaterialGeographyScoreRead[];
}

const PILLAR_COLS: {
  key: keyof MaterialGeographyScoreRead;
  label: string;
  short: string;
}[] = [
  {
    key: "material_concentration_score",
    label: "Material concentration",
    short: "Mat. conc.",
  },
  {
    key: "geopolitical_trade_score",
    label: "Geopolitical / trade",
    short: "Geopolitical",
  },
  {
    key: "regulatory_compliance_score",
    label: "Regulatory compliance",
    short: "Regulatory",
  },
  { key: "operational_score", label: "Operational", short: "Operational" },
  {
    key: "financial_pressure_score",
    label: "Financial pressure",
    short: "Financial",
  },
];

function ScoresTab({ scores }: ScoresTabProps) {
  const sorted = useMemo(
    () =>
      [...scores].sort(
        (a, b) => (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1),
      ),
    [scores],
  );

  const columns = useMemo<ColumnDef<MaterialGeographyScoreRead, unknown>[]>(
    () => [
      {
        accessorKey: "geography_code",
        header: "Country",
        cell: ({ row }) => (
          <CountryFlag code={row.original.geography_code} />
        ),
      },
      {
        accessorKey: "overall_risk_score",
        header: () => <div className="text-right">Overall</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.overall_risk_score} />
          </div>
        ),
      },
      ...PILLAR_COLS.map((col) => ({
        accessorKey: col.key,
        header: () => <div className="text-right">{col.short}</div>,
        cell: ({ row }: { row: { original: MaterialGeographyScoreRead } }) => (
          <div className="flex justify-end">
            <ConfidenceBadge
              value={row.original[col.key] as number | null}
            />
          </div>
        ),
      })),
      {
        accessorKey: "event_count",
        header: () => <div className="text-right">Events</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-sm text-muted-foreground">
            {row.original.event_count}
          </div>
        ),
      },
      {
        accessorKey: "as_of_date",
        header: () => <div className="text-right">As of</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs text-muted-foreground">
            {formatDate(row.original.as_of_date)}
          </div>
        ),
      },
    ],
    [],
  );

  if (scores.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No market scores have been computed for this material yet. Run the
          scoring job to populate country-level risk data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Country-level risk scores broken down by pillar. Higher scores indicate
        greater risk. Sorted by overall risk descending.
      </p>
      <DataTable
        data={sorted}
        columns={columns}
        emptyTitle="No scores"
        emptyDescription="Run the scoring job to generate country-level scores."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes tab
// ---------------------------------------------------------------------------

const NOTE_TYPE_TONE: Record<string, string> = {
  data_error: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  missing_data: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  outdated: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  other: "bg-muted text-muted-foreground",
};

function NotesTab({ materialId }: { materialId: string }) {
  const { data = [], isLoading, error, refetch } = useEntityNotes(
    "material",
    materialId,
  );

  const columns = useMemo<ColumnDef<AnalystNoteRead, unknown>[]>(
    () => [
      {
        accessorKey: "note_type",
        header: "Type",
        size: 140,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`border-0 ${NOTE_TYPE_TONE[row.original.note_type] ?? NOTE_TYPE_TONE.other}`}
          >
            {humanize(row.original.note_type)}
          </Badge>
        ),
      },
      {
        accessorKey: "note_text",
        header: "Note",
        cell: ({ row }) => (
          <span className="whitespace-pre-wrap text-sm">{row.original.note_text}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: () => <div className="text-right">Created</div>,
        size: 140,
        cell: ({ row }) => (
          <div
            className="text-right text-xs text-muted-foreground"
            title={formatDateTime(row.original.created_at)}
          >
            {formatRelative(row.original.created_at)}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Analyst notes recorded via Flag Issue. Use the button in the page header
        to add a new note.
      </p>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        emptyTitle="No notes yet"
        emptyDescription='Click "Flag Issue" in the page header to record a data-quality note.'
      />
    </div>
  );
}
