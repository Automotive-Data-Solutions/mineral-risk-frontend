"use client";

/**
 * Per-material Risk events tab — replaces the placeholder card on
 * /data/materials/[id].  Three regions:
 *   1. Top: pillar bar chart + signal summary KPI tiles (both follow
 *      the active filter set, with the window label updating to match).
 *   2. Filter row: search, source, pillar, type, severity, verified
 *      toggle, timeframe (30 / 90 / 365 / 730 / all, default 365).
 *   3. Table of events with click-to-open drawer.
 *
 * The drawer is event-focused — no weight-contribution math.  That
 * lives on the future score-breakdown view per the design call.
 */

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ExternalLink,
  Flag as FlagIcon,
  Scale,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useMaterialRiskEvents } from "@/lib/hooks/use-materials";
import type { MaterialRiskEventRow } from "@/lib/types";
import type { MaterialRiskEventsParams } from "@/lib/api/materials";
import {
  PlatformCard,
  PlatformCardBody,
  PlatformCardHeader,
} from "@/components/platform/platform-card";
import { PlatformTable } from "@/components/platform/platform-table";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { DataTablePagination } from "@/components/data-table/pagination";
import { GeographyCodePill } from "@/components/shared/geography-code-pill";
import { FlagEntityButton } from "@/components/shared/flag-entity-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { DialogTitle } from "@/components/ui/dialog";
import { formatDate, humanize } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

// ── Pillar metadata ────────────────────────────────────────────────────
//
// Pillar slugs come from the backend's RiskCategory enum (lowercase).
// Colours come straight from the platform's CSS variables so this tab
// matches the colour language used elsewhere (GlobalScoreCard,
// HsMappingsCard, ScoreCoverageCard).  Hardcoding Tailwind classes here
// would have drifted from --p-pillar-* — using the variable means a
// future theme tweak in platform.css propagates automatically.
//
// Platform palette (platform.css :73):
//   --p-pillar-material:    #7A4A8E  (purple)
//   --p-pillar-geo:         #1F6B8A  (deep blue)
//   --p-pillar-regulatory:  #C8623A  (burnt orange)
//   --p-pillar-operational: #6B5B3A  (olive)
//   --p-pillar-financial:   #3B6E55  (dark green)

const PILLAR_DISPLAY: Record<
  string,
  { label: string; short: string; cssVar: string }
> = {
  material_concentration: {
    label: "Material concentration",
    short: "Mat",
    cssVar: "--p-pillar-material",
  },
  geopolitical_trade: {
    label: "Geopolitical trade",
    short: "Geo",
    cssVar: "--p-pillar-geo",
  },
  regulatory_compliance: {
    label: "Regulatory compliance",
    short: "Reg",
    cssVar: "--p-pillar-regulatory",
  },
  operational: {
    label: "Operational",
    short: "Ops",
    cssVar: "--p-pillar-operational",
  },
  financial_pressure: {
    label: "Financial pressure",
    short: "Fin",
    cssVar: "--p-pillar-financial",
  },
};

function pillarDisplay(slug: string): {
  label: string;
  short: string;
  cssVar: string | null;
} {
  return (
    PILLAR_DISPLAY[slug] ?? {
      label: humanize(slug),
      // Fallback short label: first three chars of the slug, uppercased
      // — covers any future pillar that ships without a curated entry.
      short: slug.slice(0, 3).toUpperCase(),
      cssVar: null,
    }
  );
}

/** Inline style for pillar text colour. */
function pillarTextStyle(cssVar: string | null) {
  return cssVar ? { color: `var(${cssVar})` } : undefined;
}

/** Inline style for pillar dot / bar fill. */
function pillarBgStyle(cssVar: string | null) {
  return cssVar ? { background: `var(${cssVar})` } : undefined;
}

// ── Window selector ────────────────────────────────────────────────────

const WINDOW_OPTIONS = [
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last 365 days" },
  { value: 730, label: "Last 730 days" },
  { value: 3650, label: "All time" },
];

