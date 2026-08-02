"use client";

/**
 * Event triage drawer — the full decision surface for one event.
 *
 * Triage v1 edits category, links and status only. Event type, relevance
 * weights and severity are shown but locked, and say so rather than looking
 * inert for no reason.
 *
 * Operational promotion has no separate verification gate: promoting sets
 * triage_status='scoring' AND verified=True in the same write, so approving
 * IS verifying. Positive-direction events are refused for promotion — they
 * are excluded from risk arithmetic at read time, so an approved positive
 * would look promoted and contribute nothing (the page computes
 * `disallowScoring` from the event subtype and passes it down).
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Flag,
  Lock,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { EventStatusBadge } from "@/components/triage/event-status-badge";
import { TriageStatusControl } from "@/components/triage/triage-status-control";
import { SuggestedLinkRow } from "@/components/triage/suggested-link-row";
import { QualityDefectChips } from "@/components/triage/quality-defect-chips";
import {
  PILLAR_ORDER,
  PillarChip,
  pillarMeta,
} from "@/components/triage/category-cell";
import {
  flagEvent,
  getDuplicateHints,
  type DuplicateHints,
  type LinkStatus,
  type TriageEvent,
  type TriageStatus,
} from "@/lib/api/triage";
import { useTriageApi } from "@/lib/hooks/use-triage";
import { formatDate, humanize } from "@/lib/utils/format";

const sectionLabel: CSSProperties = {
  margin: 0,
  fontSize: 10.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--p-text-muted)",
};

const microLabel: CSSProperties = {
  fontSize: 9.5,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--p-text-faint)",
};

function SeverityChip({ score }: { score: number | null }) {
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
      title={"Severity " + Math.round(score * 100) + " / 100 — machine-assigned"}
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

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  return (
    <span
      title="Machine confidence in the extraction"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: "var(--p-badge-h, 20px)",
        padding: "0 7px",
        borderRadius: 3,
        border: "1px solid var(--p-border)",
        background: "var(--p-card)",
        fontFamily: "var(--p-font-mono)",
        fontSize: "var(--p-text-2xs, 11px)",
        fontVariantNumeric: "tabular-nums",
        color: "var(--p-text-muted)",
        lineHeight: 1,
      }}
    >
      {Math.round(value * 100)}%
    </span>
  );
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: "var(--p-radius-md)",
        border: "1px solid var(--p-border)",
        background: "var(--p-bg-subtle)",
        padding: "10px 12px",
        fontSize: "var(--p-text-xs, 12px)",
        lineHeight: 1.5,
        color: "var(--p-text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function LockedField({
  label,
  value,
  why,
}: {
  label: string;
  value: ReactNode;
  why: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "10px 0",
        borderTop: "1px solid var(--p-rule)",
        fontSize: "var(--p-text-xs, 12px)",
      }}
    >
      <span style={{ flexShrink: 0, width: 116, color: "var(--p-text-muted)" }}>
        {label}
      </span>
      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--p-text)",
        }}
      >
        {value}
        <span
          title={why}
          style={{
            display: "inline-flex",
            color: "var(--p-text-faint)",
            cursor: "help",
          }}
        >
          <Lock size={11} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

function ProvenanceRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "8px 0",
        borderTop: "1px solid var(--p-rule)",
        fontSize: "var(--p-text-xs, 12px)",
      }}
    >
      <span style={{ flexShrink: 0, width: 116, color: "var(--p-text-muted)" }}>
        {label}
      </span>
      <div style={{ minWidth: 0, flex: 1, color: "var(--p-text)" }}>{value}</div>
    </div>
  );
}

/** Assigns the ONE pillar an event scores in (`primary_category`). */
function PillarSelect({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Primary scoring pillar"
      style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
    >
      {PILLAR_ORDER.map((p) => {
        const d = pillarMeta(p);
        const on = value === p;
        const color = d.cssVar ? "var(" + d.cssVar + ")" : "var(--p-text-muted)";
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(p)}
            title={d.label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: 26,
              padding: "0 9px",
              borderRadius: "var(--p-radius-md)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: on ? color : "var(--p-border)",
              background: on
                ? "color-mix(in oklab, " + color + " 12%, white)"
                : "var(--p-card)",
              color: on ? color : "var(--p-text-muted)",
              fontFamily: "var(--p-font-sans)",
              fontSize: "var(--p-text-2xs, 11px)",
              fontWeight: on ? 600 : 500,
              whiteSpace: "nowrap",
              cursor: disabled ? "default" : "pointer",
              opacity: disabled ? 0.5 : 1,
              transition:
                "background var(--p-dur, 120ms) var(--p-ease, ease), border-color var(--p-dur, 120ms) var(--p-ease, ease), color var(--p-dur, 120ms) var(--p-ease, ease)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "var(--p-radius-pill, 999px)",
                background: on ? color : "var(--p-border-strong)",
                flexShrink: 0,
              }}
            />
            {d.short}
          </button>
        );
      })}
    </div>
  );
}

