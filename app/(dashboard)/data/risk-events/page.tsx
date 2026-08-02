"use client";

/**
 * Risk-events triage queue.
 *
 * The ingest pipeline is inverted here: the machine proposes, a human
 * disposes. Ingesters attach suggestions — pillar, entity links, type,
 * weight — and nothing is authoritative until it passes through this queue.
 *
 * Consequences that shape the screen:
 * · The default view is the QUEUE (pending_triage), not everything.
 * · Suggestions are visibly provisional: a suggested pillar reads differently
 *   from a confirmed one, because the difference decides whether it scores.
 * · Confirming a whole event unchanged is one action ("Accept all").
 * · Every decision reverses. Un-approve and un-dismiss are first-class.
 * · Operational news candidates cannot be approved directly — approval
 *   supplies subtype and severity via the promote dialog.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { CheckCircle2, Inbox, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { PlatformTable } from "@/components/platform/platform-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { CategoryCell, PILLAR_ORDER, PILLARS } from "@/components/triage/category-cell";
import { EventTriageDrawer } from "@/components/triage/event-triage-drawer";
import { LinksCell } from "@/components/triage/links-cell";
import { PromoteOperationalDialog } from "@/components/triage/promote-operational-dialog";
import { QualityDefectChips } from "@/components/triage/quality-defect-chips";
import { QueueSummaryCard } from "@/components/triage/queue-summary-card";
import { TriageStatusControl } from "@/components/triage/triage-status-control";
import {
  acceptSuggestions,
  getTriageEvent,
  setLinkStatus,
  setPrimaryCategory,
  setTriageStatus,
  type LinkStatus,
  type TriageEvent,
  type TriageListParams,
  type TriageStatus,
} from "@/lib/api/triage";
import { useTriageApi, useTriageEvents, useTriageSummary } from "@/lib/hooks/use-triage";
import { formatDate, humanize } from "@/lib/utils/format";

const DEFAULT_LIMIT = 25;

/* constants.POSITIVE_EVENT_SUBTYPES (backend) — refused for promotion: they
   are excluded from risk arithmetic at read time, so an approved positive
   would look promoted and contribute nothing. */
const POSITIVE_SUBTYPES = [
  "POSITIVE_POLICY",
  "restart",
  "expansion",
  "guidance_raise",
];

function isPositiveDirection(e: TriageEvent): boolean {
  return e.event_subtype != null && POSITIVE_SUBTYPES.includes(e.event_subtype);
}

const STATUS_OPTIONS: Array<{ value: TriageStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "pending_triage", label: "Pending triage" },
  { value: "scoring", label: "Scoring" },
  { value: "display_only", label: "Display only" },
  { value: "rejected", label: "Dismissed" },
];

const SEVERITY_OPTIONS = [
  { value: "0.75", label: "High (≥ 75)" },
  { value: "0.55", label: "Medium (≥ 55)" },
  { value: "0.35", label: "Low (≥ 35)" },
];

const DIRECTION_OPTIONS = [
  { value: "restrictive", label: "Restrictive" },
  { value: "supportive", label: "Supportive" },
  { value: "neutral", label: "Neutral" },
];

const DEFECT_OPTIONS = [
  { value: "truncated_summary", label: "Truncated summary" },
  { value: "future_date", label: "Future date" },
  { value: "no_provenance", label: "No provenance" },
  { value: "no_source_url", label: "No source URL" },
  { value: "needs_material_review", label: "Needs material review" },
];

const SORTABLE = new Set(["event_date", "severity_score", "triage_status"]);

interface Filters {
  search: string;
  status: TriageStatus | "";
  pillar: string;
  direction: string;
  source: string;
  eventType: string;
  severityMin: string;
  defect: string;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  status: "pending_triage",
  pillar: "",
  direction: "",
  source: "",
  eventType: "",
  severityMin: "",
  defect: "",
};