function windowLabel(days: number): string {
  if (days >= 3650) return "All time";
  return `Trailing ${days} days`;
}

// ── Severity banding ────────────────────────────────────────────────────
//
// Mirrors the platform's 4-band severity chip used in the country-scores
// dropdown (>=75 red, >=55 orange, >=35 amber, else emerald).

function severityChipClass(scoreOutOf100: number): string {
  if (scoreOutOf100 >= 75)
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
  if (scoreOutOf100 >= 55)
    return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800";
  if (scoreOutOf100 >= 35)
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
}

// ── Main tab component ─────────────────────────────────────────────────

interface RiskEventsTabProps {
  materialId: string;
  materialName: string;
}

// Whitelist mirrors the backend ``_SORTABLE_FIELDS`` set on the materials
// route.  Used only for the API-params translation guard below — the
// per-column ``enableSorting`` flags in the column defs are what actually
// activate the headers, so this is just defence-in-depth.
const SORTABLE_FIELDS = new Set([
  "title",
  "event_type",
  "source_system",
  "severity_score",
  "event_date",
]);

export function RiskEventsTab({ materialId, materialName }: RiskEventsTabProps) {
  // ── Filter / pagination state ───────────────────────────────────────
  const [windowDays, setWindowDays] = useState(365);
  const [source, setSource] = useState<string | undefined>();
  const [pillar, setPillar] = useState<string | undefined>();
  const [eventType, setEventType] = useState<string | undefined>();
  const [severityMin, setSeverityMin] = useState<number | undefined>();
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  // Debounce search locally — same pattern the global /data/risk-events
  // page uses, so we don't fire a request on every keystroke.
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  // Sorting now flows through PlatformTable's shared sortable-header
  // wiring.  We hold the SortingState locally, translate to API params
  // below, and pass it back to PlatformTable so the header chevrons
  // stay in sync.  Default = event_date desc (newest first).
  const [sorting, setSorting] = useState<SortingState>([
    { id: "event_date", desc: true },
  ]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [openEvent, setOpenEvent] = useState<MaterialRiskEventRow | null>(null);

  // Any sort change resets pagination to page 1 — page 4 of one sort
  // order is page 4 of a different one, so leaving the page index alone
  // would land the analyst on rows they didn't intend to land on.
  useEffect(() => {
    setPage(1);
  }, [sorting]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== search) {
        setSearch(localSearch);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // Any filter change resets pagination to page 1 (the search filter
  // resets inside its own debounce above).
  useEffect(() => {
    setPage(1);
  }, [windowDays, source, pillar, eventType, severityMin, verifiedOnly]);

  // Translate the SortingState ↔ backend params.  TanStack stores sort
  // as ``[{ id, desc }]``; the route takes ``sort_by`` + ``sort_dir``.
  // ID matches the column accessorKey which mirrors the backend field
  // name on purpose — see SORTABLE_FIELDS above.
  const sortBy =
    sorting[0] && SORTABLE_FIELDS.has(sorting[0].id)
      ? sorting[0].id
      : "event_date";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  const params = useMemo<MaterialRiskEventsParams>(
    () => ({
      window_days: windowDays,
      search: search || undefined,
      source,
      pillar,
      event_type: eventType,
      severity_min: severityMin,
      verified_only: verifiedOnly || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
      page,
      limit,
    }),
    [
      windowDays,
      search,
      source,
      pillar,
      eventType,
      severityMin,
      verifiedOnly,
      sortBy,
      sortDir,
      page,
      limit,
    ],
  );

  const { data, isLoading, isFetching, error, refetch } =
    useMaterialRiskEvents(materialId, params);

  // Source / type select options are derived from the current page slice.
  // Same trade-off as the global page: dropdown won't surface a value
  // that only exists on another page, but it keeps the selects honest
  // about what's clickable right now.  Future: a /facets endpoint if we
  // need cross-page filter discovery.
  const sourceOptions = useMemo(() => {
    const s = new Set<string>();
    data?.events.forEach((e) => e.source_system && s.add(e.source_system));
    return [...s].sort();
  }, [data]);
  const typeOptions = useMemo(() => {
    const t = new Set<string>();
    data?.events.forEach((e) => t.add(e.event_type));
    return [...t].sort();
  }, [data]);

  // ── Column defs for the shared PlatformTable ────────────────────────
  const columns = useMemo<ColumnDef<MaterialRiskEventRow, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Event",
        enableSorting: true,
        cell: ({ row }) => (
          // max-w + whitespace-normal stop the title cell from forcing
          // the table wider than its container.  Without this, the
          // ``min-w-max`` on PlatformTable's <table> grows to match the
          // longest title (GTA case titles can be 200+ chars), pushing
          // every other column off-screen on smaller viewports.  Picked
          // 480px after eyeballing typical title length — about 2 lines
          // of wrapped text at the table's font size.
          <div className="flex max-w-[400px] flex-col whitespace-normal">
            <div className="flex items-start gap-1.5">
              <span className="break-words font-medium text-foreground">
                {row.original.title}
              </span>
              {row.original.verified && (
                <CheckCircle2
                  className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-label="Verified"
                />
              )}
            </div>
            {row.original.summary && (
              <span className="line-clamp-2 break-words text-xs text-muted-foreground">
                {row.original.summary}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "event_type",
        header: "Type",
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {humanize(row.original.event_type)}
          </Badge>
        ),
      },
      {
        accessorKey: "pillars_affected",
        // Static header — pillars are an array; sorting on it isn't
        // semantically meaningful (which element would we sort on?).
        header: "Pillars",
        cell: ({ row }) =>
          row.original.pillars_affected.length === 0 ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            // max-w on the cell wrapper keeps the column tight — 3 badges
            // fit on a single line in this width, additional ones wrap to
            // a second line under them.
            <div className="flex max-w-[60px] flex-wrap gap-1">
              {row.original.pillars_affected.map((p) => {
                const d = pillarDisplay(p);
                return (
                  <span
                    key={p}
                    title={d.label}
                    className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
                    style={{
                      color: `var(${d.cssVar})`,
                      borderColor: `var(${d.cssVar})`,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={pillarBgStyle(d.cssVar)}
                    />
                    {d.short}
                  </span>
                );
              })}
            </div>
          ),
      },
      {
        accessorKey: "source_system",
        header: "Source",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.source_system ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "geography_codes",
        // Static header — same reason as Pillars: it's an array.
        header: "Geography",
        cell: ({ row }) =>
          row.original.geography_codes.length === 0 ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            // Tight max-w + slice(0, 3) keeps the column narrow; extra
            // pills collapse into a "+N" indicator.
            <div className="flex max-w-[40px] flex-wrap gap-1">
              {row.original.geography_codes.slice(0, 3).map((cc) => (
                <GeographyCodePill key={cc} code={cc} />
              ))}
              {row.original.geography_codes.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{row.original.geography_codes.length - 3}
                </span>
              )}
            </div>
          ),
      },
      {
        accessorKey: "severity_score",
        header: "Severity",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => {
          const sev = row.original.severity_score;
          if (sev == null)
            return (
              <div className="text-right text-muted-foreground/60">—</div>
            );
          const sev100 = Math.round(sev * 100);
          return (
            <div className="flex max-w-[30px] justify-end">
              <span
                className={cn(
                  "inline-block rounded border px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                  severityChipClass(sev100),
                )}
                title={`severity ${sev.toFixed(2)} / 1.0`}
              >
                {sev100}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "event_date",
        header: "Date",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div className="text-right max-w-[60px] text-xs tabular-nums text-muted-foreground">
            {row.original.event_date ? formatDate(row.original.event_date) : "—"}
          </div>
        ),
      },
    ],
    // Cells don't depend on sorting state (PlatformTable owns the
    // header chevrons now), so the column defs only re-build when the
    // component-scoped dependencies change.
    [],
  );

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const hasFilters =
    Boolean(search) ||
    Boolean(source) ||
    Boolean(pillar) ||
    Boolean(eventType) ||
    severityMin != null ||
    verifiedOnly;

  return (
    <div className="space-y-4">
      {/* ── Top row: pillar bar chart + signal summary ───────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PillarBarCard
          summary={data?.summary}
          loading={isLoading}
          materialName={materialName}
        />
        <SignalSummaryCard summary={data?.summary} loading={isLoading} />
      </div>

      {/* ── Shared filter toolbar ──────────────────────────────────── */}
      <DataTableToolbar
        actions={
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {total > 0 ? `${total.toLocaleString()} events` : ""}
          </span>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or summary…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[260px] pl-8"
          />
        </div>
        <FilterSelect
          ariaLabel="Source"
          value={source}
          onChange={setSource}
          options={sourceOptions.map((s) => ({ value: s, label: s }))}
          placeholder="All sources"
        />
        <FilterSelect
          ariaLabel="Pillar"
          value={pillar}
          onChange={setPillar}
          options={Object.entries(PILLAR_DISPLAY).map(([p, d]) => ({
            value: p,
            label: d.label,
          }))}
          placeholder="All pillars"
        />
        <FilterSelect
          ariaLabel="Event type"
          value={eventType}
          onChange={setEventType}
          options={typeOptions.map((t) => ({ value: t, label: humanize(t) }))}
          placeholder="All types"
        />
        <FilterSelect
          ariaLabel="Severity"
          value={severityMin?.toString()}
          onChange={(v) => setSeverityMin(v ? parseFloat(v) : undefined)}
          options={[
            { value: "0.75", label: "High (≥ 75)" },
            { value: "0.55", label: "Medium (≥ 55)" },
            { value: "0.35", label: "Low (≥ 35)" },
          ]}
          placeholder="Any severity"
        />
        <FilterSelect
          ariaLabel="Timeframe"
          value={windowDays.toString()}
          onChange={(v) => v && setWindowDays(parseInt(v, 10))}
          options={WINDOW_OPTIONS.map((w) => ({
            value: w.value.toString(),
            label: w.label,
          }))}
          placeholder="Timeframe"
          clearable={false}
        />
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/40"
          title="Show only events an analyst has verified"
        >
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="accent-primary"
          />
          Verified
        </label>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLocalSearch("");
              setSearch("");
              setSource(undefined);
              setPillar(undefined);
              setEventType(undefined);
              setSeverityMin(undefined);
              setVerifiedOnly(false);
              setPage(1);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </DataTableToolbar>

      {/* ── Shared PlatformTable ───────────────────────────────────── */}
      <PlatformTable
        data={events}
        columns={columns}
        isLoading={isLoading || (isFetching && events.length === 0)}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(ev) => setOpenEvent(ev)}
        emptyTitle="No events match the current filters"
        emptyDescription="Try widening the timeframe or clearing filters."
        // Sortable headers — defined per-column via ``enableSorting``
        // on the column defs; PlatformTable renders the affordances.
        // ``manualSorting`` because the backend owns the order across
        // pages, not just the current page slice.
        sorting={sorting}
        onSortingChange={setSorting}
        manualSorting
      />

      {/* ── Pagination ─────────────────────────────────────────────── */}
      <DataTablePagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {/* ── Drawer ──────────────────────────────────────────────────── */}
      <RiskEventDrawer
        event={openEvent}
        materialName={materialName}
        onClose={() => setOpenEvent(null)}
      />
    </div>
  );
}

// ── Pillar bar card ────────────────────────────────────────────────────

function PillarBarCard({
  summary,
  loading,
  materialName,
}: {
  summary: import("@/lib/types").MaterialRiskEventsSummary | undefined;
  loading: boolean;
  materialName: string;
}) {
  const total = summary?.total_events ?? 0;
  const max = useMemo(() => {
    if (!summary) return 0;
    return Math.max(0, ...Object.values(summary.events_by_pillar));
  }, [summary]);

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Events by pillar affected"
        subtitle={
          loading
            ? "…"
            : `${total} event${total === 1 ? "" : "s"} linked to ${materialName} · ${
                summary ? windowLabel(summary.window_days).toLowerCase() : ""
              }`
        }
      />
      <PlatformCardBody>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </div>
        ) : !summary || summary.total_events === 0 ? (
          <p className="text-[11px] italic text-muted-foreground">
            No events in this window — try widening the timeframe.
          </p>
        ) : (
          <div className="space-y-2">
            {/*
              Only render pillars that have at least one event in this
              window.  Material Concentration and Operational pillars
              score from derived inputs (criticality signals, facility
              status) — not event tags — so they'd show 0 here even when
              the pillar has a meaningful score.  Showing "0" would
              wrongly imply "no coverage" when those pillars are in fact
              fully scored, just by a different mechanism.  The footnote
              below explains the absence so the analyst doesn't read it
              as a data gap.
            */}
            {Object.entries(PILLAR_DISPLAY)
              .filter(([slug]) => (summary.events_by_pillar[slug] ?? 0) > 0)
              .sort(
                (a, b) =>
                  (summary.events_by_pillar[b[0]] ?? 0) -
                  (summary.events_by_pillar[a[0]] ?? 0),
              )
              .map(([slug, d]) => {
                const count = summary.events_by_pillar[slug] ?? 0;
                const pct = max > 0 ? (count / max) * 100 : 0;
                return (
                  <div key={slug} className="space-y-0.5">
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span
                        className="font-medium"
                        style={pillarTextStyle(d.cssVar)}
                      >
                        • {d.label}
                      </span>
                      <span className="tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `var(${d.cssVar})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            <p className="mt-3 text-[10px] leading-snug text-muted-foreground">
              Material concentration and Operational pillars score from
              derived inputs (criticality signals, facility status) rather
              than event records, so they don&apos;t appear here even when
              their scores are meaningful — check the Country scores tab to
              see how they break down.
            </p>
          </div>
        )}
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ── Signal summary card ────────────────────────────────────────────────

function SignalSummaryCard({
  summary,
  loading,
}: {
  summary: import("@/lib/types").MaterialRiskEventsSummary | undefined;
  loading: boolean;
}) {
  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Signal summary"
        subtitle={
          loading
            ? "…"
            : summary
              ? windowLabel(summary.window_days)
              : "—"
        }
      />
      <PlatformCardBody>
        <div className="grid grid-cols-3 gap-3">
          <KpiTile
            label="Total events"
            value={loading ? null : summary?.total_events}
            tone="neutral"
          />
          <KpiTile
            label="High severity"
            value={loading ? null : summary?.high_severity_count}
            tone={
              (summary?.high_severity_count ?? 0) > 0 ? "alert" : "neutral"
            }
          />
          <KpiTile
            label="Verified"
            value={loading ? null : summary?.verified_count}
            tone="neutral"
          />
        </div>
        <p className="mt-3 text-[10px] leading-snug text-muted-foreground">
          Events feed the material&apos;s pillar scores. Filter below by source,
          pillar, type, or timeframe to audit which signals drive the current
          risk reading.
        </p>
      </PlatformCardBody>
    </PlatformCard>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null | undefined;
  tone: "neutral" | "alert";
}) {
  return (
    <div className="rounded-md border border-border bg-card p-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "alert" && (value ?? 0) > 0
            ? "text-red-600 dark:text-red-400"
            : "text-foreground",
        )}
      >
        {value == null ? "—" : value}
      </div>
    </div>
  );
}

// ── Filter select ──────────────────────────────────────────────────────

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  clearable = true,
}: {
  ariaLabel: string;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  clearable?: boolean;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {clearable && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────

function RiskEventDrawer({
  event,
  materialName,
  onClose,
}: {
  event: MaterialRiskEventRow | null;
  materialName: string;
  onClose: () => void;
}) {
  const open = event != null;
  return (
    <SideSheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SideSheetContent>
        {event && (
          <DrawerInner
            event={event}
            materialName={materialName}
            onClose={onClose}
          />
        )}
      </SideSheetContent>
    </SideSheet>
  );
}

function DrawerInner({
  event,
  materialName,
}: {
  event: MaterialRiskEventRow;
  materialName: string;
  onClose: () => void;
}) {
  const sev = event.severity_score ?? 0;
  const sev100 = Math.round(sev * 100);
  const conf100 =
    event.confidence_score == null ? null : Math.round(event.confidence_score * 100);
  return (
    <div className="flex h-full flex-col">
      {/* DialogContent ships with its own absolutely-positioned X close
          button (see components/ui/dialog.tsx) — no need to render one
          here. */}

      {/* ── Header: title + chip row ─────────────────────────────── */}
      <div className="px-6 pb-4 pt-6">
        {/*
          Using DialogTitle (Radix primitive) here so the dialog is
          accessible without an extra eyebrow label — the event title
          itself is the title.  shadcn's DialogTitle renders as an h2
          and we override styling inline; the underlying Radix primitive
          announces it correctly to screen readers.
        */}
        <DialogTitle asChild>
          <h2 className="pr-8 text-[18px] font-bold leading-snug text-foreground">
            {event.title}
          </h2>
        </DialogTitle>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded border border-border bg-card px-2 py-0.5 text-[11px] text-foreground">
            {event.event_subtype
              ? `${humanize(event.event_type)} · ${humanize(event.event_subtype)}`
              : humanize(event.event_type)}
          </span>
          {event.verified && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          )}
          {event.event_date && (
            <span className="ml-auto text-[11px] text-muted-foreground">
              {formatDate(event.event_date)}
            </span>
          )}
        </div>
      </div>

      {/* ── Score cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 px-6 pb-5">
        <ScoreCard
          label="Severity"
          value={sev100}
          band={severityBand(sev100)}
          useBandBar
        />
        <ScoreCard
          label="Confidence"
          value={conf100}
          band={confidenceBand(conf100 ?? 0)}
          // Confidence bar stays neutral-accent regardless of the band so
          // the eye doesn't read it as "confidence colour-codes risk" —
          // the band label still text-colours appropriately.
          useBandBar={false}
        />
      </div>

      {/* ── Summary ──────────────────────────────────────────────── */}
      {event.summary && (
        <div className="px-6 pb-5 text-[13px] leading-relaxed text-foreground">
          {event.summary}
        </div>
      )}

      {/* ── Provenance ───────────────────────────────────────────── */}
      <div className="px-6 pb-2">
        <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Provenance
        </h3>
        <dl className="divide-y divide-border">
          <ProvenanceRow
            icon={<Shield className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label="Source"
            value={event.source_system ?? "—"}
          />
          <ProvenanceRow
            icon={<BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label="Pillar affected"
            value={
              event.pillars_affected.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-col gap-0.5">
                  {event.pillars_affected.map((p) => {
                    const d = pillarDisplay(p);
                    return (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1.5"
                        style={pillarTextStyle(d.cssVar)}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={pillarBgStyle(d.cssVar)}
                        />
                        {d.label}
                      </span>
                    );
                  })}
                </div>
              )
            }
          />
          <ProvenanceRow
            icon={<FlagIcon className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label="Geography"
            value={
              event.geography_codes.length === 0 ? (
                "—"
              ) : (
                <div className="flex flex-wrap gap-1">
                  {event.geography_codes.map((cc) => (
                    <GeographyCodePill key={cc} code={cc} />
                  ))}
                </div>
              )
            }
          />
          <ProvenanceRow
            icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />}
            label="Event type"
            value={
              event.event_subtype
                ? `${humanize(event.event_type)} · ${humanize(event.event_subtype)}`
                : humanize(event.event_type)
            }
          />
          {/*
            "Detected" mirrors event_date for now — the platform doesn't
            yet surface a separate ingestion timestamp through this
            schema.  If/when needed, add `created_at` to
            MaterialRiskEventRow and plumb it through; "Detected" should
            then point at ingestion time, with event_date staying in the
            header row above.
          */}
          {event.event_date && (
            <ProvenanceRow
              icon={<Bell className="h-3.5 w-3.5" strokeWidth={1.5} />}
              label="Detected"
              value={formatDate(event.event_date)}
            />
          )}
        </dl>
      </div>

      {/* ── Pillar callout ───────────────────────────────────────── */}
      {event.pillars_affected.length > 0 && (
        <div className="mx-6 my-4 flex items-start gap-3 rounded-md bg-muted/50 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
          <Scale
            className="mt-0.5 h-4 w-4 shrink-0"
            strokeWidth={1.75}
            style={{ color: "var(--p-pillar-regulatory)" }}
          />
          <p>
            This event feeds the{" "}
            <span className="font-medium">
              {event.pillars_affected
                .map((p) => pillarDisplay(p).label.toLowerCase())
                .join(", ")}{" "}
              pillar{event.pillars_affected.length > 1 ? "s" : ""}
            </span>{" "}
            for {materialName}. Severity and confidence are weighted into the
            material&apos;s composite risk score on the next scoring run.
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-6 py-3">
        {event.source_url ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View source
            </a>
          </Button>
        ) : (
          <span className="text-[11px] italic text-muted-foreground">
            No source URL captured
          </span>
        )}
        <FlagEntityButton
          entityType="risk_event"
          entityId={String(event.id)}
          entityLabel={event.title}
          buttonLabel="Flag issue"
        />
      </div>
    </div>
  );
}

function ProvenanceRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 text-[12px]">
      <div className="flex w-32 shrink-0 items-start gap-2 pt-0.5 text-muted-foreground">
        <span className="shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex-1 text-foreground">{value}</div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  band,
  useBandBar,
}: {
  label: string;
  value: number | null;
  band: { label: string; colorClass: string; barClass: string };
  /** When true, fill the bar with the band colour (e.g. severity); when
   * false, use the neutral platform accent (e.g. confidence). */
  useBandBar: boolean;
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-md border border-border bg-card p-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={cn("text-[28px] font-bold leading-none tabular-nums", band.colorClass)}>
          {value == null ? "—" : value}
        </span>
        <span className="text-[11px] text-muted-foreground">/ 100</span>
        <span className={cn("ml-auto text-[12px] font-medium", band.colorClass)}>
          {value == null ? "" : band.label}
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted">
        {useBandBar ? (
          <div
            className={cn("h-full rounded-full", band.barClass)}
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: "var(--p-accent)" }}
          />
        )}
      </div>
    </div>
  );
}

function severityBand(score: number) {
  if (score >= 75)
    return {
      label: "High",
      colorClass: "text-red-600 dark:text-red-400",
      barClass: "bg-red-500 dark:bg-red-400",
    };
  if (score >= 55)
    return {
      label: "Medium-high",
      colorClass: "text-orange-600 dark:text-orange-400",
      barClass: "bg-orange-500 dark:bg-orange-400",
    };
  if (score >= 35)
    return {
      label: "Medium",
      colorClass: "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500 dark:bg-amber-400",
    };
  return {
    label: "Low",
    colorClass: "text-emerald-600 dark:text-emerald-400",
    barClass: "bg-emerald-500 dark:bg-emerald-400",
  };
}

function confidenceBand(score: number) {
  if (score >= 75)
    return {
      label: "High",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      barClass: "bg-emerald-500 dark:bg-emerald-400",
    };
  if (score >= 50)
    return {
      label: "Medium",
      colorClass: "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500 dark:bg-amber-400",
    };
  return {
    label: "Low",
    colorClass: "text-muted-foreground",
    barClass: "bg-muted-foreground",
  };
}
