"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PlatformTable } from "@/components/platform/platform-table";
import { ReviewStatusBadge } from "@/components/shared/review-status-badge";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCompanyEvents } from "@/lib/hooks/use-companies";
import { useSetEventReviewStatus } from "@/lib/hooks/use-event-review";
import type { CompanyEventRead } from "@/lib/types";
import type { ReviewStatus } from "@/lib/api/events";
import { formatDate, formatNumber, humanize } from "@/lib/utils/format";

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function EventsSection({ companyId }: { companyId: string }) {
  const [selected, setSelected] = useState<CompanyEventRead | null>(null);
  const { data = [], isLoading, error, refetch } = useCompanyEvents(companyId, {
    limit: 100,
  });

  const columns = useMemo<ColumnDef<CompanyEventRead, unknown>[]>(
    () => [
      {
        accessorKey: "event_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.event_date),
      },
      {
        accessorKey: "event_type",
        header: "Type",
        cell: ({ row }) => humanize(row.original.event_type),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.title}</span>
            {row.original.summary && (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {row.original.summary}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "severity_score",
        header: () => <div className="text-right">Severity</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.severity_score, 1)}
          </div>
        ),
      },
      {
        accessorKey: "relevance_score",
        header: () => <div className="text-right">Relevance</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono">
            {formatNumber(row.original.relevance_score, 2)}
          </div>
        ),
      },
      {
        id: "review",
        header: "Review",
        cell: ({ row }) => (
          <ReviewStatusBadge status={row.original.review_status ?? "pending"} />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PlatformTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={setSelected}
        emptyTitle="No linked risk events"
      />
      <EventTriageSideSheet
        companyId={companyId}
        event={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Triage side sheet
// ---------------------------------------------------------------------------

const STATUS_BUTTON_CONFIG: {
  status: ReviewStatus;
  label: string;
  activeClass: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    activeClass:
      "border-muted-foreground/40 bg-muted text-muted-foreground",
  },
  {
    status: "confirmed",
    label: "Confirm relevant",
    activeClass:
      "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  {
    status: "excluded",
    label: "Exclude from score",
    activeClass:
      "border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
  },
];

function EventTriageSideSheet({
  companyId,
  event,
  open,
  onOpenChange,
}: {
  companyId: string;
  event: CompanyEventRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draftNote, setDraftNote] = useState<string>("");
  const reviewMutation = useSetEventReviewStatus(companyId, {
    onSuccess: () => onOpenChange(false),
  });

  // Reset draft note when a different event is opened
  const currentStatus = event?.review_status ?? "pending";
  const currentNote = event?.review_note ?? "";

  function handleSetStatus(newStatus: ReviewStatus) {
    if (!event?.event_link_id) return;
    reviewMutation.mutate({
      eventLinkId: event.event_link_id,
      review_status: newStatus,
      review_note: draftNote || null,
    });
  }

  return (
    <SideSheet open={open} onOpenChange={onOpenChange}>
      <SideSheetContent>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>{event?.title ?? "Event details"}</DialogTitle>
            <DialogDescription>
              Review this event&apos;s relevance to this company and set triage status.
            </DialogDescription>
          </DialogHeader>

          {/* Current status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current status:</span>
            <ReviewStatusBadge status={currentStatus} />
          </div>

          {/* Event detail grid */}
          {event ? (
            <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm">
              <KeyValue label="Event type" value={humanize(event.event_type)} />
              <KeyValue label="Date" value={formatDate(event.event_date)} />
              <KeyValue
                label="Severity"
                value={
                  <span className="font-mono">
                    {formatNumber(event.severity_score, 2)}
                  </span>
                }
              />
              <KeyValue
                label="Confidence"
                value={
                  <span className="font-mono">
                    {formatNumber(event.confidence_score, 2)}
                  </span>
                }
              />
              <KeyValue
                label="Relevance score"
                value={
                  <span className="font-mono">
                    {formatNumber(event.relevance_score, 2)}
                  </span>
                }
              />
              <KeyValue
                label="Match reason"
                value={event.match_reason ? humanize(event.match_reason) : "—"}
              />
              {event.summary && (
                <KeyValue label="Summary" value={event.summary} />
              )}
            </div>
          ) : null}

          <Separator />

          {/* Prior review note (read-only) */}
          {currentNote && currentStatus !== "pending" && (
            <div className="rounded-md border bg-muted/10 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Previous review note
              </p>
              <p className="whitespace-pre-wrap">{currentNote}</p>
            </div>
          )}

          {/* New note input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Review note{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Why is this event relevant or irrelevant for this company?"
              rows={3}
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Triage action buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Set review status</p>
            <div className="flex flex-col gap-2">
              {STATUS_BUTTON_CONFIG.map(({ status, label, activeClass }) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  disabled={
                    reviewMutation.isPending || !event?.event_link_id
                  }
                  className={
                    currentStatus === status ? activeClass : undefined
                  }
                  onClick={() => handleSetStatus(status)}
                >
                  {label}
                  {currentStatus === status && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      ← current
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Pending and confirmed events both count toward the company score.
              Excluded events are filtered out of all scoring runs.
            </p>
          </div>
        </div>
      </SideSheetContent>
    </SideSheet>
  );
}

// ---------------------------------------------------------------------------
// Shared layout helper
// ---------------------------------------------------------------------------

function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-start gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words font-medium">{value}</span>
    </div>
  );
}
