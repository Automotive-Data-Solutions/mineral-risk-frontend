"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  PlatformCard,
  PlatformCardBody,
  PlatformCardHeader,
} from "@/components/platform/platform-card";
import type { PillarCoverageStat } from "@/lib/types";

// ---------------------------------------------------------------------------
// Score Coverage card
// ---------------------------------------------------------------------------
//
// Renamed from PillarCoverageCard on 2026-05-11 — "Score Coverage"
// communicates more clearly what's being measured (how complete is the
// scoring across pillars) than the prior "Pillar Coverage" framing,
// which read more like a structural label.
//
// One bar per scoring pillar (5 total).  The bar is filled to the % of
// launch-list materials with credible signal in that pillar (score > 0),
// plus a dimmer overlay covering the additional materials that have a
// score row but it's a 0/fallback value.  The remaining un-filled portion
// represents materials with no score row at all.
//
// Visual semantics mirror the prior Score-run progress card's stacked-bar
// pattern but scoped to the launch list and given its own breathable card
// instead of being squeezed into the matrix as 5 numeric columns.
//
// Color mapping uses the existing --p-pillar-* CSS variables (one color
// per pillar) so the analyst can associate each bar with its pillar at a
// glance.  Fallback to a slate color if a pillar name isn't in the map.

interface ScoreCoverageCardProps {
  pillars: PillarCoverageStat[] | null | undefined;
  isLoading?: boolean;
}

/** Pillar name → CSS color variable.  Matches the prior Score-run card's
 *  color scheme so partner-facing screenshots stay visually consistent. */
const PILLAR_COLOR_VAR: Record<string, string> = {
  material_concentration_score: "var(--p-pillar-material)",
  geopolitical_trade_score: "var(--p-pillar-geo)",
  regulatory_compliance_score: "var(--p-pillar-regulatory)",
  operational_score: "var(--p-pillar-operational)",
  financial_pressure_score: "var(--p-pillar-financial)",
};

function PillarRow({ stat }: { stat: PillarCoverageStat }) {
  const color = PILLAR_COLOR_VAR[stat.name] ?? "var(--p-slate-700)";

  const total = Math.max(stat.total, 1); // avoid divide-by-zero
  const signalPct = (stat.materials_with_signal / total) * 100;
  // floor = materials that have a score row but the value is 0
  const floorCount = Math.max(
    0,
    stat.materials_with_score - stat.materials_with_signal,
  );
  const floorPct = (floorCount / total) * 100;
  // remainder = materials with no score row at all (background)

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 12,
          marginBottom: 5,
        }}
      >
        <span style={{ color: "var(--p-text-muted)" }}>{stat.label}</span>
        <span
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--p-text)" }}>
            {stat.materials_with_signal}
            <span
              style={{
                fontWeight: 400,
                color: "var(--p-text-muted)",
                marginLeft: 3,
              }}
            >
              {" "}/ {stat.total} have signal
            </span>
          </span>
          {floorCount > 0 && (
            <span style={{ fontSize: 11, color: "var(--p-text-faint)" }}>
              +{floorCount} at floor
            </span>
          )}
        </span>
      </div>

      {/* Stacked bar: signal (solid) + floor zeros (20% opacity overlay)
          + uncovered remainder (track background).  Mirrors the prior
          Score-run card's three-segment pattern. */}
      <div
        style={{
          height: 8,
          background: "var(--p-bg-muted)",
          borderRadius: 4,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            width: `${signalPct}%`,
            height: "100%",
            background: color,
            transition: "width 0.4s ease",
          }}
        />
        {floorPct > 0 && (
          <div
            style={{
              width: `${floorPct}%`,
              height: "100%",
              background: color,
              opacity: 0.2,
              transition: "width 0.4s ease",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function ScoreCoverageCard({
  pillars,
  isLoading,
}: ScoreCoverageCardProps) {
  if (isLoading) {
    return (
      <PlatformCard>
        <PlatformCardHeader
          title="Score coverage"
          subtitle="Scoped to launch list — share of materials with credible signal per pillar"
        />
        <PlatformCardBody>
          <Skeleton className="h-40 w-full" />
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  if (!pillars || pillars.length === 0) {
    return (
      <PlatformCard>
        <PlatformCardHeader title="Score coverage" />
        <PlatformCardBody>
          <div
            style={{
              color: "var(--p-text-muted)",
              fontSize: 13,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            No score data yet — run a market rescore to populate.
          </div>
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  const total = pillars[0]?.total ?? 0;

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Score coverage"
        subtitle={`Scoped to launch list (${total} materials) — share with credible signal per pillar`}
      />
      <PlatformCardBody>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pillars.map((p) => (
            <PillarRow key={p.name} stat={p} />
          ))}
        </div>

        {/* Legend — mirrors the prior Score-run card.  Solid = real
            signal, faint = score row exists at value 0 (fallback / floor),
            empty = no score row for that material × pillar. */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 16,
            fontSize: 11,
            color: "var(--p-text-faint)",
          }}
        >
          {[
            { label: "Has signal", opacity: 1, useColor: true },
            { label: "At floor", opacity: 0.2, useColor: true },
            { label: "Not scored", opacity: 1, useColor: false },
          ].map(({ label, opacity, useColor }) => (
            <span
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <span
                style={{
                  width: 10,
                  height: 6,
                  borderRadius: 2,
                  background: useColor
                    ? "var(--p-pillar-material)"
                    : "var(--p-bg-muted)",
                  opacity,
                  display: "inline-block",
                }}
              />
              {label}
            </span>
          ))}
        </div>
      </PlatformCardBody>
    </PlatformCard>
  );
}
