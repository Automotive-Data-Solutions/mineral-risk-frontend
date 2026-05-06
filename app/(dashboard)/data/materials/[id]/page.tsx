"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { PlatformCard, PlatformCardHeader, PlatformCardBody } from "@/components/platform/platform-card";
import { ScoreChip } from "@/components/platform/score-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CountrySharePill } from "@/components/shared/country-share-pill";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { VerifyToggleButton } from "@/components/shared/verify-toggle-button";
import { PlatformTable } from "@/components/platform/platform-table";
import {
  useMaterial,
  useMaterialGlobalScore,
  useMaterialMarketScores,
  useMaterialMarketScoreDetail,
  materialQueryKeys,
} from "@/lib/hooks/use-materials";
import { useToggleMaterialVerified } from "@/lib/hooks/use-verified";
import { useEntityNotes } from "@/lib/hooks/use-entity-notes";
import {
  sortMarketRiskScoreRows,
  buildMarketRiskScoreColumns,
} from "@/lib/table/market-risk-score-columns";
import {
  HsCodesAndStagesTab,
  type HsMappingNode,
} from "@/components/materials/hs-codes-stages-tab";
import type {
  MaterialGeographyScoreRead,
  MaterialGlobalScoreRead,
} from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, humanize, NOTE_TYPE_BADGE, NOTE_TYPE_LABEL } from "@/lib/utils/format";
import { useBreadcrumbLabel } from "@/components/platform/breadcrumb-context";

const TABS = [
  { value: "overview", label: "Overview" },
  // Combined tab — replaces the old "HS Mappings" tab.  Adds stage
  // grouping, per-geography drill-down, and partner-review state.
  // Keeps all functionality from the old flat mappings table via the
  // "Flat list" view-mode toggle inside the tab.
  { value: "mappings", label: "HS Codes & Stages" },
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

  // Register the material name so the breadcrumb shows "Lithium" instead of "42"
  useBreadcrumbLabel(id, material?.canonical_name);

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
          <OverviewTab material={material} globalScore={globalScore} />
        )}
        {tab === "mappings" && (
          <HsCodesAndStagesTab
            materialId={String(material.id)}
            materialName={material.canonical_name}
            // The wire shape now carries supply_chain_stage, market_scope,
            // digit_count, and keywords directly from the API. Score
            // fields remain optional and render as "—" until the scoring
            // engine writes them.
            mappings={material.hs_code_mappings as HsMappingNode[]}
          />
        )}
        {tab === "scores" && <ScoresTab materialId={String(material.id)} scores={marketScores} />}
        {tab === "notes" && <NotesTab materialId={String(material.id)} />}
      </div>
    </PageLayout>
  );
}

interface OverviewTabProps {
  material: import("@/lib/types").MaterialDetail;
  globalScore: MaterialGlobalScoreRead | null;
}

const TREND_CONFIG: Record<string, { label: string; color: string }> = {
  rising: { label: "Rising", color: "text-red-600 dark:text-red-400" },
  stable: { label: "Stable", color: "text-amber-600 dark:text-amber-400" },
  declining: { label: "Declining", color: "text-emerald-600 dark:text-emerald-400" },
};