function hintTitle(hint: Record<string, unknown>): string {
  for (const key of ["title", "canonical_title", "event_title"]) {
    const v = hint[key];
    if (typeof v === "string" && v) return v;
  }
  const id = hint["id"] ?? hint["event_id"] ?? hint["canonical_id"];
  return id != null ? "Event #" + String(id) : "Untitled candidate";
}

export interface EventTriageDrawerProps {
  open: boolean;
  event: TriageEvent | null;
  pending?: boolean;
  /** Computed by the page from event_subtype (positive-direction events). */
  disallowScoring: boolean;
  onClose: () => void;
  onStatus: (id: number, next: TriageStatus) => void;
  onCategory: (id: number, primaryCategory: string) => void;
  onLinkStatus: (linkId: number, next: LinkStatus) => void;
  onAccept: (id: number) => void;
  /** Called after a data-quality flag is filed, so the page can refetch. */
  onFlagged?: () => void;
}

export function EventTriageDrawer({
  open,
  event,
  pending,
  disallowScoring,
  onClose,
  onStatus,
  onCategory,
  onLinkStatus,
  onAccept,
  onFlagged,
}: EventTriageDrawerProps) {
  const api = useTriageApi();

  const [hints, setHints] = useState<DuplicateHints | null>(null);
  const [hintsLoading, setHintsLoading] = useState(false);

  const [flagOpen, setFlagOpen] = useState(false);
  const [flagText, setFlagText] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  const eventId = event?.id ?? null;

  useEffect(() => {
    setHints(null);
    setFlagOpen(false);
    setFlagText("");
    setFlagError(null);
    if (!open || eventId == null) return;
    let cancelled = false;
    setHintsLoading(true);
    getDuplicateHints(api, eventId)
      .then((d) => {
        if (!cancelled) setHints(d);
      })
      .catch(() => {
        if (!cancelled) setHints(null);
      })
      .finally(() => {
        if (!cancelled) setHintsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, eventId, api]);

  if (!event) {
    return <SideSheet open={false} onOpenChange={() => onClose()} />;
  }

  const typeLabel = event.event_subtype
    ? humanize(event.event_type) + " · " + humanize(event.event_subtype)
    : humanize(event.event_type);

  const suggestedLinks = event.links.filter((l) => l.status === "suggested");
  const confirmedLinks = event.links.filter((l) => l.status === "confirmed");
  const untouched =
    event.triage_status === "pending_triage" &&
    suggestedLinks.length === event.links.length;
  const positive = disallowScoring;

  const submitFlag = async () => {
    if (!flagText.trim()) return;
    setFlagSubmitting(true);
    setFlagError(null);
    try {
      await flagEvent(api, event.id, { note_text: flagText.trim() });
      setFlagOpen(false);
      setFlagText("");
      onFlagged?.();
    } catch (err: unknown) {
      setFlagError(err instanceof Error ? err.message : "Could not file the flag");
    } finally {
      setFlagSubmitting(false);
    }
  };

  return (
    <SideSheet open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SideSheetContent aria-describedby={undefined}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
          {/* ── Header ── */}
          <div style={{ padding: "24px 24px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--p-font-mono)",
                  fontSize: "var(--p-text-2xs, 11px)",
                  color: "var(--p-text-muted)",
                }}
              >
                #{event.id}
              </span>
              <EventStatusBadge status={event.triage_status} />
              {event.verified && (
                <span
                  title="Approving an event marks it verified in the same write — operational scoring reads this flag"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "var(--p-text-2xs, 11px)",
                    fontWeight: 600,
                    color: "#065F46",
                    cursor: "help",
                  }}
                >
                  <CheckCircle2 size={12} strokeWidth={2.25} /> Verified
                </span>
              )}
              <QualityDefectChips defects={event.quality_defects} />
            </div>
            <DialogTitle
              style={{
                margin: 0,
                paddingRight: 32,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: "var(--p-lh-snug, 1.35)",
                color: "var(--p-text)",
              }}
            >
              {event.title}
            </DialogTitle>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "var(--p-text-xs, 12px)",
                color: "var(--p-text-muted)",
              }}
            >
              <span>{event.source_system || "(uncredited source)"}</span>
              <span>·</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {event.event_date ? formatDate(event.event_date) : "no date"}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                <SeverityChip score={event.severity_score} />
                <ConfidenceBadge value={event.confidence_score} />
              </span>
            </div>
          </div>

          {/* ── Summary ── */}
          {event.summary && (
            <div style={{ padding: "0 24px 16px" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-md, 14px)",
                  lineHeight: 1.6,
                  color: "var(--p-text)",
                  textWrap: "pretty",
                }}
              >
                {event.summary}
                {event.quality_defects.includes("truncated_summary") && (
                  <span
                    title="Sliced at 500 characters on ingest. The full text is not recoverable from the database — the source item must be re-ingested."
                    style={{
                      marginLeft: 4,
                      color: "var(--p-risk-mod)",
                      fontWeight: 600,
                      cursor: "help",
                    }}
                  >
                    […truncated]
                  </span>
                )}
              </p>
            </div>
          )}

          {untouched && (
            <div style={{ padding: "0 24px 16px" }}>
              <Banner>
                Everything below is a machine suggestion. Accept it wholesale,
                or correct the pillar and links first — nothing here scores
                until you do.
              </Banner>
            </div>
          )}

          {positive && (
            <div style={{ padding: "0 24px 16px" }}>
              <Banner>
                Positive-direction event ({humanize(event.event_subtype)}).
                Positives are excluded from risk arithmetic at read time, so
                approving this for scoring would mark it promoted while
                contributing nothing. Keep it display-only — it stays visible
                in the feed and the evidence drawer. If the story really is a
                supply disruption, it needs the disruption subtype that
                describes it.
              </Banner>
            </div>
          )}

          {/* ── Decision 1: status ── */}
          <div style={{ padding: "0 24px 18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <h3 style={sectionLabel}>Triage decision</h3>
              {untouched && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => onAccept(event.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Accept all suggestions
                </Button>
              )}
            </div>
            <TriageStatusControl
              status={event.triage_status}
              pending={pending}
              disallow={positive ? ["scoring"] : undefined}
              disallowReason="Positive-direction events are excluded from risk arithmetic — promoting one would have no effect"
              onChange={(next) => onStatus(event.id, next)}
            />
            {event.triaged_by ? (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 10.5,
                  color: "var(--p-text-muted)",
                }}
              >
                Triaged by {event.triaged_by} ·{" "}
                {event.triaged_at ? formatDate(event.triaged_at) : "—"}
                {event.triage_status === "scoring" &&
                  " · approved and verified in one step"}
              </p>
            ) : null}
          </div>

          {/* ── Decision 2: category ── */}
          <div style={{ padding: "0 24px 18px" }}>
            <h3 style={{ ...sectionLabel, marginBottom: 8 }}>Scoring pillar</h3>
            {event.triage_status === "scoring" ? (
              <>
                <PillarSelect
                  value={event.primary_category}
                  disabled={pending}
                  onChange={(next) => onCategory(event.id, next)}
                />
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 10.5,
                    lineHeight: 1.45,
                    color: "var(--p-text-muted)",
                  }}
                >
                  {event.suggested_category && (
                    <>
                      Engine suggested{" "}
                      <strong style={{ fontWeight: 600, color: "var(--p-text)" }}>
                        {pillarMeta(event.suggested_category).label}
                      </strong>
                      {event.primary_category === event.suggested_category ? (
                        " — accepted."
                      ) : (
                        <span style={{ color: "var(--p-accent-deep)" }}>
                          {" "}
                          — corrected to{" "}
                          {event.primary_category
                            ? pillarMeta(event.primary_category).label
                            : "none"}
                          .
                        </span>
                      )}{" "}
                    </>
                  )}
                  An event affects several pillars but scores in one.
                </p>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {event.suggested_category ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: "var(--p-text-xs, 12px)",
                        color: "var(--p-text-muted)",
                      }}
                    >
                      Suggested
                    </span>
                    <PillarChip pillar={event.suggested_category} format="long" />
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: "var(--p-text-xs, 12px)",
                      fontStyle: "italic",
                      color: "var(--p-text-muted)",
                    }}
                  >
                    No pillar suggested.
                  </span>
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: 10.5,
                    lineHeight: 1.45,
                    color: "var(--p-text-muted)",
                  }}
                >
                  {/* Never point at Approve when the refusal has disabled it — a
                      positive-direction event can never carry a scoring pillar,
                      so "approve to assign one" would send the triager at a dead
                      control the banner just explained is a no-op. */}
                  {positive
                    ? "Positive-direction events are excluded from risk arithmetic, so no scoring pillar can be assigned."
                    : event.triage_status === "display_only"
                      ? "Display-only events are attributed to no pillar by definition — approve for scoring to assign one."
                      : "Approve this event for scoring to confirm or change its pillar."}
                </p>
              </div>
            )}
          </div>

          {/* ── Decision 3: links ── */}
          <div style={{ padding: "0 24px 18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <h3 style={sectionLabel}>Entity links</h3>
              <span style={{ fontSize: 10, color: "var(--p-text-muted)" }}>
                {confirmedLinks.length} confirmed · {suggestedLinks.length}{" "}
                suggested
              </span>
            </div>

            {event.links.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-xs, 12px)",
                  fontStyle: "italic",
                  color: "var(--p-text-muted)",
                }}
              >
                No links suggested. Triage this event to display-only — an
                event can be worth showing without mapping to a specific
                material.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {event.links.map((l) => (
                  <SuggestedLinkRow
                    key={l.id}
                    link={l}
                    pending={pending}
                    onSetStatus={onLinkStatus}
                  />
                ))}
              </div>
            )}
            {/* Add-material-link input deferred in triage v1: addMaterialLink()
                requires a material_id, and the drawer has no materials lookup
                to resolve a typed name against. Reintroduce alongside a
                materials picker. */}
          </div>

          {/* ── Locked in v1 ── */}
          <div style={{ padding: "0 24px 18px" }}>
            <h3 style={{ ...sectionLabel, marginBottom: 2 }}>Machine-assigned</h3>
            <LockedField
              label="Event type"
              value={
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: "var(--p-badge-h, 20px)",
                    padding: "0 7px",
                    borderRadius: 3,
                    border: "1px solid var(--p-border)",
                    background: "var(--p-card)",
                    fontSize: "var(--p-text-2xs, 11px)",
                    fontWeight: 500,
                    color: "var(--p-text-muted)",
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {typeLabel}
                </span>
              }
              why="Locked in triage v1 — deferred deliberately. Event type is machine-suggested and not editable here."
            />
            <LockedField
              label="Severity"
              value={<SeverityChip score={event.severity_score} />}
              why="Locked in triage v1 — deferred deliberately. Severity calibration is machine-assigned."
            />
            <LockedField
              label="Confidence"
              value={<ConfidenceBadge value={event.confidence_score} />}
              why="Locked in triage v1 — deferred deliberately. Confidence is machine-assigned."
            />
            <LockedField
              label="Relevance weights"
              value={
                <span style={{ color: "var(--p-text-muted)" }}>
                  Shown per link above
                </span>
              }
              why="Locked in triage v1 — deferred deliberately. Link relevance weights are machine-assigned."
            />
          </div>

          {/* ── Provenance ── */}
          <div style={{ padding: "0 24px 18px" }}>
            <h3 style={{ ...sectionLabel, marginBottom: 2 }}>Provenance</h3>
            <ProvenanceRow
              label="Source system"
              value={event.source_system || "(uncredited source)"}
            />
            <ProvenanceRow
              label="Source"
              value={
                event.source_url ? (
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      color: "var(--p-accent-deep)",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    View source <ExternalLink size={12} strokeWidth={2} />
                  </a>
                ) : (
                  <span
                    title={
                      event.quality_defects.includes("no_provenance")
                        ? "No source document was ever created for this event"
                        : "Points at a bulk document with no URL"
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontStyle: "italic",
                      color: "var(--p-risk-mod)",
                      cursor: "help",
                    }}
                  >
                    <Unlink size={13} strokeWidth={2} /> No source link
                  </span>
                )
              }
            />
            <ProvenanceRow
              label="Geography"
              value={event.geography_primary || "—"}
            />
            <ProvenanceRow
              label="Event date"
              value={
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {event.event_date ? formatDate(event.event_date) : "—"}
                </span>
              }
            />
            {event.suggested_subtype && (
              <ProvenanceRow
                label="Suggested subtype"
                value={humanize(event.suggested_subtype)}
              />
            )}
          </div>

          {/* ── Duplicate check ── */}
          <div style={{ padding: "0 24px 20px" }}>
            <h3 style={{ ...sectionLabel, marginBottom: 8 }}>Duplicate check</h3>
            {hintsLoading ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-xs, 12px)",
                  color: "var(--p-text-muted)",
                }}
              >
                Checking for duplicate candidates…
              </p>
            ) : hints == null ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-xs, 12px)",
                  fontStyle: "italic",
                  color: "var(--p-text-faint)",
                }}
              >
                Duplicate check unavailable.
              </p>
            ) : !hints.checked ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-xs, 12px)",
                  color: "var(--p-text-muted)",
                }}
              >
                Not checked{hints.reason ? " — " + hints.reason : "."}
              </p>
            ) : hints.hints.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--p-text-xs, 12px)",
                  color: "var(--p-text-muted)",
                }}
              >
                No duplicate candidates found.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "var(--p-text-xs, 12px)",
                    fontWeight: 600,
                    color: "var(--p-risk-mod)",
                  }}
                >
                  <Copy size={13} strokeWidth={2} />
                  {hints.hints.length} duplicate candidate
                  {hints.hints.length === 1 ? "" : "s"} — promoting both would
                  double-count this story
                </span>
                {hints.hints.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "var(--p-text-xs, 12px)",
                      color: "var(--p-text)",
                      paddingLeft: 19,
                    }}
                  >
                    {hintTitle(h)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              borderTop: "1px solid var(--p-border)",
              padding: "12px 24px",
            }}
          >
            <Button variant="ghost" size="sm" onClick={() => setFlagOpen(true)}>
              <Flag className="h-3.5 w-3.5" />
              Flag issue
            </Button>
            {event.flags_count > 0 && (
              <span
                style={{
                  fontSize: "var(--p-text-xs, 12px)",
                  color: "var(--p-risk-crit)",
                }}
              >
                {event.flags_count} open data-quality note
                {event.flags_count === 1 ? "" : "s"}
              </span>
            )}
            {event.triage_status === "scoring" && (
              <span
                title="Approving an event marks it verified in the same write — operational scoring reads this flag"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "var(--p-text-xs, 12px)",
                  color: "#065F46",
                  cursor: "help",
                }}
              >
                <CheckCircle2 size={13} strokeWidth={2.25} /> Verified on
                approval
              </span>
            )}
          </div>
        </div>
      </SideSheetContent>

      {/* ── Flag issue dialog ── */}
      <Dialog
        open={flagOpen}
        onOpenChange={(next) => {
          if (!next) setFlagOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Flag a data-quality issue</DialogTitle>
            <DialogDescription>{event.title}</DialogDescription>
          </DialogHeader>
          <textarea
            rows={4}
            autoFocus
            value={flagText}
            onChange={(e) => setFlagText(e.target.value)}
            placeholder="What is wrong with this event?"
            style={{
              width: "100%",
              resize: "vertical",
              borderRadius: "var(--p-radius-md)",
              border: "1px solid var(--p-border)",
              background: "var(--p-card)",
              padding: "8px 10px",
              fontFamily: "var(--p-font-sans)",
              fontSize: "var(--p-text-xs, 12px)",
              color: "var(--p-text)",
              lineHeight: 1.5,
            }}
          />
          {flagError && (
            <span style={{ fontSize: 10.5, color: "var(--p-risk-crit)" }}>
              {flagError}
            </span>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFlagOpen(false)}
              disabled={flagSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void submitFlag()}
              disabled={!flagText.trim() || flagSubmitting}
            >
              {flagSubmitting ? "Filing..." : "Flag issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SideSheet>
  );
}
