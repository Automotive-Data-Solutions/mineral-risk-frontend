"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTablePagination } from "@/components/data-table/pagination";
import type { HsCodeMaterialMappingRead } from "@/lib/types";
import { humanize } from "@/lib/utils/format";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 15];

// ---------------------------------------------------------------------------
// HsMappingsCard
// ---------------------------------------------------------------------------
//
// Surfaces every hs_code_material_mappings row attached to one material.
// Lives on the Materials detail Overview tab so partners can review which
// HS codes drive trade-event attribution for a given material and spot
// suspect mappings before they corrupt scoring.
//
// Confidence color thresholds match the seed-file's `_LOW_CONFIDENCE_THRESHOLD`
// of 0.6 — anything below renders red, 0.6–0.8 amber, >=0.8 green.  Tooltip
// on the description field shows the full text when it's truncated.

interface HsMappingsCardProps {
  mappings: HsCodeMaterialMappingRead[];
}

// Canonical stage order so rows sort visually upstream → downstream.
const STAGE_ORDER: Record<string, number> = {
  ore: 1,
  concentrate: 2,
  intermediate: 3,
  refined: 4,
  battery_grade: 5,
  fabricated: 6,
  scrap: 7,
};

const STAGE_COLOR_VAR: Record<string, string> = {
  ore: "var(--p-pillar-material)",
  concentrate: "var(--p-pillar-material)",
  intermediate: "var(--p-pillar-geo)",
  refined: "var(--p-pillar-regulatory)",
  battery_grade: "var(--p-pillar-financial)",
  fabricated: "var(--p-pillar-operational)",
  scrap: "var(--p-text-muted)",
};

function confidenceColor(c: number | null): string {
  if (c == null) return "var(--p-text-muted)";
  if (c < 0.6) return "var(--p-risk-crit)";
  if (c < 0.8) return "var(--p-risk-mod)";
  return "var(--p-risk-low)";
}

function StageChip({ stage }: { stage: string | null }) {
  if (!stage) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const color = STAGE_COLOR_VAR[stage] ?? "var(--p-text-muted)";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        color: color,
        background: "transparent",
        border: `1px solid ${color}`,
        textTransform: "lowercase",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {humanize(stage)}
    </span>
  );
}

function ScopeChip({ scope }: { scope: string }) {
  // Tiny uppercase chip — global / us / eu.  Faint so it sits in
  // background unless the analyst is specifically looking for non-global
  // (US HTS 10-digit) rows.
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: "var(--p-text-muted)",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {scope}
    </span>
  );
}

