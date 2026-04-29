"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowLeft, CheckCircle2, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PlatformCard, PlatformCardHeader, PlatformCardBody } from "@/components/platform/platform-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
      <PageLayout>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  if (error || !material) {
    return (
      <PageLayout>
        <ErrorState
          error={error ?? new Error("Material not found")}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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

      {/* Tab bar — platform CSS underline style */}
      <div className="p-tabs">
        {TABS.map((t) => {
          const count =
            t.value === "mappings"
              ? material.hs_code_mappings.length
              : t.value === "scores"
              ? marketScores.length
              : null;
          return (
            <button
              key={t.value}
              className={`p-tab${tab === t.value ? " active" : ""}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className="p-tab-count">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {tab === "overview" && (
          <OverviewTab
            material={material}
            globalScore={globalScore}
            onJumpToMappings={() => setTab("mappings")}
          />
        )}
        {tab === "mappings" && (
          <MappingsTab
            materialId={String(material.id)}
            materialName={material.canonical_name}
            mappings={material.hs_code_mappings}
            registeredHsCodes={material.hs_codes ?? []}
          />
        )}
        {tab === "scores" && <ScoresTab scores={marketScores} />}
        {tab === "notes" && <NotesTab materialId={String(material.id)} />}
      </div>
    </PageLayout>
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

function OverviewTab({ material, globalScore, onJumpToMappings }: OverviewTabProps) {
  const health = material.mapping_health;
  const trend = material.patent_occurrence_trend
    ? TREND_CONFIG[material.patent_occurrence_trend]
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* ── Global risk score — first so it's immediately visible ── */}
      {globalScore && (
        <GlobalScoreCard score={globalScore} className="md:col-span-3" />
      )}

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
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {material.chemistry_uses.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium leading-tight">
                        {u.chemistry_name ? u.chemistry_name.split(" ")[0] : u.chemistry_slug?.toUpperCase() ?? `#${u.battery_chemistry_id}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {humanize(u.role)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span
                        style={{
                          fontFamily: "var(--p-font-mono)",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--p-text)",
                        }}
                      >
                        {u.intensity.toFixed(2)}
                      </span>
                      {u.is_substitutable && (
                        <span style={{ fontSize: 10, color: "var(--p-text-faint)" }}>
                          substitutable
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Intensity is the relative material weight fraction within each chemistry formulation (0–1 scale; values above 1 indicate a data entry issue in the source).
              </p>
            </>
          )}
        </CardContent>
      </Card>

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

const GLOBAL_PILLARS: {
  key: keyof MaterialGlobalScoreRead;
  label: string;
  pillarClass: string;
  colorVar: string;
}[] = [
  {
    key: "material_concentration_score",
    label: "Mat. Concentration",
    pillarClass: "p-pillar-material",
    colorVar: "var(--p-pillar-material)",
  },
  {
    key: "geopolitical_trade_score",
    label: "Geopolitical",
    pillarClass: "p-pillar-geo",
    colorVar: "var(--p-pillar-geo)",
  },
  {
    key: "regulatory_compliance_score",
    label: "Regulatory",
    pillarClass: "p-pillar-regulatory",
    colorVar: "var(--p-pillar-regulatory)",
  },
  {
    key: "operational_score",
    label: "Operational",
    pillarClass: "p-pillar-operational",
    colorVar: "var(--p-pillar-operational)",
  },
  {
    key: "financial_pressure_score",
    label: "Financial Pressure",
    pillarClass: "p-pillar-financial",
    colorVar: "var(--p-pillar-financial)",
  },
];

function GlobalScoreCard({ score, className }: GlobalScoreCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Global risk score</CardTitle>
        <div className="text-xs text-muted-foreground">
          {score.trade_weighted_geo_count} geograph
          {score.trade_weighted_geo_count === 1 ? "y" : "ies"} weighted · as of{" "}
          {formatDate(score.as_of_date)}
        </div>
      </CardHeader>
      <CardContent>
        {/* Uses platform CSS: p-score-grid, p-score-cell, p-score-cell-label,
            p-score-cell-value, p-pillar-strip + p-pillar-* colour classes */}
        <div className="p-score-grid">
          {/* Overall score — highlighted cell */}
          <div className="p-score-cell overall">
            <div className="p-score-cell-label">Overall</div>
            <div className="p-score-cell-value">
              {score.overall_risk_score != null
                ? score.overall_risk_score.toFixed(1)
                : "—"}
            </div>
            {/* Neutral bar for overall */}
            <div
              className="p-pillar-strip"
              style={{ background: "var(--p-accent)", opacity: 0.6 }}
            />
          </div>

          {/* One cell per pillar */}
          {GLOBAL_PILLARS.map((p) => {
            const raw = score[p.key] as number | null | undefined;
            return (
              <div key={p.key} className="p-score-cell">
                <div className="p-score-cell-label">{p.label}</div>
                <div className="p-score-cell-value">
                  {raw != null ? Math.round(raw) : "—"}
                </div>
                <div className={`p-pillar-strip ${p.pillarClass}`} />
              </div>
            );
          })}
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
              mapping prefixes. A registered code is &quot;covered&quot; when at least one
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

const SCORE_PILLAR_COLS: {
  key: keyof MaterialGeographyScoreRead;
  header: string;
}[] = [
  { key: "material_concentration_score", header: "Mat. Conc." },
  { key: "geopolitical_trade_score",      header: "Geopolitical" },
  { key: "regulatory_compliance_score",   header: "Regulatory" },
  { key: "operational_score",             header: "Operational" },
  { key: "financial_pressure_score",      header: "Financial" },
];

/** Shared country pill — same style as the concentration pills in the dashboard */
function CountryPill({ code }: { code: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        background: "var(--p-bg-subtle)",
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-radius-sm)",
        fontSize: 12,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      <CountryFlag code={code} showCode={false} showTooltip={false} />
      <span style={{ fontFamily: "var(--p-font-mono)", fontWeight: 500, color: "var(--p-text)" }}>
        {code.toUpperCase()}
      </span>
    </span>
  );
}

/** Risk tier helper — mirrors the dashboard */
function scoreTier(s: number): "high" | "med" | "low" {
  if (s >= 70) return "high";
  if (s >= 40) return "med";
  return "low";
}

function ScoresTab({ scores }: ScoresTabProps) {
  const sorted = useMemo(
    () =>
      [...scores].sort(
        (a, b) => (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1),
      ),
    [scores],
  );

  const TH_STYLE: React.CSSProperties = {
    padding: "8px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--p-text-muted)",
    whiteSpace: "nowrap",
    borderBottom: "1px solid var(--p-border)",
    background: "var(--p-bg-subtle)",
  };

  const TD_STYLE: React.CSSProperties = {
    padding: "11px 16px",
    borderBottom: "1px solid var(--p-rule)",
    fontSize: 13,
  };

  if (scores.length === 0) {
    return (
      <PlatformCard>
        <PlatformCardHeader
          title="Country-level risk scores"
          subtitle="Sorted by overall risk descending"
        />
        <PlatformCardBody>
          <p style={{ fontSize: 13, color: "var(--p-text-muted)", textAlign: "center", padding: "24px 0" }}>
            No market scores have been computed for this material yet.
          </p>
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Country-level risk scores"
        subtitle="Sorted by overall risk descending"
      />
      <PlatformCardBody noPadding>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={TH_STYLE}>Country</th>
              <th style={TH_STYLE}>Overall</th>
              {SCORE_PILLAR_COLS.map((c) => (
                <th key={c.key} style={{ ...TH_STYLE, textAlign: "right" }}>
                  {c.header}
                </th>
              ))}
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Events</th>
              <th style={{ ...TH_STYLE, textAlign: "right" }}>As of</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const overall = row.overall_risk_score;
              const tier = overall != null ? scoreTier(overall) : null;
              return (
                <tr key={row.id ?? row.geography_code}>
                  <td style={TD_STYLE}>
                    <CountryPill code={row.geography_code} />
                  </td>
                  <td style={TD_STYLE}>
                    {overall != null && tier ? (
                      <span className={`p-score p-score-${tier}`}>
                        <span className={`p-score-dot p-dot-${tier}`} />
                        {overall.toFixed(1)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--p-text-faint)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  {SCORE_PILLAR_COLS.map((c) => {
                    const val = row[c.key] as number | null | undefined;
                    return (
                      <td
                        key={c.key}
                        style={{
                          ...TD_STYLE,
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color: val != null ? "var(--p-text)" : "var(--p-text-faint)",
                        }}
                      >
                        {val != null ? Math.round(val) : "—"}
                      </td>
                    );
                  })}
                  <td style={{ ...TD_STYLE, textAlign: "right", fontFamily: "var(--p-font-mono)", color: "var(--p-text-muted)" }}>
                    {row.event_count ?? 0}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: "right", fontSize: 12, color: "var(--p-text-muted)" }}>
                    {formatDate(row.as_of_date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </PlatformCardBody>
    </PlatformCard>
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
