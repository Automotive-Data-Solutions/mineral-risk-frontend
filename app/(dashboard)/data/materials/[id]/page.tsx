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
import { HsMappingsCard } from "@/components/materials/hs-mappings-card";
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
  buildMarketRiskScoreColumns,
} from "@/lib/table/market-risk-score-columns";
// HsCodesAndStagesTab import preserved (commented) so re-enabling the tab
// after partner facility data lands is a one-line change.
// import {
//   HsCodesAndStagesTab,
//   type HsMappingNode,
// } from "@/components/materials/hs-codes-stages-tab";
import type {
  MaterialGeographyScoreRead,
  MaterialGlobalScoreRead,
} from "@/lib/types";
import { formatDate, formatDateTime, formatRelative, humanize, NOTE_TYPE_BADGE, NOTE_TYPE_LABEL } from "@/lib/utils/format";
import { useBreadcrumbLabel } from "@/components/platform/breadcrumb-context";

// MVP detail-page layout (2026-05-09): three top-level tabs only.
//
// What was removed:
//   - "HS Codes & Stages" — the data is too thin pre-G4c facility seed
//     to be the front door (HS-node scoring covers the ore stage well
//     but not refined / intermediate / battery_grade for most materials).
//     Component file kept intact in components/materials/ so re-enabling
//     is a one-line change once partner facility data lands.
//   - "Notes" tab — folded into a collapsible at the bottom of Overview
//     so analyst notes stay accessible without taking a tab slot.
//
// What replaced them:
//   - "Risk events" — placeholder card pointing at the global risk-events
//     page until the per-material events feed (with material_id filter
//     + free-text search) ships.
const TABS = [
  { value: "overview", label: "Overview" },
  { value: "scores", label: "Country scores" },
  { value: "events", label: "Risk events" },
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
            t.value === "scores" ? marketScores.length : null;
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
            materialId={String(material.id)}
            material={material}
            globalScore={globalScore}
          />
        )}
        {tab === "scores" && <ScoresTab materialId={String(material.id)} scores={marketScores} />}
        {tab === "events" && (
          <EventsPlaceholderTab materialName={material.canonical_name} />
        )}
      </div>
    </PageLayout>
  );
}

interface OverviewTabProps {
  materialId: string;
  material: import("@/lib/types").MaterialDetail;
  globalScore: MaterialGlobalScoreRead | null;
}

// Risk-score trend (latest MaterialGlobalRiskScore.overall vs the most
// recent snapshot at least 7 days older).  Rising = composite score
// went UP → risk increased → red.  Declining = composite score went
// DOWN → risk improved → green.  Stable = moved by ≤5 points →
// neutral gray (not amber — "stable" doesn't warrant a warning color
// when the underlying signal is the actual score, not event count).
const TREND_CONFIG: Record<string, { label: string; arrow: string; color: string }> = {
  rising: {
    label: "Rising",
    arrow: "↗",
    color: "text-red-600 dark:text-red-400",
  },
  stable: {
    label: "Stable",
    arrow: "→",
    color: "text-muted-foreground",
  },
  declining: {
    label: "Declining",
    arrow: "↘",
    color: "text-emerald-600 dark:text-emerald-400",
  },
};

