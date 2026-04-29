"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, CheckCircle2, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PlatformCard, PlatformCardHeader, PlatformCardBody } from "@/components/platform/platform-card";
import { ScoreChip } from "@/components/platform/score-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { CountrySharePill } from "@/components/shared/country-share-pill";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { PlatformTable } from "@/components/platform/platform-table";
import { MismatchBadgeList } from "@/components/materials/mismatch-badge";
import {
  useMaterial,
  useMaterialGlobalScore,
  useMaterialMarketScores,
  materialQueryKeys,
} from "@/lib/hooks/use-materials";
import { useToggleMaterialVerified } from "@/lib/hooks/use-verified";
import { useEntityNotes } from "@/lib/hooks/use-entity-notes";
import {
  sortMarketRiskScoreRows,
  buildMarketRiskScoreColumns,
} from "@/lib/table/market-risk-score-columns";
import type {
  HsCodeMaterialMappingRead,
  MappingHealth,
  MaterialGeographyScoreRead,
  MaterialGlobalScoreRead,
} from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, humanize, NOTE_TYPE_BADGE, NOTE_TYPE_LABEL } from "@/lib/utils/format";

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
          {globalScore?.overall_risk_score != null && (
            <div className="shrink-0 text-right">
              <div className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                Overall Risk
              </div>
              <ScoreChip score={globalScore.overall_risk_score} showBandLabel />
            </div>
          )}
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
            {(material.country_production_shares.length > 0 ||
              (material.primary_producing_countries ?? []).length > 0) && (
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Primary producing countries
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {material.country_production_shares.length > 0
                    ? material.country_production_shares.map((c) => (
                        <CountrySharePill key={c.code} code={c.code} sharePct={c.share_pct} />
                      ))
                    : (material.primary_producing_countries ?? []).map((cc) => (
                        <CountrySharePill key={cc} code={cc} />
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
        header: "HS prefix",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">{row.original.hs_code_prefix}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Customs description",
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
        header: "Mapped to",
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

      <PlatformTable
        data={mappings}
        columns={columns}
        tableTitle="HS code mappings"
        tableSubtitle={
          mappings.length === 0 ? (
            "No HS codes mapped yet."
          ) : (
            <>
              <span>
                {mappings.length} mapping{mappings.length === 1 ? "" : "s"}
              </span>
              <span aria-hidden className="mx-2 text-muted-foreground/60">
                ·
              </span>
              <span>{suspectCount} flagged as suspect</span>
            </>
          )
        }
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

function ScoresTab({ scores }: ScoresTabProps) {
  const columns = useMemo(
    () =>
      buildMarketRiskScoreColumns({
        showMaterialColumn: false,
        overallBandLabels: false,
      }),
    [],
  );
  const sortedData = useMemo(() => sortMarketRiskScoreRows(scores), [scores]);

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
        <PlatformTable embedded data={sortedData} columns={columns} />
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ---------------------------------------------------------------------------
// Notes tab
// ---------------------------------------------------------------------------

function NotesTab({ materialId }: { materialId: string }) {
  const { data = [], isLoading, error, refetch } = useEntityNotes(
    "material",
    materialId,
  );

  if (isLoading) {
    return (
      <PlatformCard>
        <PlatformCardBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: "var(--p-radius)", background: "var(--p-bg-muted)" }} />
            ))}
          </div>
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  if (error) {
    return (
      <PlatformCard>
        <PlatformCardBody>
          <ErrorState error={error} onRetry={() => refetch()} />
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Analyst notes"
        subtitle='Recorded via "Flag Issue". Use the button in the page header to add a new note.'
      />
      <PlatformCardBody noPadding>
        {data.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--p-text-muted)",
            }}
          >
            No notes yet for this material.
          </div>
        ) : (
          data.map((note, i) => {
            const badgeClass = NOTE_TYPE_BADGE[note.note_type] ?? "p-badge-soft";
            const noteLabel = NOTE_TYPE_LABEL[note.note_type] ?? humanize(note.note_type);
            return (
              <div
                key={note.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < data.length - 1 ? "1px solid var(--p-rule)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className={`p-badge ${badgeClass}`} style={{ flexShrink: 0 }}>
                    {noteLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--p-text-faint)",
                      marginLeft: "auto",
                      flexShrink: 0,
                    }}
                    title={formatDateTime(note.created_at)}
                  >
                    {formatRelative(note.created_at)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--p-text-muted)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {note.note_text}
                </p>
              </div>
            );
          })
        )}
      </PlatformCardBody>
    </PlatformCard>
  );
}
