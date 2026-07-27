"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  PlatformCard,
  PlatformCardBody,
  PlatformCardHeader,
} from "@/components/platform/platform-card";
import type { CoverageMatrix, CoverageMatrixRow } from "@/lib/types";

// ---------------------------------------------------------------------------
// Coverage matrix
// ---------------------------------------------------------------------------
//
// Per launch-list material × per source — event counts in the last 90
// days.  Originally also included a "Pillars" column group but that was
// too cramped against the source columns; pillar coverage has its own
// dedicated card (see pillar-coverage-card.tsx).  This card now focuses
// solely on the source half of the picture.
//
// Source cells render the 90-day event count; zero cells use a faint dash
// so the eye picks up gaps without scanning every cell for "0".  Weight
// scales with volume (faint for <5, normal for 5-19, bold for 20+).
//
// Sentinel rows (material_id = -1, i.e. launch-list materials missing from
// the Materials table altogether) get a muted background so the analyst
// can see at a glance which mineral is structurally absent vs. just
// thinly-covered.

interface CoverageMatrixCardProps {
  data: CoverageMatrix | null | undefined;
  isLoading?: boolean;
}

function SourceCell({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span style={{ color: "var(--p-text-faint)", fontSize: 12 }}>—</span>
    );
  }
  // Scale boldness with volume so the eye picks up heavy-coverage cells
  // without us having to color them.  Three tiers: faint, normal, bold.
  const weight = count >= 20 ? 600 : count >= 5 ? 500 : 400;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: weight,
        color: "var(--p-text)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {count}
    </span>
  );
}

function MatrixRow({
  row,
  sources,
}: {
  row: CoverageMatrixRow;
  sources: string[];
}) {
  const isSentinel = row.material_id === -1;
  return (
    <tr
      style={{
        borderBottom: "1px solid var(--p-rule)",
        background: isSentinel ? "var(--p-bg-subtle)" : undefined,
      }}
    >
      {/* Material name (sticky-feel — bold first column) */}
      <td
        style={{
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 500,
          color: isSentinel ? "var(--p-text-muted)" : "var(--p-text)",
          fontStyle: isSentinel ? "italic" : "normal",
          whiteSpace: "nowrap",
        }}
        title={
          isSentinel
            ? "Material not in the Materials table — launch-list entry without DB row"
            : undefined
        }
      >
        {row.canonical_name}
      </td>

      {/* Source cells */}
      {sources.map((src) => {
        const cell = row.sources.find((s) => s.source_name === src);
        return (
          <td
            key={src}
            style={{ padding: "10px 12px", textAlign: "center" }}
          >
            <SourceCell count={cell?.event_count_90d ?? 0} />
          </td>
        );
      })}
    </tr>
  );
}

export function CoverageMatrixCard({
  data,
  isLoading,
}: CoverageMatrixCardProps) {
  if (isLoading) {
    return (
      <PlatformCard>
        <PlatformCardHeader
          title="Coverage matrix"
          subtitle="Risk events in the last 90 days, per material × source · pillar score state"
        />
        <PlatformCardBody>
          <Skeleton className="h-64 w-full" />
        </PlatformCardBody>
      </PlatformCard>
    );
  }
  if (!data || data.rows.length === 0) {
    return (
      <PlatformCard>
        <PlatformCardHeader
          title="Coverage matrix"
          subtitle="No data available"
        />
        <PlatformCardBody>
          <div
            style={{
              color: "var(--p-text-muted)",
              fontSize: 13,
              textAlign: "center",
              padding: "16px 0",
            }}
          >
            No coverage data — run an ingest cycle first.
          </div>
        </PlatformCardBody>
      </PlatformCard>
    );
  }

  const sources = data.sources_in_order;

  return (
    <PlatformCard>
      <PlatformCardHeader
        title="Coverage matrix"
        subtitle={`Risk events in the last ${data.window_days} days per material × source.`}
      />
      <PlatformCardBody noPadding>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
              minWidth: 480,
            }}
          >
            <thead>
              {/* Column header row.  No column group now that pillars
                  live in a separate card — single row is enough. */}
              <tr
                style={{
                  background: "var(--p-bg-subtle)",
                  borderBottom: "1px solid var(--p-border)",
                }}
              >
                <th
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--p-text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Material
                </th>
                {sources.map((s) => (
                  <th
                    key={s}
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      color: "var(--p-text-muted)",
                      whiteSpace: "nowrap",
                    }}
                    // Abbreviate long source names; full name in tooltip
                    title={s}
                  >
                    {abbreviateSource(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <MatrixRow
                  key={row.canonical_name}
                  row={row}
                  sources={sources}
                />
              ))}
            </tbody>
          </table>
        </div>
      </PlatformCardBody>
    </PlatformCard>
  );
}

// ---------------------------------------------------------------------------
// Header abbreviations — keep the table readable at narrow widths.
// Tooltip on the <th> carries the full name so abbreviations don't lose
// information.
// ---------------------------------------------------------------------------

function abbreviateSource(name: string): string {
  // Common source names → 3-4 char chips
  const map: Record<string, string> = {
    "Global Trade Alert": "GTA",
    GTA: "GTA",
    "EUR-Lex": "EUR",
    "Federal Register": "FedReg",
    "UN Comtrade": "Comtrade",
    OpenSanctions: "OFAC",
    "IEA Policy Tracker": "IEA",
    "USGS MCS": "USGS",
    "SEC EDGAR": "EDGAR",
    "World Bank Pink Sheet": "Pink",
    Census: "Census",
  };
  return map[name] ?? name;
}