export function HsMappingsCard({ mappings }: HsMappingsCardProps) {
  // Sort by stage canonical order, then by HS code prefix.  Mappings
  // without a stage assignment fall to the bottom (sentinel high
  // sort value).
  const sorted = useMemo(() => {
    return [...mappings].sort((a, b) => {
      const sa = a.supply_chain_stage
        ? STAGE_ORDER[a.supply_chain_stage] ?? 99
        : 100;
      const sb = b.supply_chain_stage
        ? STAGE_ORDER[b.supply_chain_stage] ?? 99
        : 100;
      if (sa !== sb) return sa - sb;
      return a.hs_code_prefix.localeCompare(b.hs_code_prefix);
    });
  }, [mappings]);

  // Client-side pagination — some materials have 30+ mappings (Aluminum,
  // Lithium) and scrolling the whole list mid-page is awkward.  Data is
  // already in memory from the parent fetch so we slice locally.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // If the underlying data shrinks (e.g. user navigates between materials),
  // make sure the current page is still valid.
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(sorted.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [sorted.length, pageSize, page]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // At-a-glance stats — total mappings, count below 0.6 confidence,
  // per-stage counts.  Helps the partner know the shape of what
  // they're looking at before scanning rows.  Always computed on the
  // FULL (unsliced) list so the header strip reflects everything,
  // not just the current page.
  const stats = useMemo(() => {
    const lowConfidence = mappings.filter(
      (m) => m.confidence !== null && m.confidence < 0.6,
    ).length;
    const byStage: Record<string, number> = {};
    for (const m of mappings) {
      const s = m.supply_chain_stage ?? "(unassigned)";
      byStage[s] = (byStage[s] ?? 0) + 1;
    }
    return { total: mappings.length, lowConfidence, byStage };
  }, [mappings]);

  if (mappings.length === 0) {
    return (
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">HS code mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No HS codes mapped to this material yet.  Trade events won&apos;t
            attribute to it through HS-code matching — only via keyword
            or topic detection on free-text sources.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-3">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">HS code mappings</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.total} mapping{stats.total === 1 ? "" : "s"} drive how
              this material is attributed in trade events.  Review for
              accuracy.
            </p>
          </div>
          {/* Compact stats strip — total + low-confidence count + per-stage breakdown */}
          <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:flex">
            {stats.lowConfidence > 0 && (
              <span style={{ color: "var(--p-risk-crit)" }}>
                <strong>{stats.lowConfidence}</strong> low-confidence
              </span>
            )}
            {Object.entries(stats.byStage)
              .sort(([a], [b]) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99))
              .map(([stage, n]) => (
                <span key={stage} className="text-muted-foreground">
                  <strong className="text-foreground">{n}</strong>{" "}
                  {humanize(stage)}
                </span>
              ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--p-bg-subtle)",
                  borderTop: "1px solid var(--p-border)",
                  borderBottom: "1px solid var(--p-border)",
                }}
              >
                {[
                  { label: "HS Code", align: "left" as const, width: "120px" },
                  { label: "Description", align: "left" as const, width: undefined },
                  { label: "Stage", align: "left" as const, width: "140px" },
                  { label: "Confidence", align: "right" as const, width: "100px" },
                  { label: "Scope", align: "right" as const, width: "70px" },
                  { label: "Keywords", align: "right" as const, width: "80px" },
                ].map((h) => (
                  <th
                    key={h.label}
                    style={{
                      padding: "8px 14px",
                      textAlign: h.align,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--p-text-muted)",
                      whiteSpace: "nowrap",
                      width: h.width,
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: "1px solid var(--p-rule)" }}
                >
                  {/* HS code prefix — monospace */}
                  <td
                    style={{
                      padding: "10px 14px",
                      fontFamily: "var(--p-font-mono, ui-monospace, monospace)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--p-text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.hs_code_prefix}
                    {m.digit_count !== 4 && (
                      <span
                        style={{
                          fontSize: 10,
                          marginLeft: 6,
                          color: "var(--p-text-faint)",
                          fontWeight: 400,
                        }}
                      >
                        {m.digit_count}d
                      </span>
                    )}
                  </td>

                  {/* Description — truncated with full text in title */}
                  <td
                    style={{
                      padding: "10px 14px",
                      color: "var(--p-text-muted)",
                      maxWidth: 0,  // forces text-overflow when combined with the wrapper below
                    }}
                  >
                    <span
                      title={m.description ?? ""}
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.description ?? (
                        <em style={{ color: "var(--p-text-faint)" }}>no description</em>
                      )}
                    </span>
                  </td>

                  {/* Stage chip */}
                  <td style={{ padding: "10px 14px" }}>
                    <StageChip stage={m.supply_chain_stage} />
                  </td>

                  {/* Confidence — color-coded by 0.6 / 0.8 thresholds */}
                  <td
                    style={{
                      padding: "10px 14px",
                      textAlign: "right",
                      color: confidenceColor(m.confidence),
                      fontFamily: "var(--p-font-mono, ui-monospace, monospace)",
                      fontSize: 13,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {m.confidence !== null ? m.confidence.toFixed(2) : "—"}
                  </td>

                  {/* Market scope — tiny chip */}
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <ScopeChip scope={m.market_scope} />
                  </td>

                  {/* Keywords count + tooltip listing them */}
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    {m.keywords && m.keywords.length > 0 ? (
                      <span
                        title={m.keywords.join(", ")}
                        style={{
                          fontSize: 12,
                          color: "var(--p-text-muted)",
                          fontVariantNumeric: "tabular-nums",
                          cursor: "help",
                        }}
                      >
                        {m.keywords.length}
                      </span>
                    ) : (
                      <span style={{ color: "var(--p-text-faint)", fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination — only render when there's more than one page worth.
            Sort order is preserved across pages (stage canonical order →
            HS code), so paging back/forward reads top-to-bottom naturally. */}
        {sorted.length > pageSize && (
          <div className="px-4 pt-1">
            <DataTablePagination
              page={page}
              limit={pageSize}
              total={sorted.length}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setPageSize(l);
                setPage(1);
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
