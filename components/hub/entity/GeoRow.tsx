/**
 * Geographic-footprint row — "market + map" v4 (2026-07-21). One row per
 * country the company operates or sources in: country tag + activity
 * summary, short max-level label right, then chips with each material's
 * L1 score AT this place. This is the only section with per-geography
 * scores. Rows arrive sorted riskiest country first (server sorts on
 * the max chip).
 */

import type { GeoFootprintOut } from "@/lib/api/entities";

const LEVEL_LABEL: Record<string, string> = {
  crit: "Crit",
  high: "High",
  med: "Med",
  low: "Low",
};

/** Long canonical names → chip-width display names (same map family as
 *  the sidebar's). */
const SHORT_NAME: Record<string, string> = {
  "Natural Graphite": "Nat. Graphite",
  "Synthetic Graphite": "Syn. Graphite",
  "Rare Earth Elements": "Rare Earths",
  "Silicon (Anode Grade)": "Silicon (Anode)",
  "Platinum-Group Metals": "PGMs",
};

function summary(row: GeoFootprintOut): string {
  const parts: string[] = [];
  if (row.facility_count > 0) {
    parts.push(
      `${row.facility_count} ${row.facility_count === 1 ? "facility" : "facilities"}` +
        (row.activities.length ? ` — ${row.activities.join(", ")}` : ""),
    );
  }
  if (row.sourcing_materials.length > 0) {
    parts.push(`sources ${row.sourcing_materials.join(", ").toLowerCase()}`);
  }
  return parts.join(" · ") || "—";
}

export function GeoRow({ row }: { row: GeoFootprintOut }) {
  const level = row.location_risk?.level ?? null;
  return (
    <div className="ih-geo-row">
      <div className="ih-geo-head">
        <span className="ih-tag ih-tag-geo">{row.country}</span>
        <span className="ih-geo-summary">{summary(row)}</span>
        <span
          className={`ih-geo-level ${level ? `ih-mat-level-${level}` : "ih-mat-level-none"}`}
          title={level ? "Highest material risk at this location" : "No scored materials at this location"}
        >
          {level ? LEVEL_LABEL[level] : "—"}
        </span>
      </div>
      {row.materials.length > 0 ? (
        <div className="ih-geo-mats">
          {row.materials.map((m) => (
            <span
              key={m.material}
              className={`ih-geo-mat-chip ih-mat-level-${m.level}`}
              title={`${m.material} at ${row.country} — material × geography risk`}
            >
              {SHORT_NAME[m.material] ?? m.material} {m.score.toFixed(1)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
