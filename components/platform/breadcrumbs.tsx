"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";

// Map path segments to human-readable labels.
// Dynamic segments (e.g. [id]) fall back to the raw segment value.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Overview",
  companies: "Companies",
  data: "Data",
  materials: "Materials",
  mismatches: "Mismatches",
  chemistries: "Chemistries",
  facilities: "Facilities",
  "market-scores": "Market Scores",
  regulations: "Regulations",
  "risk-events": "Risk Events",
  admin: "Admin",
  scoring: "Scoring",
  ingestion: "Ingestion",
  "seed-review": "Seed Review",
  reports: "Reports",
  new: "New Report",
  scores: "Risk Scores",
};

// Section groupings — shown as intermediate crumbs before the segment label.
const SECTION_PREFIXES: Record<string, string> = {
  data: "Supply Chain",
};

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  // Build crumb list: always start with brand root
  const crumbs: string[] = ["Mineral Risk Analytics"];

  const segments = pathname.split("/").filter(Boolean);

  // Inject section heading if the first meaningful segment is in SECTION_PREFIXES
  if (segments[0] != null && SECTION_PREFIXES[segments[0]] != null) {
    crumbs.push(SECTION_PREFIXES[segments[0]]!);
  }

  segments.forEach((seg) => {
    const label = labelFor(seg);
    // Skip the "data" segment itself — it's only used for the section prefix
    if (seg === "data") return;
    crumbs.push(label);
  });

  return (
    <div className="p-crumbs">
      {crumbs.map((crumb, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="p-crumb-sep">/</span>}
          <span className={i === crumbs.length - 1 ? "p-crumb-here" : ""}>
            {crumb}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
