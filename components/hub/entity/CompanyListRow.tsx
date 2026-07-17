/**
 * Companies browse row — informative-first: no band chip (returns in
 * Phase 4 with company scoring).
 */

import Link from "next/link";
import type { PublicCompanyListItem } from "@/lib/api/entities";

export function CompanyListRow({ row }: { row: PublicCompanyListItem }) {
  return (
    <Link className="ih-list-row" href={`/intelligence/companies/${row.slug}`}>
      <div className="ih-list-main">
        <h3 className="ih-list-title">{row.name}</h3>
        {row.legal_name ? <div className="ih-list-sub">{row.legal_name}</div> : null}
        <div className="ih-list-facts">
          {row.stage_label ? <span className="ih-list-fact">{row.stage_label}</span> : null}
          {row.stage_label && row.hq_country ? <span className="ih-list-dot">·</span> : null}
          {row.hq_country ? <span className="ih-list-fact">{row.hq_country}</span> : null}
          {row.materials.length ? (
            <span className="ih-list-tags">
              {row.materials.map((m) => (
                <span key={m} className="ih-tag ih-tag-mat">{m}</span>
              ))}
            </span>
          ) : null}
        </div>
      </div>
      <div className="ih-list-aside">
        <span className="ih-list-arrow">→</span>
      </div>
    </Link>
  );
}