function SeverityScoreChip({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span
        style={{ fontSize: "var(--p-text-xs, 12px)", color: "var(--p-text-faint)" }}
      >
        —
      </span>
    );
  }
  const band =
    score >= 0.7
      ? {
          background: "var(--p-risk-high-soft)",
          color: "#9A3412",
          border: "rgba(234, 88, 12, 0.3)",
        }
      : score >= 0.5
        ? {
            background: "var(--p-risk-mod-soft)",
            color: "#92400E",
            border: "rgba(217, 119, 6, 0.3)",
          }
        : {
            background: "var(--p-risk-low-soft)",
            color: "#065F46",
            border: "rgba(5, 150, 105, 0.3)",
          };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "var(--p-badge-h, 20px)",
        padding: "0 7px",
        borderRadius: 3,
        fontSize: "var(--p-text-2xs, 11px)",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        background: band.background,
        color: band.color,
        border: "1px solid " + band.border,
      }}
    >
      {Math.round(score * 100)}
    </span>
  );
}

function StatusPillGroup({
  value,
  onChange,
}: {
  value: TriageStatus | "";
  onChange: (next: TriageStatus | "") => void;
}) {
  return (
    <div
      role="group"
      aria-label="Triage status"
      style={{
        display: "inline-flex",
        borderRadius: "var(--p-radius-md)",
        border: "1px solid var(--p-border)",
        overflow: "hidden",
      }}
    >
      {STATUS_OPTIONS.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={{
              height: 32,
              padding: "0 10px",
              border: "none",
              borderRight:
                i === STATUS_OPTIONS.length - 1
                  ? "none"
                  : "1px solid var(--p-border)",
              background: on ? "var(--p-bg-muted)" : "var(--p-card)",
              color: on ? "var(--p-text)" : "var(--p-text-muted)",
              fontFamily: "var(--p-font-sans)",
              fontSize: "var(--p-text-xs, 12px)",
              fontWeight: on ? 600 : 500,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "background var(--p-dur, 120ms) var(--p-ease, ease)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Radix Select cannot carry an empty-string item value, so "" maps to "all". */
function FacetSelect({
  value,
  onChange,
  allLabel,
  options,
  width = 150,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  allLabel: string;
  options: Array<{ value: string; label: string }>;
  width?: number;
  ariaLabel: string;
}) {
  return (
    <Select
      value={value === "" ? "all" : value}
      onValueChange={(v) => onChange(v === "all" ? "" : v)}
    >
      <SelectTrigger
        className="h-9"
        style={{ width }}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function RiskEventsTriagePage() {
  const api = useTriageApi();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [localSearch, setLocalSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [openEvent, setOpenEvent] = useState<TriageEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<TriageEvent | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const setFilter = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  // Debounced search, matching the old page's 300ms pattern.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => {
        if (f.search === localSearch) return f;
        setPage(1);
        return { ...f, search: localSearch };
      });
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch]);

  const sortId = sorting[0]?.id;
  const sortParam = sortId && SORTABLE.has(sortId)
    ? (sortId as NonNullable<TriageListParams["sort"]>)
    : undefined;

  const apiParams = useMemo<TriageListParams>(
    () => ({
      page,
      limit,
      status: filters.status || undefined,
      search: filters.search || undefined,
      pillar: filters.pillar || undefined,
      direction: filters.direction || undefined,
      source: filters.source || undefined,
      event_type: filters.eventType || undefined,
      severity_min: filters.severityMin ? Number(filters.severityMin) : undefined,
      defect: filters.defect || undefined,
      sort: sortParam,
    }),
    [page, limit, filters, sortParam],
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: refetchList,
  } = useTriageEvents(apiParams);
  const { data: summary, refetch: refetchSummary } = useTriageSummary();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  // Facet options accumulate across loads so a selected value never vanishes
  // from its own select while the filtered list omits it.
  const [sourceOptions, setSourceOptions] = useState<string[]>([]);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);
  useEffect(() => {
    const items = data?.items ?? [];
    const merge = (prev: string[], next: Array<string | null>) => {
      const set = new Set(prev);
      for (const v of next) if (v) set.add(v);
      const merged = [...set].sort();
      return merged.length === prev.length ? prev : merged;
    };
    setSourceOptions((prev) => merge(prev, items.map((e) => e.source_system)));
    setTypeOptions((prev) => merge(prev, items.map((e) => e.event_type)));
  }, [data]);

  // Ref mirror of the open drawer event id, so refreshAfterMutation can stay
  // identity-stable while still knowing whether the drawer copy needs a
  // refresh (the mutated row may have left the filtered list entirely).
  const openEventIdRef = useRef<number | null>(null);
  useEffect(() => {
    openEventIdRef.current = openEvent?.id ?? null;
  }, [openEvent]);

  const refreshAfterMutation = useCallback(
    async (eventId?: number) => {
      await Promise.all([refetchList(), refetchSummary()]);
      if (eventId != null && openEventIdRef.current === eventId) {
        try {
          const fresh = await getTriageEvent(api, eventId);
          setOpenEvent((c) => (c?.id === eventId ? fresh : c));
        } catch {
          // Keep the stale drawer copy; the list refetch already succeeded.
        }
      }
    },
    [api, refetchList, refetchSummary],
  );

  const runMutation = useCallback(
    async (eventId: number, fn: () => Promise<unknown>) => {
      setPendingId(eventId);
      setActionError(null);
      try {
        await fn();
        await refreshAfterMutation(eventId);
      } catch (err: unknown) {
        setActionError(
          err instanceof Error ? err.message : "The change was not saved",
        );
      } finally {
        setPendingId(null);
      }
    },
    [refreshAfterMutation],
  );

  const handleStatus = useCallback(
    (ev: TriageEvent, next: TriageStatus) => {
      /* Approving an operational news candidate must supply subtype and
         severity — route through the promote dialog instead of the plain
         status transition. */
      if (next === "scoring" && ev.event_type === "operational_news_candidate") {
        setPromoteTarget(ev);
        return;
      }
      void runMutation(ev.id, () => setTriageStatus(api, ev.id, next));
    },
    [api, runMutation],
  );

  const handleAccept = useCallback(
    (eventId: number) => {
      void runMutation(eventId, () => acceptSuggestions(api, eventId));
    },
    [api, runMutation],
  );

  const handleCategory = useCallback(
    (eventId: number, category: string) => {
      void runMutation(eventId, () => setPrimaryCategory(api, eventId, category));
    },
    [api, runMutation],
  );

  const handleLinkStatus = useCallback(
    (linkId: number, next: LinkStatus) => {
      const ev = openEvent;
      if (!ev) return;
      void runMutation(ev.id, () => setLinkStatus(api, linkId, next));
    },
    [api, openEvent, runMutation],
  );

  const openDrawer = useCallback((ev: TriageEvent) => {
    setOpenEvent(ev);
    setDrawerOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<TriageEvent, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Event",
        enableSorting: false,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                maxWidth: 360,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ fontWeight: 500, textWrap: "pretty" }}>
                  {e.title}
                </span>
                {e.verified && (
                  <span
                    title="Verified — approval marked this event verified in the same write"
                    style={{
                      display: "inline-flex",
                      flexShrink: 0,
                      marginTop: 2,
                      color: "var(--p-risk-low)",
                    }}
                  >
                    <CheckCircle2 size={13} strokeWidth={2.25} />
                  </span>
                )}
              </div>
              {e.summary && (
                <span
                  style={{
                    fontSize: "var(--p-text-xs, 12px)",
                    lineHeight: 1.45,
                    color: "var(--p-text-muted)",
                    textWrap: "pretty",
                  }}
                >
                  {e.summary}
                </span>
              )}
              <QualityDefectChips defects={e.quality_defects} />
            </div>
          );
        },
      },
      {
        id: "category",
        header: "Scoring pillar",
        cell: ({ row }) => <CategoryCell event={row.original} />,
      },
      {
        id: "links",
        header: "Entity links",
        cell: ({ row }) => <LinksCell links={row.original.links} />,
      },
      {
        accessorKey: "source_system",
        header: "Source",
        enableSorting: false,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {e.source_system ? (
                <Badge variant="outline">{e.source_system}</Badge>
              ) : (
                <span
                  style={{
                    fontSize: "var(--p-text-xs, 12px)",
                    fontStyle: "italic",
                    color: "var(--p-text-faint)",
                  }}
                >
                  uncredited
                </span>
              )}
              {e.geography_primary && (
                <span style={{ fontSize: 10, color: "var(--p-text-faint)" }}>
                  {e.geography_primary}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "severity_score",
        header: "Severity",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <SeverityScoreChip score={row.original.severity_score} />
          </div>
        ),
      },
      {
        accessorKey: "event_date",
        header: "Date",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span
                style={{
                  fontSize: "var(--p-text-xs, 12px)",
                  fontVariantNumeric: "tabular-nums",
                  color: e.quality_defects.includes("future_date")
                    ? "var(--p-risk-crit)"
                    : "var(--p-text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {e.event_date ? formatDate(e.event_date) : "—"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "triage_status",
        header: "Decision",
        enableSorting: true,
        meta: { align: "right" },
        cell: ({ row }) => {
          const e = row.original;
          const hasSuggestion =
            e.suggested_category != null ||
            e.links.some((l) => l.status === "suggested");
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 6,
              }}
              onClick={(ev) => ev.stopPropagation()}
            >
              {e.triage_status === "pending_triage" && hasSuggestion && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === e.id}
                  title="Accept all suggestions — confirm the suggested pillar and links in one action"
                  onClick={() => handleAccept(e.id)}
                >
                  Accept all
                </Button>
              )}
              <TriageStatusControl
                status={e.triage_status}
                size="sm"
                pending={pendingId === e.id}
                disallow={isPositiveDirection(e) ? ["scoring"] : undefined}
                disallowReason="Positive-direction event — excluded from risk arithmetic, so approving would have no effect"
                onChange={(next) => handleStatus(e, next)}
              />
            </div>
          );
        },
      },
    ],
    [pendingId, handleAccept, handleStatus],
  );

  const dirty =
    localSearch !== "" ||
    (Object.keys(INITIAL_FILTERS) as Array<keyof Filters>).some(
      (k) => filters[k] !== INITIAL_FILTERS[k],
    );

  const pendingCount = summary?.pending_triage ?? 0;

  return (
    <PageLayout>
      <PageHeader
        title="Risk Events"
        subtitle="Triage queue. The ingest engine proposes a pillar and entity links; nothing scores until an analyst confirms, corrects, or dismisses it."
      />

      {summary && (
        <QueueSummaryCard
          summary={summary}
          active={filters.status}
          onFilter={(s) => {
            setFilters({ ...INITIAL_FILTERS, status: s });
            setLocalSearch("");
            setPage(1);
          }}
        />
      )}

      <DataTableToolbar
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: "var(--p-text-xs, 12px)",
                color: "var(--p-text-muted)",
              }}
            >
              {total.toLocaleString()} events
            </span>
            {pendingCount > 0 && filters.status !== "pending_triage" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({ ...INITIAL_FILTERS, status: "pending_triage" });
                  setLocalSearch("");
                  setPage(1);
                }}
              >
                <Inbox className="h-3.5 w-3.5" />
                {pendingCount} pending
              </Button>
            )}
          </div>
        }
      >
        <StatusPillGroup
          value={filters.status}
          onChange={(v) => setFilter({ status: v })}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or summary..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-9 w-[210px] pl-8"
          />
        </div>
        <FacetSelect
          ariaLabel="Scoring pillar"
          allLabel="All pillars"
          width={160}
          value={filters.pillar}
          onChange={(v) => setFilter({ pillar: v })}
          options={PILLAR_ORDER.map((p) => ({
            value: p,
            label: PILLARS[p]?.label ?? humanize(p),
          }))}
        />
        <FacetSelect
          ariaLabel="Direction"
          allLabel="All directions"
          width={140}
          value={filters.direction}
          onChange={(v) => setFilter({ direction: v })}
          options={DIRECTION_OPTIONS}
        />
        <FacetSelect
          ariaLabel="Source"
          allLabel="All sources"
          width={140}
          value={filters.source}
          onChange={(v) => setFilter({ source: v })}
          options={sourceOptions.map((s) => ({ value: s, label: s }))}
        />
        <FacetSelect
          ariaLabel="Event type"
          allLabel="All types"
          width={150}
          value={filters.eventType}
          onChange={(v) => setFilter({ eventType: v })}
          options={typeOptions.map((t) => ({ value: t, label: humanize(t) }))}
        />
        <FacetSelect
          ariaLabel="Minimum severity"
          allLabel="Any severity"
          width={145}
          value={filters.severityMin}
          onChange={(v) => setFilter({ severityMin: v })}
          options={SEVERITY_OPTIONS}
        />
        <FacetSelect
          ariaLabel="Quality defects"
          allLabel="All defects"
          width={165}
          value={filters.defect}
          onChange={(v) => setFilter({ defect: v })}
          options={DEFECT_OPTIONS}
        />
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setLocalSearch("");
              setSorting([]);
              setPage(1);
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </DataTableToolbar>

      {actionError && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
            borderRadius: "var(--p-radius-md)",
            border: "1px solid rgba(225, 29, 72, 0.25)",
            background: "var(--p-risk-crit-soft)",
            padding: "8px 12px",
            fontSize: "var(--p-text-xs, 12px)",
            color: "#9F1239",
          }}
        >
          <span>{actionError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setActionError(null)}
            style={{
              display: "inline-flex",
              border: "none",
              background: "transparent",
              color: "#9F1239",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <PlatformTable
        data={rows}
        columns={columns}
        isLoading={isLoading || (isFetching && rows.length === 0)}
        error={error}
        onRetry={() => void refetchList()}
        onRowClick={openDrawer}
        sorting={sorting}
        onSortingChange={(updater) => {
          setSorting(updater);
          setPage(1);
        }}
        manualSorting
        emptyTitle={
          filters.status === "pending_triage"
            ? "Nothing left in the queue"
            : "No events match the current filters"
        }
        emptyDescription={
          filters.status === "pending_triage"
            ? "Every event in this filter set has been triaged. Switch to All to review past decisions."
            : "Try widening the severity threshold or clearing filters."
        }
      />

      <DataTablePagination
        page={page}
        limit={data?.limit ?? limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <EventTriageDrawer
        open={drawerOpen}
        event={openEvent}
        pending={openEvent != null && pendingId === openEvent.id}
        disallowScoring={openEvent != null && isPositiveDirection(openEvent)}
        onClose={() => setDrawerOpen(false)}
        onStatus={(id, next) => {
          const ev =
            openEvent?.id === id ? openEvent : rows.find((r) => r.id === id);
          if (ev) handleStatus(ev, next);
        }}
        onCategory={handleCategory}
        onLinkStatus={handleLinkStatus}
        onAccept={handleAccept}
        onFlagged={() => void refreshAfterMutation(openEvent?.id)}
      />

      <PromoteOperationalDialog
        open={promoteTarget != null}
        event={promoteTarget}
        onClose={() => setPromoteTarget(null)}
        onPromoted={() => void refreshAfterMutation(promoteTarget?.id)}
      />
    </PageLayout>
  );
}
