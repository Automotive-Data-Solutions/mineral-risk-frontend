"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  PlatformCard,
  PlatformCardBody,
  PlatformCardHeader,
} from "@/components/platform/platform-card";
import { PlatformTable } from "@/components/platform/platform-table";
import { ScoreChip } from "@/components/platform/score-chip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { CountrySharePill } from "@/components/shared/country-share-pill";
import { RowActionsMenu } from "@/components/shared/row-actions-menu";
import {
  SupplyChainStageBadge,
  SUPPLY_STAGE_SEQUENCE,
  type SupplyChainStage,
} from "@/components/shared/supply-chain-stage-badge";
import { MismatchBadgeList } from "@/components/materials/mismatch-badge";
import type { HsCodeMaterialMappingRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/**
 * View-model the combined "HS codes & stages" tab consumes. Extends the
 * wire-shape ``HsCodeMaterialMappingRead`` (which now carries
 * ``supply_chain_stage`` / ``stage_sequence`` / ``digit_count`` /
 * ``market_scope`` / ``keywords`` natively from the API) with optional
 * fields the scoring pipeline will populate later.
 *
 * Score-related fields stay optional — they render as "—" or "Pending"
 * placeholders until the scoring engine starts writing them.
 */
export interface HsMappingNode extends HsCodeMaterialMappingRead {
  /** Per-geography score breakdowns. Empty when scores not yet computed. */
  geographies?: HsMappingGeographyScore[];
  /** Aggregate node-level score 0-100. Null when not yet computed. */
  node_score?: number | null;
  /** Score-confidence factor 0-1 (matches ``score_confidence``). */
  node_score_confidence?: number | null;
  /** HHI of the production-share distribution at this HS prefix. */
  hhi?: number | null;
  /** Open / active risk events affecting this node. */
  events_open?: number | null;
  /** ISO date the score was computed. */
  scored_at?: string | null;
  /** ISO timestamp of the latest partner review. */
  reviewed_at?: string | null;
  /** Per-row review status from the partner workflow. */
  review_status?: "unreviewed" | "approved" | "flagged" | string | null;
}

export interface HsMappingGeographyScore {
  country_code: string;
  /** 0-1 fraction of world production. */
  production_share?: number | null;
  hhi?: number | null;
  /** 0-1 effective tariff rate. */
  tariff_exposure?: number | null;
  /** True when the country has an active export licensing / ban. */
  export_restriction?: boolean | null;
  /** 0-100 node × geography composite score. Null until scoring lands. */
  score?: number | null;
  events_open?: number | null;
  /** Source attribution for the row (e.g. "USGS MCS 2026", "Comtrade 2024"). */
  source?: string | null;
  /** Reference year of the underlying data. */
  reference_year?: number | null;
  review_status?: "unreviewed" | "approved" | "flagged" | string | null;
}

interface HsCodesAndStagesTabProps {
  materialId: string;
  /**
   * Accepted for forward compatibility (e.g. accessibility labels on
   * row actions, future drill-downs).  Currently unused inside the
   * component body — present in the prop list so callers don't have to
   * change shape when we start using it.
   */
  materialName?: string;
  /** Mappings + (optional) score data; safe to pass plain API rows until score fields land. */
  mappings: HsMappingNode[];
}

type ViewMode = "by_stage" | "flat";

const REVIEW_STATUS_TINT: Record<string, string> = {
  approved: "text-emerald-700 dark:text-emerald-300",
  flagged: "text-amber-700 dark:text-amber-300",
  unreviewed: "text-muted-foreground",
};

const REVIEW_STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  flagged: "Flagged",
  unreviewed: "Unreviewed",
};

// ---------------------------------------------------------------------------
// Top-level component
// ---------------------------------------------------------------------------

