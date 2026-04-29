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
import { useDashboardOverview } from "@/lib/hooks/use-dashboard";
import { formatNumber, formatRelative, humanize, NOTE_TYPE_BADGE, NOTE_TYPE_LABEL } from "@/lib/utils/format";
import type {
  TopMaterialRisk,
  ScoreRunProgress,
  RecentNoteItem,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scorePct(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function riskTier(score: number): "high" | "med" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "med";
  return "low";
}

function riskLabel(score: number): string {
  const t = riskTier(score);
  return t === "high" ? "High" : t === "med" ? "Med" : "Low";
}


const PILLAR_COLOR_VAR: Record<string, string> = {
  material_concentration_score: "var(--p-pillar-material)",
  geopolitical_trade_score: "var(--p-pillar-geo)",
  regulatory_compliance_score: "var(--p-pillar-regulatory)",
  operational_score: "var(--p-pillar-operational)",
  financial_pressure_score: "var(--p-pillar-financial)",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BarList({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const sorted = [...items].sort((a, b) => b.value - a.value);
  return (
    <div className="p-bar-list">
      {sorted.map((item) => (
        <div key={item.label} className="p-bar-row">
          <div className="p-bar-row-top">
            <span className="p-bar-lbl">{item.label}</span>
            <span className="p-bar-val">{formatNumber(item.value)}</span>
          </div>
          <div className="p-bar-track">
            <div
              className="p-bar-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

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
              const tier = riskTier(m.overall_risk_score);
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
                          background:
                            tier === "high"
                              ? "var(--p-risk-high)"
                              : tier === "med"
                              ? "var(--p-risk-med)"
                              : "var(--p-risk-low)",
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
                    <span className={`p-score p-score-${tier}`}>
                      <span className={`p-score-dot p-dot-${tier}`} />
                      {m.overall_risk_score} · {riskLabel(m.overall_risk_score)}
                    </span>
                  </td>
                  {/* Trend */}
                  <td style={{ padding: "12px 16px" }}>
                    {trend === "rising" ? (
                      <span style={{ color: "var(--p-risk-high)", fontSize: 12, fontWeight: 500 }}>
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

function ScoreRunCard({ progress }: { progress: ScoreRunProgress }) {
  const totalPairs = Math.max(
    progress.scored_geographies * progress.scored_materials,
    1,
  );
  void totalPairs; // used only for context; pillar %s come from the API

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Score-run progress"
        subtitle={
          progress.last_run_date
            ? `Last full run: ${new Date(progress.last_run_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })} UTC`
            : undefined
        }
      />
      <PlatformCardBody>
        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3"
          style={{ gap: 12, marginBottom: 20 }}
        >
          {[
            {
              label: "GEOGRAPHIES",
              valid: progress.valid_geographies,
              scored: progress.scored_geographies,
              total: progress.total_geographies,
            },
            {
              label: "MATERIALS",
              valid: progress.valid_materials,
              scored: progress.scored_materials,
              total: progress.total_materials,
            },
            { label: "PILLARS", valid: 5, scored: 5, total: 5 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "12px 16px",
                background: "var(--p-bg-subtle)",
                borderRadius: "var(--p-radius-md)",
                border: "1px solid var(--p-border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--p-text-muted)",
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--p-text)", lineHeight: 1.1 }}>
                {stat.valid}
                <span style={{ fontSize: 13, fontWeight: 400, color: "var(--p-text-muted)" }}>
                  {" "}/ {stat.total}
                </span>
              </div>
              {stat.valid !== stat.scored && (
                <div style={{ fontSize: 11, color: "var(--p-text-faint)", marginTop: 3 }}>
                  {stat.scored} scored, {stat.total - stat.valid} no data
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pillar bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {progress.pillars.map((p) => {
            const color = PILLAR_COLOR_VAR[p.name] ?? "var(--p-slate-700)";
            const gapPct = p.computed_pct - p.signal_pct;
            return (
              <div key={p.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: 12,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ color: "var(--p-text-muted)" }}>{p.label}</span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: "var(--p-text)" }}>
                      {p.signal_pct}%
                      <span style={{ fontWeight: 400, color: "var(--p-text-muted)", marginLeft: 3 }}>
                        have signal
                      </span>
                    </span>
                    {gapPct > 0 && (
                      <span style={{ fontSize: 11, color: "var(--p-text-faint)" }}>
                        {gapPct}% floor
                      </span>
                    )}
                  </span>
                </div>
                {/* Stacked bar: signal (full) + floor zeros (dim) + uncovered (bg) */}
                <div
                  style={{
                    height: 7,
                    background: "var(--p-bg-muted)",
                    borderRadius: 4,
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  <div
                    style={{
                      width: `${p.signal_pct}%`,
                      height: "100%",
                      background: color,
                      transition: "width 0.4s ease",
                    }}
                  />
                  {gapPct > 0 && (
                    <div
                      style={{
                        width: `${gapPct}%`,
                        height: "100%",
                        background: color,
                        opacity: 0.2,
                        transition: "width 0.4s ease",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 14,
            fontSize: 11,
            color: "var(--p-text-faint)",
          }}
        >
          {[
            { label: "Has signal", opacity: 1 },
            { label: "Scored, no data", opacity: 0.2 },
            { label: "Not covered", bg: "var(--p-bg-muted)", opacity: 1 },
          ].map(({ label, opacity, bg }) => (
            <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 6,
                  borderRadius: 2,
                  background: bg ?? "var(--p-pillar-material)",
                  opacity,
                  display: "inline-block",
                }}
              />
              {label}
            </span>
          ))}
        </div>
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
  const stageCounts = data?.company_count_by_stage ?? [];
  const topMaterials = data?.top_materials_by_risk ?? [];
  const scoreRun = data?.score_run_progress ?? null;
  const recentActivity = data?.recent_activity ?? [];

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
          {/* KPI grid */}
          <div className="p-kpi-grid">
            <KpiCard
              label="Materials Tracked"
              value={isLoading ? null : formatNumber(data?.material_count_total ?? null)}
              sub={
                !isLoading && data?.material_count_this_quarter != null &&
                data.material_count_this_quarter > 0 ? (
                  <span>
                    <span className="p-delta-up">+{data.material_count_this_quarter}</span> this quarter
                  </span>
                ) : "Battery supply chain materials"
              }
              isLoading={isLoading}
            />
            <KpiCard
              label="Companies Scored"
              value={isLoading ? null : formatNumber(data?.companies_with_score ?? null)}
              sub={
                !isLoading && data ? (
                  <span>
                    of {formatNumber(data.company_count_total)} ·{" "}
                    <strong>{scorePct(data.companies_with_score, data.company_count_total)}%</strong>
                  </span>
                ) : undefined
              }
              isLoading={isLoading}
            />
            <KpiCard
              label="Suspect Mappings"
              value={isLoading ? null : formatNumber(data?.suspect_mappings_count ?? null)}
              sub="Low-confidence or cross-mapped HS codes"
              isLoading={isLoading}
            />
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

          {/* Top materials + Companies by stage */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_380px]">
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

            <PlatformCard>
              <PlatformCardHeader
                title="Companies by stage"
                subtitle="Distribution across the supply chain"
              />
              <PlatformCardBody>
                {isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : stageCounts.length === 0 ? (
                  <div style={{ color: "var(--p-text-muted)", fontSize: 13 }}>No stage data</div>
                ) : (
                  <BarList
                    items={stageCounts.map((s) => ({
                      label: humanize(s.stage),
                      value: s.count,
                    }))}
                  />
                )}
              </PlatformCardBody>
            </PlatformCard>
          </div>

          {/* Score-run progress + Recent activity */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {isLoading ? (
              <CardSkeleton title="Score-run progress" />
            ) : scoreRun ? (
              <ScoreRunCard progress={scoreRun} />
            ) : (
              <CardEmpty
                title="Score-run progress"
                subtitle="No scoring runs found"
                message="Trigger a rescore via POST /market/rescore to populate this section."
              />
            )}

            {isLoading ? (
              <CardSkeleton title="Recent analyst activity" />
            ) : (
              <RecentActivityCard notes={recentActivity} />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}