function OverviewTab({ materialId, material, globalScore }: OverviewTabProps) {
  // 2026-05-11: trend now sourced from score_trend_7d (computed by the
  // /materials/{id} route from the MaterialGlobalRiskScore time series).
  // Previously experimented with event-count trend, but the user
  // correctly flagged that more events doesn't mean more risk (e.g.,
  // IEA INVESTMENT_PLEDGE events are constructive signals).  Score-
  // trend answers the actual analyst question semantically.
  const trend = material.score_trend_7d
    ? TREND_CONFIG[material.score_trend_7d]
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
            {/* "Data availability" and "Price basis" tiles retired
                2026-05-11 — both were internal scoring metadata that
                aren't analyst-actionable as standalone fields and were
                "—" for most materials anyway (the seed never sets them
                for the bulk of the launch list).  Backend response
                still carries both for backwards-compat. */}

            <div>
              <div
                className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1"
                title={
                  "Composite risk-score movement.  Compares the latest " +
                  "global score to the most recent snapshot at least 7 " +
                  "days older (max 30-day lookback).  ±5-point threshold " +
                  "on the 0-100 scale.  Rising = risk increased; " +
                  "declining = risk improved."
                }
              >
                Risk trend (7d)
              </div>
              {trend ? (
                <span className={`text-sm font-medium ${trend.color}`}>
                  {trend.arrow} {trend.label}
                </span>
              ) : (
                <span
                  className="text-sm text-muted-foreground"
                  title="No prior score snapshot at least 7 days older available (insufficient scoring history).  Will populate once scoring has been running for ≥1 week."
                >
                  —
                </span>
              )}
            </div>

            {/* 2026-05-11 analyst-view stats — recent event volume and
                facility coverage.  Both anchor whether the score behind
                this material is built on credible data. */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Risk events (90d)
              </div>
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{
                  color:
                    (material.recent_event_count_90d ?? 0) >= 5
                      ? "var(--p-text)"
                      : "var(--p-text-muted)",
                }}
                title="Events in the last 90 days mapped to this material via RiskEventMaterial.  Matches the dashboard Coverage Gaps threshold."
              >
                {material.recent_event_count_90d ?? 0}
              </span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Facilities tracked
              </div>
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{
                  color:
                    (material.facility_count ?? 0) > 0
                      ? "var(--p-text)"
                      : "var(--p-risk-crit)",
                }}
                title="FacilityMaterialLink rows for this material.  Drives the operational pillar's structural input.  0 = launch-blocker for that pillar."
              >
                {material.facility_count ?? 0}
              </span>
            </div>
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

      {/* ── HS code mappings — the partner's accuracy-review surface.
          Lives between Material profile and Found in batteries because
          the HS codes drive trade-event attribution (which feeds the
          score above), so the analyst flow reads: score → material
          identity → HS codes feeding the score → battery chemistry use. */}
      <HsMappingsCard mappings={material.hs_code_mappings ?? []} />

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

      {/* Analyst notes — folded into Overview as a collapsible section
          (May 2026 strip-down).  Used to live in its own tab.  Most
          materials have zero notes today; collapsing it by default keeps
          Overview clean while still reachable in one click. */}
      <div className="md:col-span-3">
        <NotesSection materialId={materialId} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk events placeholder — replaces the deferred events feed
// ---------------------------------------------------------------------------