export function HsCodesAndStagesTab({
  materialId,
  mappings,
}: HsCodesAndStagesTabProps) {
  const [view, setView] = useState<ViewMode>("by_stage");

  const summary = useMemo(() => buildSummary(mappings), [mappings]);
  const scoringReady = mappings.some((m) => m.node_score != null);
  const stagesPresent = mappings.some((m) => m.supply_chain_stage);

  return (
    <div className="flex flex-col gap-4">
      {/* ── KPI summary row ──────────────────────────────────────────── */}
      <SummaryKpis summary={summary} scoringReady={scoringReady} />

      {/* ── Main table card with view-mode toggle ────────────────────── */}
      <PlatformCard>
        <PlatformCardHeader
          title="HS codes &amp; supply-chain stages"
          subtitle={
            scoringReady
              ? "Click a row to see per-geography breakdown · sorted by stage sequence"
              : "Stage scoring not yet computed · showing partner-curated mappings only"
          }
          actions={
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as ViewMode)}
              className="ml-auto"
            >
              <TabsList>
                <TabsTrigger value="by_stage">By stage</TabsTrigger>
                <TabsTrigger value="flat">Flat list</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />
        <PlatformCardBody noPadding>
          {!stagesPresent && view === "by_stage" && (
            <div className="border-b border-border/60 bg-amber-50/60 px-5 py-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Stage assignments are pending. Until the backend exposes
              <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono dark:bg-amber-900/50">
                supply_chain_stage
              </code>
              on each mapping, all rows are grouped under <em>Unassigned</em>.
            </div>
          )}
          {view === "by_stage" ? (
            <ByStageView materialId={materialId} mappings={mappings} />
          ) : (
            <FlatListView materialId={materialId} mappings={mappings} />
          )}
        </PlatformCardBody>
      </PlatformCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary KPI cards
// ---------------------------------------------------------------------------

interface Summary {
  totalMappings: number;
  stagesTracked: number;
  totalStages: number;
  highestScore: number | null;
  highestScoreLabel: string | null;
  avgHhi: number | null;
  totalEvents: number | null;
  reviewed: number;
  unreviewed: number;
  flagged: number;
}

function buildSummary(mappings: HsMappingNode[]): Summary {
  const totalStages = SUPPLY_STAGE_SEQUENCE.length - 1; // exclude "unassigned"
  const stagesWithData = new Set(
    mappings
      .map((m) => m.supply_chain_stage)
      .filter((s): s is string => Boolean(s) && s !== "unassigned"),
  );

  let highestScore: number | null = null;
  let highestScoreLabel: string | null = null;
  let hhiSum = 0;
  let hhiCount = 0;
  let totalEvents: number | null = null;
  let reviewed = 0;
  let unreviewed = 0;
  let flagged = 0;

  for (const m of mappings) {
    if (m.events_open != null) {
      totalEvents = (totalEvents ?? 0) + m.events_open;
    }
    if (m.hhi != null) {
      hhiSum += m.hhi;
      hhiCount += 1;
    }
    if (m.node_score != null) {
      if (highestScore == null || m.node_score > highestScore) {
        highestScore = m.node_score;
        const stageLabel = m.supply_chain_stage ?? "—";
        highestScoreLabel = `${stageLabel} · ${m.hs_code_prefix}`;
      }
    }
    if (m.review_status === "approved") reviewed += 1;
    else if (m.review_status === "flagged") flagged += 1;
    else unreviewed += 1;

    for (const g of m.geographies ?? []) {
      if (g.events_open != null) {
        totalEvents = (totalEvents ?? 0) + g.events_open;
      }
      if (g.score != null && (highestScore == null || g.score > highestScore)) {
        highestScore = g.score;
        const stageLabel = m.supply_chain_stage ?? "—";
        highestScoreLabel = `${stageLabel} · ${g.country_code} · ${m.hs_code_prefix}`;
      }
    }
  }

  return {
    totalMappings: mappings.length,
    stagesTracked: stagesWithData.size,
    totalStages,
    highestScore,
    highestScoreLabel,
    avgHhi: hhiCount > 0 ? hhiSum / hhiCount : null,
    totalEvents,
    reviewed,
    unreviewed,
    flagged,
  };
}

interface SummaryKpisProps {
  summary: Summary;
  scoringReady: boolean;
}

function SummaryKpis({ summary, scoringReady }: SummaryKpisProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label="Stages with data"
        value={
          summary.stagesTracked > 0
            ? `${summary.stagesTracked} / ${summary.totalStages}`
            : "—"
        }
      />
      <KpiCard
        label="Highest node risk"
        value={
          summary.highestScore != null ? (
            <ScoreChip score={summary.highestScore} showBandLabel={false} />
          ) : scoringReady ? (
            "—"
          ) : (
            <span className="text-xs italic text-muted-foreground">
              Pending scoring
            </span>
          )
        }
        sub={summary.highestScoreLabel ?? undefined}
      />
      <KpiCard
        label="Avg HHI"
        value={summary.avgHhi != null ? summary.avgHhi.toFixed(2) : "—"}
        sub={summary.avgHhi != null ? "lower bound" : undefined}
      />
      <KpiCard
        label="Open risk events"
        value={summary.totalEvents != null ? String(summary.totalEvents) : "—"}
        tone={summary.totalEvents && summary.totalEvents > 0 ? "amber" : "ok"}
      />
      <KpiCard
        label="Reviewed by partner"
        value={`${summary.reviewed} / ${summary.totalMappings}`}
        sub={
          summary.flagged > 0
            ? `${summary.flagged} flagged · ${summary.unreviewed} unreviewed`
            : `${summary.unreviewed} unreviewed`
        }
      />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "ok" | "amber";
}

function KpiCard({ label, value, sub, tone = "ok" }: KpiCardProps) {
  return (
    <div className="rounded-md border bg-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "amber" && "text-amber-700 dark:text-amber-300",
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// View 1 — grouped by supply-chain stage
// ---------------------------------------------------------------------------

interface StageGroup {
  stage: SupplyChainStage;
  mappings: HsMappingNode[];
  scoreRange: [number, number] | null;
  avgHhi: number | null;
  events: number;
  reviewedCount: number;
  flaggedCount: number;
  unreviewedCount: number;
}

function groupByStage(mappings: HsMappingNode[]): StageGroup[] {
  const buckets = new Map<SupplyChainStage, HsMappingNode[]>();
  for (const m of mappings) {
    const stage = (m.supply_chain_stage as SupplyChainStage) ?? "unassigned";
    const key = SUPPLY_STAGE_SEQUENCE.includes(stage) ? stage : "unassigned";
    const arr = buckets.get(key) ?? [];
    arr.push(m);
    buckets.set(key, arr);
  }

  return SUPPLY_STAGE_SEQUENCE.filter((s) => buckets.has(s)).map((stage) => {
    const list = buckets.get(stage) ?? [];
    const scores: number[] = [];
    let hhiSum = 0;
    let hhiCount = 0;
    let events = 0;
    let reviewed = 0;
    let flagged = 0;
    let unreviewed = 0;
    for (const m of list) {
      if (m.node_score != null) scores.push(m.node_score);
      for (const g of m.geographies ?? []) {
        if (g.score != null) scores.push(g.score);
      }
      if (m.hhi != null) {
        hhiSum += m.hhi;
        hhiCount += 1;
      }
      if (m.events_open != null) events += m.events_open;
      if (m.review_status === "approved") reviewed += 1;
      else if (m.review_status === "flagged") flagged += 1;
      else unreviewed += 1;
    }
    return {
      stage,
      mappings: list,
      scoreRange: scores.length
        ? ([Math.min(...scores), Math.max(...scores)] as [number, number])
        : null,
      avgHhi: hhiCount > 0 ? hhiSum / hhiCount : null,
      events,
      reviewedCount: reviewed,
      flaggedCount: flagged,
      unreviewedCount: unreviewed,
    };
  });
}

function ByStageView({
  materialId,
  mappings,
}: {
  materialId: string;
  mappings: HsMappingNode[];
}) {
  const groups = useMemo(() => groupByStage(mappings), [mappings]);
  // Auto-expand if there's only one stage (typical when all mappings
  // fall into "unassigned" because backend stage data isn't ready yet).
  const [openStages, setOpenStages] = useState<Set<SupplyChainStage>>(() => {
    const initial: SupplyChainStage[] =
      groups.length === 1 && groups[0] ? [groups[0].stage] : [];
    return new Set(initial);
  });

  const toggle = (stage: SupplyChainStage) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-muted-foreground">
        No HS code mappings yet.
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-[2fr_2.5fr_0.7fr_0.6fr_0.6fr_1.2fr] gap-3 border-b bg-muted/40 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Stage</div>
        <div>Score range</div>
        <div>Avg HHI</div>
        <div>Codes</div>
        <div>Events</div>
        <div className="text-right">Review</div>
      </div>
      {groups.map((g) => (
        <StageRow
          key={g.stage}
          group={g}
          open={openStages.has(g.stage)}
          onToggle={() => toggle(g.stage)}
          materialId={materialId}
        />
      ))}
    </div>
  );
}

function StageRow({
  group,
  open,
  onToggle,
  materialId,
}: {
  group: StageGroup;
  open: boolean;
  onToggle: () => void;
  materialId: string;
}) {
  const [lo, hi] = group.scoreRange ?? [null, null];
  return (
    <div className="border-b">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[2fr_2.5fr_0.7fr_0.6fr_0.6fr_1.2fr] items-center gap-3 px-5 py-3 text-left text-sm transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <SupplyChainStageBadge stage={group.stage} />
          <span className="text-xs text-muted-foreground">
            {group.mappings.length} HS code{group.mappings.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lo != null && hi != null ? (
            <>
              <ScoreChip score={hi} showBandLabel={false} />
              <span className="text-xs text-muted-foreground">
                {Math.round(lo)} – {Math.round(hi)}
              </span>
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground">
              No scores yet
            </span>
          )}
        </div>

        <div className="text-sm tabular-nums">
          {group.avgHhi != null ? group.avgHhi.toFixed(2) : "—"}
        </div>
        <div className="text-sm tabular-nums">{group.mappings.length}</div>
        <div className="text-sm tabular-nums">
          {group.events > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {group.events}
            </span>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </div>
        <div className="text-right text-xs">
          {group.flaggedCount > 0 && (
            <span className={REVIEW_STATUS_TINT.flagged}>
              {group.flaggedCount} flagged
            </span>
          )}
          {group.flaggedCount > 0 && group.unreviewedCount > 0 && (
            <span className="text-muted-foreground"> · </span>
          )}
          {group.unreviewedCount > 0 && (
            <span className="text-muted-foreground">
              {group.unreviewedCount} unreviewed
            </span>
          )}
          {group.reviewedCount > 0 &&
            group.flaggedCount === 0 &&
            group.unreviewedCount === 0 && (
              <span className={REVIEW_STATUS_TINT.approved}>
                {group.reviewedCount} approved
              </span>
            )}
        </div>
      </button>

      {open && (
        <div className="border-t bg-muted/20 px-3 py-2">
          <NodeSubTable mappings={group.mappings} materialId={materialId} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-table inside expanded stage — per HS × geography rows
// ---------------------------------------------------------------------------

function NodeSubTable({
  mappings,
  materialId,
}: {
  mappings: HsMappingNode[];
  materialId: string;
}) {
  const rows: ExpandedRow[] = [];
  for (const m of mappings) {
    const geos = m.geographies ?? [];
    if (geos.length === 0) {
      rows.push({ mapping: m, geo: null });
    } else {
      for (const geo of geos) {
        rows.push({ mapping: m, geo });
      }
    }
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="grid grid-cols-[1fr_1.5fr_0.7fr_0.6fr_0.6fr_0.7fr_0.5fr_0.7fr_1fr_0.9fr] gap-2 border-b bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <div>HS code</div>
        <div>Description</div>
        <div>Geography</div>
        <div>Share</div>
        <div>HHI</div>
        <div>Tariff</div>
        <div>Export</div>
        <div>Score</div>
        <div>Source · age</div>
        <div className="text-right">Action</div>
      </div>

      {rows.map((row, i) => (
        <NodeRow
          key={`${row.mapping.id}-${row.geo?.country_code ?? "none"}-${i}`}
          row={row}
          materialId={materialId}
          isLast={i === rows.length - 1}
        />
      ))}
    </div>
  );
}

interface ExpandedRow {
  mapping: HsMappingNode;
  geo: HsMappingGeographyScore | null;
}

function NodeRow({
  row,
  materialId,
  isLast,
}: {
  row: ExpandedRow;
  materialId: string;
  isLast: boolean;
}) {
  const { mapping: m, geo } = row;
  const score = geo?.score ?? m.node_score ?? null;
  const hhi = geo?.hhi ?? m.hhi ?? null;
  const status = (geo?.review_status ?? m.review_status ?? "unreviewed") as string;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_1.5fr_0.7fr_0.6fr_0.6fr_0.7fr_0.5fr_0.7fr_1fr_0.9fr] items-center gap-2 px-3 py-2.5 text-sm",
        !isLast && "border-b",
      )}
    >
      <div className="font-mono text-xs">{m.hs_code_prefix}</div>
      <div className="truncate text-xs text-muted-foreground" title={m.description ?? undefined}>
        {m.description ?? <span className="italic">missing</span>}
      </div>
      <div>
        {geo ? (
          <CountrySharePill code={geo.country_code} />
        ) : (
          <span className="text-xs italic text-muted-foreground">no geo</span>
        )}
      </div>
      <div className="text-xs tabular-nums">
        {geo?.production_share != null
          ? `${Math.round(geo.production_share * 100)}%`
          : "—"}
      </div>
      <div className="text-xs tabular-nums">
        {hhi != null ? hhi.toFixed(2) : "—"}
      </div>
      <div className="text-xs">
        {geo?.tariff_exposure != null ? (
          <span
            className={cn(
              "tabular-nums",
              geo.tariff_exposure >= 0.15 && "font-medium text-red-700 dark:text-red-400",
            )}
          >
            {(geo.tariff_exposure * 100).toFixed(1)}%
          </span>
        ) : (
          "—"
        )}
      </div>
      <div className="text-xs">
        {geo?.export_restriction == null ? (
          "—"
        ) : geo.export_restriction ? (
          <span className="font-medium text-red-700 dark:text-red-400">Yes</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        )}
      </div>
      <div>
        {score != null ? (
          <ScoreChip score={score} showBandLabel={false} />
        ) : (
          <span className="text-xs italic text-muted-foreground">—</span>
        )}
      </div>
      <div className="text-[11px] leading-tight text-muted-foreground">
        {geo?.source ? (
          <>
            <div>{geo.source}</div>
            {geo.reference_year && <div>ref. yr {geo.reference_year}</div>}
          </>
        ) : m.created_at ? (
          <>created {formatDate(m.created_at)}</>
        ) : (
          "—"
        )}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={cn(
            "text-[11px] font-medium",
            REVIEW_STATUS_TINT[status] ?? REVIEW_STATUS_TINT.unreviewed,
          )}
        >
          {REVIEW_STATUS_LABEL[status] ?? "Unreviewed"}
        </span>
        <RowActionsMenu
          entityType="hs_code_material_mapping"
          entityId={String(m.id)}
          parentId={materialId}
          entityLabel={`HS ${m.hs_code_prefix}${
            geo ? ` · ${geo.country_code}` : ""
          }`}
          sectionLabel="HS Codes & Stages"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 2 — flat list (existing-style table)
// ---------------------------------------------------------------------------

function FlatListView({
  materialId,
  mappings,
}: {
  materialId: string;
  mappings: HsMappingNode[];
}) {
  const columns = useMemo<ColumnDef<HsMappingNode, unknown>[]>(
    () => [
      {
        accessorKey: "hs_code_prefix",
        header: "HS prefix",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-semibold">
              {row.original.hs_code_prefix}
            </span>
            {/* Precision indicator — 4-digit (heading), 6 (subheading),
                10 (US HTS).  Helps partner spot when an HS prefix is
                broad vs precisely targeted. */}
            <span
              className="rounded bg-muted px-1 py-px text-[10px] font-medium text-muted-foreground"
              title={`${row.original.digit_count}-digit prefix`}
            >
              {row.original.digit_count}d
            </span>
          </div>
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
        id: "stage",
        header: "Stage",
        cell: ({ row }) => (
          <SupplyChainStageBadge stage={row.original.supply_chain_stage} />
        ),
      },
      {
        id: "scope",
        header: "Scope",
        cell: ({ row }) => {
          // 'us' rows are the 10-digit HTS codes from the MCS PDF tariff
          // tables.  Highlighted so partner can scan for them quickly when
          // verifying tariff coverage.
          const scope = row.original.market_scope || "global";
          const isUs = scope === "us";
          return (
            <span
              className={cn(
                "text-xs uppercase",
                isUs
                  ? "rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                  : "text-muted-foreground",
              )}
            >
              {scope}
            </span>
          );
        },
      },
      {
        id: "keywords",
        header: "Keywords",
        cell: ({ row }) => {
          const kw = row.original.keywords ?? [];
          if (kw.length === 0) {
            return (
              <span className="text-[11px] italic text-muted-foreground">
                —
              </span>
            );
          }
          // Show up to 2 inline + a "+N more" pill so the column doesn't
          // sprawl on materials with rich keyword sets.
          const visible = kw.slice(0, 2);
          const remainder = kw.length - visible.length;
          return (
            <div
              className="flex flex-wrap items-center gap-1"
              title={kw.join(", ")}
            >
              {visible.map((k) => (
                <span
                  key={k}
                  className="rounded bg-muted px-1.5 py-px text-[11px] text-foreground"
                >
                  {k}
                </span>
              ))}
              {remainder > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  +{remainder}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "score",
        header: () => <div className="text-right">Node score</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.node_score != null ? (
              <ScoreChip
                score={row.original.node_score}
                showBandLabel={false}
              />
            ) : (
              <span className="text-xs italic text-muted-foreground">—</span>
            )}
          </div>
        ),
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
          <MismatchBadgeList reasons={row.original.mismatch_reasons ?? []} />
        ),
      },
      {
        id: "review",
        header: "Review",
        cell: ({ row }) => {
          const status = (row.original.review_status ?? "unreviewed") as string;
          return (
            <span
              className={cn(
                "text-xs font-medium",
                REVIEW_STATUS_TINT[status] ?? REVIEW_STATUS_TINT.unreviewed,
              )}
            >
              {REVIEW_STATUS_LABEL[status] ?? "Unreviewed"}
            </span>
          );
        },
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
              sectionLabel="HS Codes & Stages"
            />
          </div>
        ),
      },
    ],
    [materialId],
  );

  return (
    <PlatformTable
      embedded
      data={mappings}
      columns={columns}
      emptyTitle="No HS mappings"
      emptyDescription="Add a mapping in the backend, or flag this material so an analyst can investigate."
    />
  );
}
