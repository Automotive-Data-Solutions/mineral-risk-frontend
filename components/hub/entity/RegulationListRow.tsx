import Link from "next/link";
import type { PublicRegulationListItem } from "@/lib/api/entities";

function formatEffective(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function RegulationListRow({ row }: { row: PublicRegulationListItem }) {
  return (
    <Link
      className="ih-list-row"
      href={`/intelligence/regulations/${encodeURIComponent(row.regulation_key)}`}
    >
      <div className="ih-list-main">
        <div className="ih-list-key ih-mono">{row.regulation_key}</div>
        <h3 className="ih-list-title">{row.title ?? row.regulation_key}</h3>
        <div className="ih-list-facts">
          {row.issuer ? <span className="ih-list-fact">{row.issuer}</span> : null}
          {row.geography ? <span className="ih-tag ih-tag-geo">{row.geography}</span> : null}
          <span className="ih-list-fact ih-list-theme">{row.theme ?? "—"}</span>
        </div>
      </div>
      <div className="ih-list-aside">
        {row.status ? (
          <span className={"ih-status-pill ih-status-" + (row.status_level ?? "proposed")}>
            {row.status}
          </span>
        ) : null}
        <span className="ih-list-eff ih-mono">{formatEffective(row.effective_date)}</span>
        <span className="ih-list-arrow">→</span>
      </div>
    </Link>
  );
}