function EventsPlaceholderTab({ materialName }: { materialName: string }) {
  return (
    <PlatformCard>
      <PlatformCardHeader
        title={`Risk events for ${materialName}`}
        subtitle="Per-material events feed with filters and free-text search is in flight."
      />
      <PlatformCardBody>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            The platform tracks tariff changes, export restrictions,
            sanctions, regulatory developments, mine status changes, and
            company filings — every event flowing in is tagged to the
            materials it affects so we can score them.
          </p>
          <p>
            Until the per-material events panel ships, the global feed
            (with all minerals + filters) is at{" "}
            <Link
              href="/data/risk-events"
              className="text-primary underline-offset-2 hover:underline"
            >
              /data/risk-events
            </Link>
            . Filter by category and source there.
          </p>
        </div>
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ---------------------------------------------------------------------------
// Notes section — collapsible in Overview (replaces the old top-level tab)
// ---------------------------------------------------------------------------

function NotesSection({ materialId }: { materialId: string }) {
  const [open, setOpen] = useState(false);
  const { data = [], isLoading } = useEntityNotes("material", materialId);

  // Hide entirely if we're not loading and there are no notes — no point
  // showing a "0 notes" affordance for the steady state.
  if (!isLoading && data.length === 0) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer pb-2"
        onClick={() => setOpen((v) => !v)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span>Analyst notes ({data.length})</span>
          <span className="text-xs font-normal text-muted-foreground">
            {open ? "Hide" : "Show"}
          </span>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {data.map((note) => {
            const badgeClass = NOTE_TYPE_BADGE[note.note_type] ?? "p-badge-soft";
            const noteLabel = NOTE_TYPE_LABEL[note.note_type] ?? humanize(note.note_type);
            return (
              <div key={note.id} className="border-b border-border/60 pb-3 last:border-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={`p-badge ${badgeClass}`}>{noteLabel}</span>
                  <span
                    className="ml-auto text-[11px] text-muted-foreground"
                    title={formatDateTime(note.created_at)}
                  >
                    {formatRelative(note.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {note.note_text}
                </p>
              </div>
            );
          })}
        </CardContent>
      )}
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

// Country-scores display strategy (2026-05-12 revision — Option 4):
// Replaced the OR-based hasMaterialExposure filter with a top-N display.
// The filter was permissive (any one of share/events/facilities ≥ threshold
// passed) and tended to retain ~20–25 countries even after the
// event_count_geo_specific fix, because facility_count ≥ 1 caught every
// country with any MRDS row.  Top-N is more honest: rank countries by what
// matters most (production share, then overall risk), show the top slice,
// and provide an explicit "Show all" toggle for the long tail.
//
// Sort rules:
//   1. Countries with production_share_pct > 0 sort first, by share desc.
//      This puts the actual producers at the top regardless of whether
//      they have flashy event counts.
//   2. Countries with no tracked production share sort below, by
//      overall_risk_score desc.  These are processing hubs, consumer
//      countries, and policy-action geographies that affect the material
//      without producing it.
const COUNTRY_SCORES_DEFAULT_LIMIT = 15;

function sortCountryScoresForDisplay(
  rows: MaterialGeographyScoreRead[],
): MaterialGeographyScoreRead[] {
  return [...rows].sort((a, b) => {
    const aShare = a.production_share_pct ?? 0;
    const bShare = b.production_share_pct ?? 0;
    // Producers always above non-producers.
    if (aShare > 0 && bShare === 0) return -1;
    if (aShare === 0 && bShare > 0) return 1;
    // Both producers — sort by share desc.
    if (aShare > 0 && bShare > 0) {
      if (bShare !== aShare) return bShare - aShare;
      // Tie-break on overall risk so two same-share producers order sensibly.
      return (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1);
    }
    // Both non-producers — sort by overall risk desc.
    return (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1);
  });
}

function ScoresTab({ materialId, scores }: ScoresTabProps) {
  const [expandedGeo, setExpandedGeo] = useState<string | null>(null);
  const [showAllCountries, setShowAllCountries] = useState(false);

  const columns = useMemo(
    () =>
      buildMarketRiskScoreColumns({
        showMaterialColumn: false,
        overallBandLabels: false,
        showExposureColumns: true,
      }),
    [],
  );

  const sortedData = useMemo(
    () => sortCountryScoresForDisplay(scores),
    [scores],
  );

  const visibleData = showAllCountries
    ? sortedData
    : sortedData.slice(0, COUNTRY_SCORES_DEFAULT_LIMIT);

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
          subtitle="Sorted by share desc, then risk desc"
        />
        <PlatformCardBody>
          <p style={{ fontSize: 13, color: "var(--p-text-muted)", textAlign: "center", padding: "24px 0" }}>
            No market scores have been computed for this material yet.
          </p>
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  const cappedLimit = Math.min(COUNTRY_SCORES_DEFAULT_LIMIT, sortedData.length);
  const subtitle = showAllCountries
    ? `Showing all ${sortedData.length} scored countries · click a row to see the score breakdown · producers first (by share), then by overall risk`
    : `Showing top ${cappedLimit} of ${sortedData.length} · producers first (by share), then by overall risk · toggle below to show all`;

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Country-level risk scores"
        subtitle={subtitle}
        actions={
          <label
            className="inline-flex items-center gap-2 text-[11px]"
            style={{ color: "var(--p-text-muted)", cursor: "pointer" }}
            title={`Default view shows top ${COUNTRY_SCORES_DEFAULT_LIMIT} countries ranked by production share then overall risk — toggle to see the full list of ${sortedData.length}`}
          >
            <input
              type="checkbox"
              checked={showAllCountries}
              onChange={(e) => setShowAllCountries(e.target.checked)}
              style={{ accentColor: "var(--p-accent)" }}
            />
            Show all countries
          </label>
        }
      />
      <PlatformCardBody noPadding>
        {visibleData.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--p-text-muted)", textAlign: "center", padding: "24px 16px" }}>
            No scored countries to display.
          </p>
        ) : (
          <PlatformTable
            embedded
            data={visibleData}
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
        )}
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

// NotesTab was removed in the May 2026 strip-down — analyst notes now
// render inside Overview as a collapsible (see ``NotesSection`` above).