function OverviewTab({ material, globalScore }: OverviewTabProps) {
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

      {/* HS-mapping health card removed (May 2026) — the same checks
          live inside the HS Codes & Stages tab via the mismatch_reasons
          column on each row, which is the actionable place to surface
          them.  Overview no longer needs a duplicate summary. */}
    </div>
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

// `Stat` (small KPI helper) was removed in May 2026 along with
// MappingHealthCard.  If a future Overview card needs a stat tile, the
// platform CSS (.p-card-body grid) covers it without a dedicated
// component — see GlobalScoreCard above for the pattern.

// HsCodesAndStagesTab replaces the old MappingsTab — see
// components/materials/hs-codes-stages-tab.tsx.  Old flat-list
// view is preserved via the "Flat list" toggle inside that tab.

// ---------------------------------------------------------------------------
// Scores tab
// ---------------------------------------------------------------------------

interface ScoresTabProps {
  materialId: string;
  scores: MaterialGeographyScoreRead[];
}

function ScoresTab({ materialId, scores }: ScoresTabProps) {
  const [expandedGeo, setExpandedGeo] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      buildMarketRiskScoreColumns({
        showMaterialColumn: false,
        overallBandLabels: false,
      }),
    [],
  );
  const sortedData = useMemo(() => sortMarketRiskScoreRows(scores), [scores]);

  function handleRowClick(row: MaterialGeographyScoreRead) {
    setExpandedGeo((prev) =>
      prev === row.geography_code ? null : row.geography_code,
    );
  }

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
        subtitle="Click a row to see the score breakdown · sorted by overall risk descending"
      />
      <PlatformCardBody noPadding>
        <PlatformTable
          embedded
          data={sortedData}
          columns={columns}
          onRowClick={handleRowClick}
          isRowExpanded={(row) => row.geography_code === expandedGeo}
          renderSubComponent={(row) => (
            <ScoreRationalePanel
              materialId={materialId}
              geoCode={row.geography_code}
            />
          )}
        />
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ---------------------------------------------------------------------------
// Score rationale detail panel (rendered inside expanded table row)
// ---------------------------------------------------------------------------

interface ScoreRationalePanelProps {
  materialId: string;
  geoCode: string;
}

const PILLAR_META: {
  key: string;
  label: string;
  colorClass: string;
  inputs: { key: string; label: string }[];
}[] = [
  {
    key: "material",
    label: "Mat. Concentration",
    colorClass: "text-blue-600 dark:text-blue-400",
    inputs: [
      { key: "criticality", label: "Criticality" },
      { key: "concentration", label: "Concentration" },
      { key: "trade_volatility", label: "Trade volatility" },
      { key: "stage_rollup_method", label: "Rollup method" },
      { key: "stage_rollup_count", label: "Stage nodes" },
    ],
  },
  {
    key: "geopolitical",
    label: "Geopolitical",
    colorClass: "text-red-600 dark:text-red-400",
    inputs: [
      { key: "country_concentration", label: "Country conc." },
      { key: "export_restriction_exposure", label: "Export restrictions" },
      { key: "tariff_exposure", label: "Tariff exposure" },
    ],
  },
  {
    key: "regulatory",
    label: "Regulatory",
    colorClass: "text-violet-600 dark:text-violet-400",
    inputs: [
      { key: "top_event_count", label: "Top events" },
      { key: "scope_obligations", label: "Scope obligations" },
      { key: "policy_proximity_adjustment", label: "Policy proximity adj." },
    ],
  },
  {
    key: "operational",
    label: "Operational",
    colorClass: "text-amber-600 dark:text-amber-400",
    inputs: [
      { key: "structural_dependency", label: "Structural dependency" },
      { key: "structural_dependency_source", label: "Dependency source" },
      { key: "event_impact_count", label: "Impact events" },
    ],
  },
  {
    key: "financial_pressure",
    label: "Financial Pressure",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    inputs: [
      { key: "base_filing_signal", label: "Filing signal" },
      { key: "leverage_warning_bonus", label: "Leverage warning" },
      { key: "liquidity_stress_bonus", label: "Liquidity stress" },
      { key: "evidence_count", label: "Evidence items" },
    ],
  },
];

function formatSubValue(val: unknown): string {
  if (val == null) return "—";
  if (typeof val === "number") return val % 1 === 0 ? String(val) : val.toFixed(3);
  return String(val);
}

function ScoreRationalePanel({ materialId, geoCode }: ScoreRationalePanelProps) {
  const { data, isLoading } = useMaterialMarketScoreDetail(materialId, geoCode);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-5 py-4 text-xs text-muted-foreground">
        <Skeleton className="h-3 w-3 rounded-full" />
        Loading score breakdown…
      </div>
    );
  }

  const rationale = data?.rationale_json;
  const subInputs = rationale?.sub_inputs;

  if (!rationale || !subInputs) {
    return (
      <div className="px-5 py-4 text-xs text-muted-foreground">
        No rationale data available for this score.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0 divide-x divide-border sm:grid-cols-3 lg:grid-cols-5 border-t border-border/50">
      {PILLAR_META.map((pillar) => {
        const inputs = subInputs[pillar.key as keyof typeof subInputs] ?? {};
        return (
          <div key={pillar.key} className="px-4 py-3 space-y-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider ${pillar.colorClass}`}>
              {pillar.label}
            </div>
            <dl className="space-y-1">
              {pillar.inputs.map(({ key, label }) => {
                const val = (inputs as Record<string, unknown>)[key];
                return (
                  <div key={key} className="flex justify-between gap-2 text-[11px]">
                    <dt className="text-muted-foreground truncate">{label}</dt>
                    <dd className="font-mono font-semibold text-foreground shrink-0">
                      {formatSubValue(val)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
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
