"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { KpiCard } from "@/components/platform/kpi-card";
import { CountrySharePill } from "@/components/shared/country-share-pill";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import {
  PlatformCard,
  PlatformCardHeader,
  PlatformCardBody,
} from "@/components/platform/platform-card";
import { useCoverageMatrix, useDashboardOverview } from "@/lib/hooks/use-dashboard";
import { CoverageMatrixCard } from "@/components/platform/coverage-matrix-card";
import { ScoreCoverageCard } from "@/components/platform/score-coverage-card";
import { formatNumber, formatRelative, humanize, NOTE_TYPE_BADGE, NOTE_TYPE_LABEL } from "@/lib/utils/format";
import { scoreToBand, RISK_BAND_LABEL } from "@/lib/utils/risk-band";
import type {
  TopMaterialRisk,
  RecentNoteItem,
  RiskBand,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scorePct(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

/** Map a 4-tier RiskBand to the platform.css class suffix.  Single source
 *  of truth for band → color across this page; uses scoreToBand under the
 *  hood so threshold changes only need to happen in risk-band.ts. */
function bandClassSuffix(band: RiskBand | null): "low" | "mod" | "high" | "crit" | "low" {
  if (band === "CRIT") return "crit";
  if (band === "HIGH") return "high";
  if (band === "MOD") return "mod";
  return "low";
}

/** CSS var name for the band's primary color, used in inline styles
 *  (table dots, trend arrows, KPI sub colors). */
function bandColorVar(band: RiskBand | null): string {
  if (band === "CRIT") return "var(--p-risk-crit)";
  if (band === "HIGH") return "var(--p-risk-high)";
  if (band === "MOD") return "var(--p-risk-mod)";
  return "var(--p-risk-low)";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
//
// Note (2026-05-11): BarList, ScoreRunCard, and PILLAR_COLOR_VAR were
// removed in this revision.  Companies-by-stage and Score-run progress
// retired from the Overview; the new CoverageMatrixCard subsumes both
// (per-material × per-pillar view replaces aggregate score-run; per-source
// view replaces the company-stage bar list).  If those views need to
// resurface on an admin / system-status page later, recover from git
// history rather than maintaining unused code here.

function TopMaterialsCard({ materials }: { materials: TopMaterialRisk[] }) {
  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Top materials by risk"
        subtitle="Global risk score, weighted by trade exposure"
        actions={
          <Link
            href="/data/materials"
            style={{
              fontSize: 12,
              color: "var(--p-accent)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            View all →
          </Link>
        }
      />
      <PlatformCardBody noPadding>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr
              style={{
                background: "var(--p-bg-subtle)",
                borderBottom: "1px solid var(--p-border)",
              }}
            >
              {["MATERIAL", "CONCENTRATION", "RISK", "TREND"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 16px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--p-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              // Unified band logic: 4-tier (LOW/MOD/HIGH/CRIT) via the
              // single scoreToBand utility.  No inline thresholds.
              const band = scoreToBand(m.overall_risk_score);
              const suffix = bandClassSuffix(band);
              const dotColor = bandColorVar(band);
              const bandLabel = band ? RISK_BAND_LABEL[band] : "—";
              const trend = m.trend?.toLowerCase();
              return (
                <tr
                  key={m.material_id}
                  style={{ borderBottom: "1px solid var(--p-rule)", cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--p-bg-subtle)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
                >
                  {/* Material name */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 500, color: "var(--p-text)" }}>
                          {m.canonical_name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--p-text-muted)", marginTop: 1 }}>
                          {[m.symbol_or_code, m.category].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Concentration */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {m.top_countries.length > 0 ? (
                        m.top_countries.map((c) => (
                          <CountrySharePill key={c.code} code={c.code} sharePct={c.share_pct} />
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--p-text-faint)" }}>—</span>
                      )}
                    </div>
                  </td>
                  {/* Risk score */}
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`p-score p-score-${suffix}`}>
                      <span className={`p-score-dot p-dot-${suffix}`} />
                      {m.overall_risk_score} · {bandLabel}
                    </span>
                  </td>
                  {/* Trend — uses CRIT color for rising (most attention-
                      grabbing) and LOW color for declining (favorable). */}
                  <td style={{ padding: "12px 16px" }}>
                    {trend === "rising" ? (
                      <span style={{ color: "var(--p-risk-crit)", fontSize: 12, fontWeight: 500 }}>
                        ↗ Rising
                      </span>
                    ) : trend === "declining" ? (
                      <span style={{ color: "var(--p-risk-low)", fontSize: 12, fontWeight: 500 }}>
                        ↘ Declining
                      </span>
                    ) : trend === "stable" ? (
                      <span style={{ color: "var(--p-text-muted)", fontSize: 12 }}>— Stable</span>
                    ) : (
                      <span style={{ color: "var(--p-text-faint)", fontSize: 12 }}>—</span>
                    )}
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

function RecentActivityCard({ notes }: { notes: RecentNoteItem[] }) {
  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Recent analyst activity"
        subtitle="Notes flagged in the last 7 days"
      />
      <PlatformCardBody noPadding>
        {notes.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              fontSize: 13,
              color: "var(--p-text-muted)",
            }}
          >
            No analyst notes in the last 7 days
          </div>
        ) : (
          notes.map((note, i) => {
            const badgeClass = NOTE_TYPE_BADGE[note.note_type] ?? "p-badge-soft";
            const noteLabel = NOTE_TYPE_LABEL[note.note_type] ?? humanize(note.note_type);
            const entityName = note.entity_name ?? note.entity_id;

            return (
              <div
                key={i}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < notes.length - 1 ? "1px solid var(--p-rule)" : "none",
                }}
              >
                {/* Header: [entity name] [badge] · [time] */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--p-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {entityName}
                  </span>
                  <span className={`p-badge ${badgeClass}`} style={{ flexShrink: 0 }}>
                    {noteLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--p-text-faint)",
                      flexShrink: 0,
                      marginLeft: "auto",
                    }}
                  >
                    {formatRelative(note.created_at)}
                  </span>
                </div>
                {/* Note text */}
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 13,
                    color: "var(--p-text-muted)",
                    lineHeight: 1.55,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
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

// ---------------------------------------------------------------------------
// Skeleton card helper (loading state)
// ---------------------------------------------------------------------------

function CardSkeleton({ title }: { title: string }) {
  return (
    <PlatformCard>
      <PlatformCardHeader title={title} />
      <PlatformCardBody>
        <Skeleton className="h-56 w-full" />
      </PlatformCardBody>
    </PlatformCard>
  );
}

// Empty-state card helper
function CardEmpty({ title, subtitle, message }: { title: string; subtitle?: string; message: string }) {
  return (
    <PlatformCard>
      <PlatformCardHeader title={title} subtitle={subtitle} />
      <PlatformCardBody>
        <div style={{ color: "var(--p-text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          {message}
        </div>
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardOverviewPage() {
  const { data, isLoading, error, refetch } = useDashboardOverview();
  const {
    data: coverageMatrix,
    isLoading: isLoadingMatrix,
  } = useCoverageMatrix();
  const topMaterials = data?.top_materials_by_risk ?? [];
  const recentActivity = data?.recent_activity ?? [];
  // Companies-by-stage and Score-run progress are no longer rendered on
  // Overview as of 2026-05-11; the coverage matrix replaces both views.
  // Data still arrives in the overview response for backwards-compat —
  // we just don't consume it here.

  return (
    <PageLayout>
      <PageHeader
        title="Overview"
        subtitle="Coverage, scoring progress, and recent analyst activity across the scoring engine."
      />

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          {/* KPI grid — launch-list-centric analyst view (2026-05-11) */}
          <div className="p-kpi-grid">
            {/* 1. Core minerals scored — fraction of the 10-mineral launch
                list that currently has a global risk score. The headline
                metric for "is the analysis covering what we said it would?" */}
            <KpiCard
              label="Core Minerals Scored"
              value={
                isLoading || !data?.core_minerals_scored ? null : (
                  <span>
                    {data.core_minerals_scored.scored}
                    <span style={{ fontSize: 16, fontWeight: 400, color: "var(--p-text-muted)" }}>
                      {" "}/ {data.core_minerals_scored.total}
                    </span>
                  </span>
                )
              }
              sub={
                !isLoading && data?.core_minerals_scored ? (
                  data.core_minerals_scored.unscored_names.length === 0 ? (
                    <span>Launch list fully scored</span>
                  ) : (
                    <span title={data.core_minerals_scored.unscored_names.join(", ")}>
                      Missing:{" "}
                      <strong>
                        {data.core_minerals_scored.unscored_names.length > 2
                          ? `${data.core_minerals_scored.unscored_names.slice(0, 2).join(", ")} +${data.core_minerals_scored.unscored_names.length - 2}`
                          : data.core_minerals_scored.unscored_names.join(", ")}
                      </strong>
                    </span>
                  )
                ) : "Launch-list global risk score coverage"
              }
              isLoading={isLoading}
            />

            {/* 2. Risk events (30d) — ingestion volume in the last month,
                with delta vs the prior 30d so the analyst can see whether
                signal is flowing or has stalled. */}
            <KpiCard
              label="Risk Events (30d)"
              value={
                isLoading || !data?.recent_risk_events_30d
                  ? null
                  : formatNumber(data.recent_risk_events_30d.count)
              }
              sub={
                !isLoading && data?.recent_risk_events_30d ? (
                  (() => {
                    const cur = data.recent_risk_events_30d.count;
                    const prev = data.recent_risk_events_30d.prev_period_count;
                    if (prev === 0 && cur === 0) {
                      return <span>No events in prior 60 days</span>;
                    }
                    if (prev === 0) {
                      return <span><span className="p-delta-up">new signal</span> · prior 30d was 0</span>;
                    }
                    const deltaPct = Math.round(((cur - prev) / prev) * 100);
                    const cls = deltaPct > 0 ? "p-delta-up" : deltaPct < 0 ? "p-delta-down" : "";
                    const arrow = deltaPct > 0 ? "↗" : deltaPct < 0 ? "↘" : "→";
                    return (
                      <span>
                        <span className={cls}>{arrow} {Math.abs(deltaPct)}%</span>{" "}
                        vs prior 30d
                      </span>
                    );
                  })()
                ) : "New risk events in the last 30 days"
              }
              isLoading={isLoading}
            />

            {/* 3. Coverage gaps — count of launch-list minerals failing any
                quality bar (no score / stale / thin events / thin pillars).
                This is the "where do I focus my next data work?" KPI. */}
            <KpiCard
              label="Coverage Gaps"
              value={
                isLoading || !data?.coverage_gaps
                  ? null
                  : formatNumber(data.coverage_gaps.count)
              }
              sub={
                !isLoading && data?.coverage_gaps ? (
                  data.coverage_gaps.count === 0 ? (
                    <span style={{ color: "var(--p-risk-low)" }}>All launch-list minerals pass</span>
                  ) : (
                    <span
                      title={data.coverage_gaps.materials
                        .map((m) => `${m.canonical_name} (${m.reasons.join(", ")})`)
                        .join("\n")}
                    >
                      Minerals needing attention
                    </span>
                  )
                ) : "Launch-list minerals failing the quality bar"
              }
              isLoading={isLoading}
            />

            {/* 4. Notes (7d) — analyst activity indicator. Unchanged from
                the prior strip; still useful once notes flow. */}
            <KpiCard
              label="Notes (7d)"
              value={isLoading ? null : formatNumber(data?.recent_notes_count_7d ?? null)}
              sub={
                !isLoading && data?.recent_notes_entity_count_7d != null ? (
                  <span>
                    across <strong>{data.recent_notes_entity_count_7d}</strong>{" "}
                    {data.recent_notes_entity_count_7d === 1 ? "entity" : "entities"}
                  </span>
                ) : "Analyst flags in the last week"
              }
              isLoading={isLoading}
            />
          </div>

          {/* Top materials by risk — full width since Companies-by-stage
              was retired from the Overview as of 2026-05-11. */}
          {isLoading ? (
            <CardSkeleton title="Top materials by risk" />
          ) : topMaterials.length > 0 ? (
            <TopMaterialsCard materials={topMaterials} />
          ) : (
            <CardEmpty
              title="Top materials by risk"
              subtitle="Global risk score, weighted by trade exposure"
              message="No global risk scores computed yet. Run a market rescore to populate."
            />
          )}

          {/* Score coverage + Recent activity — paired on one row.
              Score coverage on the left (per-pillar share-of-launch-list
              bars), Notes/activity on the right.  Collapses to a single
              column under md breakpoint so the bars stay readable on
              narrow viewports. */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <ScoreCoverageCard
              pillars={coverageMatrix?.pillar_coverage}
              isLoading={isLoadingMatrix}
            />
            {isLoading ? (
              <CardSkeleton title="Recent analyst activity" />
            ) : (
              <RecentActivityCard notes={recentActivity} />
            )}
          </div>

          {/* Coverage matrix — per launch-list material × source.  Pillar
              columns moved to the dedicated ScoreCoverageCard above to
              avoid cramping (2026-05-11). */}
          <CoverageMatrixCard data={coverageMatrix} isLoading={isLoadingMatrix} />
        </>
      )}
    </PageLayout>
  );
}
