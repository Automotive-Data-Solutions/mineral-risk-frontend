/**
 * Fixed 3-stage regulation timeline: Proposed → Enacted → Effective
 * (Nicole 2026-07-15 — revision/amendment nodes cut, no tracking data).
 * The backend always sends exactly these three nodes; `active` marks the
 * current stage, `future` the unreached ones. Dates attach where known
 * (publication_date / effective_date; Enacted has no date column).
 */

import type { TimelineNodeOut } from "@/lib/api/entities";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TimelineStrip({ nodes }: { nodes: TimelineNodeOut[] }) {
  if (!nodes.length) return null;
  return (
    <div className="ih-timeline">
      {nodes.map((n, i) => {
        const date = formatDate(n.date);
        return (
          <div
            key={i}
            className={
              "ih-timeline-node" +
              (n.active ? " is-active" : "") +
              (n.future ? " is-future" : "")
            }
          >
            <div className="ih-timeline-dot" />
            <div className="ih-timeline-body">
              <div className="ih-timeline-label">{n.label}</div>
              {date ? <div className="ih-timeline-date ih-mono">{date}</div> : null}
              {n.note ? <div className="ih-timeline-note">{n.note}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
