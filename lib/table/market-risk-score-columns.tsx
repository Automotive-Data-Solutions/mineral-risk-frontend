"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GeographyCodePill } from "@/components/shared/geography-code-pill";
import { ScoreChip } from "@/components/platform/score-chip";
import type { MaterialGeographyScoreRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

// Narrowed key type so callers can pass a pillarsToShow subset safely
// (see RiskScorePillarKey export below).
const RISK_SCORE_PILLARS: {
  key:
    | "material_concentration_score"
    | "geopolitical_trade_score"
    | "regulatory_compliance_score"
    | "operational_score"
    | "financial_pressure_score";
  header: string;
}[] = [
  { key: "material_concentration_score", header: "Mat. Conc." },
  { key: "geopolitical_trade_score", header: "Geopolitical" },
  { key: "regulatory_compliance_score", header: "Regulatory" },
  { key: "operational_score", header: "Operational" },
  { key: "financial_pressure_score", header: "Financial" },
];

/** Mirrors ScoreChip band thresholds — Tailwind text-color class. */
function pillarColorClass(score: number): string {
  if (score >= 75) return "text-red-600 dark:text-red-400";
  if (score >= 55) return "text-orange-500 dark:text-orange-400";
  if (score >= 35) return "text-amber-500 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

/** Subtle background tint matching the pillar band. */
function pillarBgClass(score: number): string {
  if (score >= 75) return "bg-red-50 dark:bg-red-950/30";
  if (score >= 55) return "bg-orange-50 dark:bg-orange-950/20";
  if (score >= 35) return "bg-amber-50 dark:bg-amber-950/20";
  return "bg-emerald-50 dark:bg-emerald-950/20";
}

export function sortMarketRiskScoreRows(
  rows: MaterialGeographyScoreRead[],
): MaterialGeographyScoreRead[] {
  return [...rows].sort(
    (a, b) => (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1),
  );
}

/** Pillar keys that the country-scores view exposes. */
export type RiskScorePillarKey =
  | "material_concentration_score"
  | "geopolitical_trade_score"
  | "regulatory_compliance_score"
  | "operational_score"
  | "financial_pressure_score";

/**
 * Per-material × per-country weighted risk contribution.
 * Production-share% × overall-risk / 100.  Numeric — same units as
 * overall risk so values are comparable across countries.
 * Returns null when share is missing/zero (non-producers contribute
 * nothing to a weighted-exposure view).
 */
function weightedRisk(row: MaterialGeographyScoreRead): number | null {
  const share = row.production_share_pct;
  const risk = row.overall_risk_score;
  if (share == null || share === 0 || risk == null) return null;
  return (share * risk) / 100;
}

/**
 * Sort by weighted-exposure (share × overall risk) DESC for the
 * per-material country-scores view.  Non-producers (no share) fall
 * below all producers and tie-break on overall risk DESC.
 *
 * This replaces the producer-vs-non-producer rule the old sort used:
 * producers were ordered by share alone, which buried small-share
 * countries that happened to be highest-risk.  Weighted exposure surfaces
 * the country that actually contributes the most risk regardless of
 * whether it's a top producer.
 */
export function sortCountryScoresByWeightedExposure(
  rows: MaterialGeographyScoreRead[],
): MaterialGeographyScoreRead[] {
  return [...rows].sort((a, b) => {
    const aw = weightedRisk(a);
    const bw = weightedRisk(b);
    // Both have weighted exposure — sort by it DESC.
    if (aw != null && bw != null) {
      if (bw !== aw) return bw - aw;
      return (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1);
    }
    // Only one is a producer — producers above non-producers.
    if (aw != null) return -1;
    if (bw != null) return 1;
    // Neither produces — fall back to overall risk.
    return (b.overall_risk_score ?? -1) - (a.overall_risk_score ?? -1);
  });
}

/** Column defs for material × geography market risk score rows (`MaterialGeographyScoreRead`). */
export function buildMarketRiskScoreColumns(options: {
  showMaterialColumn: boolean;
  /** When true: full `ScoreChip` with band label; when false: compact numeric + dot. */
  overallBandLabels: boolean;
  /**
   * When true, render the per-material exposure columns (production share %,
   * facility count).  Only meaningful when the rows come from
   * `/materials/{id}/market-scores` — the cross-material `/market/scores`
   * browse view does not populate these fields.
   */
  showExposureColumns?: boolean;
  /**
   * Which pillar columns to render.  Defaults to all 5 for back-compat
   * with the cross-material browse view.  The per-material country view
   * passes a narrower list (Geopolitical, Regulatory, Operational) since
   * Material Concentration and Financial Pressure are computed at the
   * material level — they don't vary meaningfully by country and showing
   * them per-row implies country-specific signal that doesn't exist.
   */
  pillarsToShow?: RiskScorePillarKey[];
  /**
   * When true, render a "Weighted" column = production-share% × overall
   * risk / 100.  Only meaningful for per-material country breakdowns
   * where production_share_pct is populated.  Defaults to false.
   */
  showWeightedRisk?: boolean;
}): ColumnDef<MaterialGeographyScoreRead, unknown>[] {
  const cols: ColumnDef<MaterialGeographyScoreRead, unknown>[] = [];

  if (options.showMaterialColumn) {
    cols.push({
      accessorKey: "material_id",
      header: "Material ID",
      cell: ({ row }) => (
        <span style={{ fontFamily: "var(--p-font-mono)" }}>{row.original.material_id}</span>
      ),
    });
  }

  cols.push({
    accessorKey: "geography_code",
    header: "Geography",
    cell: ({ row }) => <GeographyCodePill code={row.original.geography_code} />,
  });

  if (options.showExposureColumns) {
    cols.push({
      accessorKey: "production_share_pct",
      header: () => <span className="block text-right">Share</span>,
      cell: ({ row }) => {
        const share = row.original.production_share_pct;
        if (share == null) {
          return (
            <div className="text-right tabular-nums text-muted-foreground/40">—</div>
          );
        }
        // Highlight ≥10% (concentrated producer) — otherwise dim.
        const cls =
          share >= 10
            ? "font-semibold text-foreground"
            : share >= 1
              ? "text-foreground"
              : "text-muted-foreground";
        return (
          <div className={cn("text-right tabular-nums text-xs", cls)}>
            {share}%
          </div>
        );
      },
    });

    cols.push({
      accessorKey: "facility_count",
      header: () => <span className="block text-right">Facilities</span>,
      cell: ({ row }) => {
        const count = row.original.facility_count ?? 0;
        if (count === 0) {
          return (
            <div className="text-right tabular-nums text-muted-foreground/40 text-xs">
              —
            </div>
          );
        }
        return (
          <div className="text-right tabular-nums text-xs font-semibold">
            {count}
          </div>
        );
      },
    });
  }

  cols.push({
    accessorKey: "overall_risk_score",
    header: "Overall",
    cell: ({ row }) => (
      <ScoreChip
        score={row.original.overall_risk_score}
        showBandLabel={options.overallBandLabels}
      />
    ),
  });

  if (options.showWeightedRisk) {
    cols.push({
      // Custom id since this isn't a server-side field — we derive it
      // client-side from share × overall.
      id: "weighted_risk",
      accessorFn: (row) => weightedRisk(row) ?? 0,
      header: () => (
        <span
          className="block text-right"
          title="Production share × overall risk / 100 — this country's weighted contribution to the material's overall exposure"
        >
          Weighted
        </span>
      ),
      cell: ({ row }) => {
        const wr = weightedRisk(row.original);
        if (wr == null) {
          return (
            <div className="text-right tabular-nums text-muted-foreground/40 text-xs">
              —
            </div>
          );
        }
        // Use the same color band as overall risk so a high weighted-risk
        // cell visually matches its raw-overall sibling.
        return (
          <div className="flex justify-end">
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                pillarColorClass(wr),
                pillarBgClass(wr),
              )}
              title={`${row.original.production_share_pct}% share × overall ${Math.round(
                row.original.overall_risk_score ?? 0,
              )} = ${wr.toFixed(1)}`}
            >
              {wr.toFixed(1)}
            </span>
          </div>
        );
      },
    });
  }

  // Default: all 5 pillars for back-compat with the cross-material browse view.
  const pillarKeys =
    options.pillarsToShow ?? RISK_SCORE_PILLARS.map((p) => p.key);
  const visiblePillars = RISK_SCORE_PILLARS.filter((p) =>
    pillarKeys.includes(p.key),
  );

  for (const pillar of visiblePillars) {
    cols.push({
      accessorKey: pillar.key,
      header: () => <span className="block text-right">{pillar.header}</span>,
      cell: ({ row }) => {
        const val = row.original[pillar.key] as number | null | undefined;
        if (val == null) {
          return (
            <div className="text-right tabular-nums text-muted-foreground/40">—</div>
          );
        }
        return (
          <div className="flex justify-end">
            <span
              className={cn(
                "inline-block rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                pillarColorClass(val),
                pillarBgClass(val),
              )}
            >
              {Math.round(val)}
            </span>
          </div>
        );
      },
    });
  }

  cols.push({
    // Events column shows the INTERSECTION (event_count_geo_specific) —
    // events tagged to BOTH this material AND this country.  Falls back to
    // the legacy UNION `event_count` only when the row predates migration
    // 042 (signalled by null geo_specific) — but renders as "—" with a
    // tooltip in that case so analysts know it's stale and a rescore would
    // change the number.  See migration 042 docstring for why we don't
    // silently substitute.
    accessorKey: "event_count_geo_specific",
    header: () => <span className="block text-right">Events</span>,
    cell: ({ row }) => {
      const geoSpecific = row.original.event_count_geo_specific;
      if (geoSpecific == null) {
        // Pre-042 row — show "—" with a hover hint rather than the
        // misleading union number.  A rescore will populate it.
        return (
          <div
            className="flex justify-end"
            title="Pre-042 row · rescore to populate geo-specific event count"
          >
            <span className="text-xs text-muted-foreground/40 tabular-nums">—</span>
          </div>
        );
      }
      if (geoSpecific === 0) {
        return (
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground/40 tabular-nums">0</span>
          </div>
        );
      }
      const chipClass =
        geoSpecific >= 5
          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
          : "bg-muted text-muted-foreground border border-border";
      return (
        <div className="flex justify-end">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              chipClass,
            )}
            title={`${geoSpecific} events tagged to this material AND this country · union total (consumed by scoring): ${row.original.event_count ?? 0}`}
          >
            {geoSpecific}
          </span>
        </div>
      );
    },
  });

  cols.push({
    accessorKey: "as_of_date",
    header: () => <span className="block text-right">As of</span>,
    cell: ({ row }) => (
      <div className="text-right text-[12px]" style={{ color: "var(--p-text-muted)" }}>
        {formatDate(row.original.as_of_date)}
      </div>
    ),
  });

  return cols;
}
