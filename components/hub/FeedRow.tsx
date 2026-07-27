import Link from "next/link";
import { FeedPost } from "./types";

const RISK_LABEL: Record<string, string> = {
  low: "Low risk",
  med: "Med risk",
  high: "High risk",
  crit: "Critical risk",
};

/** Quickview facet cap (2026-07-22, Nicole): the feed card shows only a
 *  scannable subset — up to this many materials AND this many geographies,
 *  plus a "+N" overflow. Topic tags, entity tags, and pillar are
 *  DELIBERATELY not on the card: they aren't links here (no SEO value) and
 *  they crowd the quickview. Full tagging lives on the article detail page,
 *  which is where the crawlable internal links live too. */
const MAX_MATERIALS = 2;
const MAX_GEOS = 2;

interface FeedRowProps {
  row: FeedPost;
}

function badgeClass(type: FeedPost["type"]): string {
  if (type === "Report") return "ih-badge ih-badge-report";
  if (type === "News")   return "ih-badge ih-badge-news";
  return "ih-badge ih-badge-dark";
}

export function FeedRow({ row }: FeedRowProps) {
  const mats = row.materials.slice(0, MAX_MATERIALS);
  const geos = row.geographies.slice(0, MAX_GEOS);
  const overflow =
    (row.materials.length - mats.length) + (row.geographies.length - geos.length);

  return (
    <Link href={`/intelligence/${row.slug}`} className="ih-feed-row-link">
    <article className="ih-feed-row">
      <div className="ih-feed-tags">
        {row.pinned ? (
          <span className="ih-tag ih-tag-geo" title="Pinned by the editors">📌 Pinned</span>
        ) : null}
        <span className={badgeClass(row.type)}>
          {row.type}
          {row.type === "Report" ? " · PDF" : ""}
        </span>
        {row.riskBand ? (
          <span
            className={`ih-tag ih-risk-tag ih-mat-level-${row.riskBand}`}
            title="Editorial risk severity assigned by the author"
          >
            {RISK_LABEL[row.riskBand]}
          </span>
        ) : null}
        {mats.map((m) => (
          <span key={m} className="ih-tag ih-tag-mat">
            {m}
          </span>
        ))}
        {geos.map((g) => (
          <span key={g} className="ih-tag ih-tag-geo">
            {g}
          </span>
        ))}
        {overflow > 0 ? (
          <span
            className="ih-tag ih-tag-more"
            title="More materials & geographies — open the article for the full set"
          >
            +{overflow}
          </span>
        ) : null}
        <span className="ih-feed-meta">
          {row.date}
          {row.read ? ` · ${row.read} min` : ""}
        </span>
      </div>
      <h3 className="ih-feed-title">{row.title}</h3>
      {row.preview && <p className="ih-feed-preview">{row.preview}</p>}
    </article>
    </Link>
  );
}
