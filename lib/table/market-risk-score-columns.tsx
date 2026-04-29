"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GeographyCodePill } from "@/components/shared/geography-code-pill";
import { ScoreChip } from "@/components/platform/score-chip";
import type { MaterialGeographyScoreRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

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
        return (
          <div
            className="text-right tabular-nums"
            style={{
              color: val != null ? "var(--p-text)" : "var(--p-text-faint)",
            }}
          >
            {val != null ? Math.round(val) : "—"}
          </div>
        );
      },
    });
  }

  cols.push({
    accessorKey: "event_count",
    header: () => <span className="block text-right">Events</span>,
    cell: ({ row }) => (
      <div
        className="text-right tabular-nums"
        style={{ fontFamily: "var(--p-font-mono)", color: "var(--p-text-muted)" }}
      >
        {row.original.event_count ?? 0}
      </div>
    ),
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
