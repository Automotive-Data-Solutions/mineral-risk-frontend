"use client";

import { scoreToBand } from "@/lib/utils/risk-band";
import type { MaterialListPillarScore } from "@/lib/types";

// ---------------------------------------------------------------------------
// PillarCoverageDots
// ---------------------------------------------------------------------------
//
// 5 small inline dots, one per scoring pillar.  Dot is colored by band
// when ``has_signal`` is true (score > 0); gray when 0 (fallback) or null
// (no score row).  Tooltip names the pillar + shows the score.
//
// Used on the Materials list row as a compact "is the analysis well-
// rounded for this mineral?" indicator at a glance.  Mirrors the visual
// language of the Score Coverage card on the dashboard at a single-row
// scale.

interface PillarCoverageDotsProps {
  pillars: MaterialListPillarScore[];
  /** Optional override for dot diameter (px). Default 8. */
  size?: number;
}

function dotColor(p: MaterialListPillarScore): string {
  if (!p.has_signal) {
    // Either score is null (no row) or 0 (fallback).  Same neutral color
    // in both cases — the tooltip will reveal which it is.
    return "var(--p-bg-muted)";
  }
  const band = scoreToBand(p.score);
  if (band === "CRIT") return "var(--p-risk-crit)";
  if (band === "HIGH") return "var(--p-risk-high)";
  if (band === "MOD") return "var(--p-risk-mod)";
  return "var(--p-risk-low)";
}

function tooltipText(p: MaterialListPillarScore): string {
  if (p.score === null) return `${p.label}: no score`;
  if (!p.has_signal) return `${p.label}: 0 (fallback / no signal)`;
  return `${p.label}: ${Math.round(p.score)}`;
}

export function PillarCoverageDots({
  pillars,
  size = 8,
}: PillarCoverageDotsProps) {
  if (!pillars || pillars.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="inline-flex items-center gap-1.5">
      {pillars.map((p) => (
        <span
          key={p.name}
          title={tooltipText(p)}
          aria-label={tooltipText(p)}
          style={{
            display: "inline-block",
            width: size,
            height: size,
            borderRadius: "50%",
            background: dotColor(p),
            flexShrink: 0,
            // Subtle ring when the dot is gray so it doesn't disappear
            // against subtle table-row backgrounds.
            boxShadow: !p.has_signal
              ? "inset 0 0 0 1px var(--p-rule)"
              : undefined,
          }}
        />
      ))}
    </div>
  );
}
