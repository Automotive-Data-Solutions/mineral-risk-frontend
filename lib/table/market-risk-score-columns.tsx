"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GeographyCodePill } from "@/components/shared/geography-code-pill";
import { ScoreChip } from "@/components/platform/score-chip";
import type { MaterialGeographyScoreRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const RISK_SCORE_PILLARS: {
  key: keyof MaterialGeographyScoreRead;
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

/** Column defs for material × geography market risk score rows (`MaterialGeographyScoreRead`). */
export function buildMarketRiskScoreColumns(options: {
  showMaterialColumn: boolean;
  /** When true: full `ScoreChip` with band label; when false: compact numeric + dot. */
  overallBandLabels: boolean;
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

  for (const pillar of RISK_SCORE_PILLARS) {
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
    accessorKey: "event_count",
    header: () => <span className="block text-right">Events</span>,
    cell: ({ row }) => {
      const count = row.original.event_count ?? 0;
      if (count === 0) {
        return (
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground/40 tabular-nums">0</span>
          </div>
        );
      }
      const chipClass =
        count >= 5
          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
          : "bg-muted text-muted-foreground border border-border";
      return (
        <div className="flex justify-end">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
              chipClass,
            )}
          >
            {count}
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
