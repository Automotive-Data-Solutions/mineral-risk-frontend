"use client";

import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useBreadcrumbContext } from "@/components/platform/breadcrumb-context";

// Static labels for known route segments.
// Dynamic segments (numeric IDs, slugs) fall back to the context or raw value.
const SEGMENT_LABELS: Record<string, string> = {
  dashboard:      "Overview",
  companies:      "Companies",
  materials:      "Materials",
  mismatches:     "Mismatches",
  chemistries:    "Chemistries",
  facilities:     "Facilities",
  "market-scores":"Market Scores",
  regulations:    "Regulations",
  "risk-events":  "Risk Events",
  admin:          "Admin",
  scoring:        "Scoring",
  ingestion:      "Ingestion",
  "seed-review":  "Seed Review",
  reports:        "Reports",
  new:            "New Report",
  scores:         "Risk Scores",
};

// Segments that are pure grouping prefixes in the URL (/data/materials) but
// don't represent a navigable page. They are silently skipped.
const SKIP_SEGMENTS = new Set(["data"]);

interface Crumb {
  label: string | null; // null = pending skeleton
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const { labels: contextLabels, pendingSegments } = useBreadcrumbContext();

  const crumbs: Crumb[] = [{ label: "Mineral Risk Analytics" }];

  const segments = pathname.split("/").filter(Boolean);

  segments.forEach((seg) => {
    if (SKIP_SEGMENTS.has(seg)) return;
    if (pendingSegments.has(seg)) {
      crumbs.push({ label: null }); // render as skeleton
    } else {
      const label = contextLabels[seg] ?? SEGMENT_LABELS[seg] ?? seg;
      crumbs.push({ label });
    }
  });

  return (
    <div className="p-crumbs">
      {crumbs.map((crumb, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="p-crumb-sep">/</span>}
          {crumb.label === null ? (
            <span className="p-crumb-skeleton" aria-hidden />
          ) : (
            <span className={i === crumbs.length - 1 ? "p-crumb-here" : ""}>
              {crumb.label}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
