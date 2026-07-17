import { FeedPost } from "./types";
import { pillarInfo } from "./pillars";

interface FeedRowProps {
  row: FeedPost;
}

function badgeClass(type: FeedPost["type"]): string {
  if (type === "Report") return "ih-badge ih-badge-report";
  if (type === "News")   return "ih-badge ih-badge-news";
  return "ih-badge ih-badge-dark";
}

export function FeedRow({ row }: FeedRowProps) {
  return (
    <article className="ih-feed-row">
      <div className="ih-feed-tags">
        {row.pinned ? (
          <span className="ih-tag ih-tag-geo" title="Pinned by the editors">📌 Pinned</span>
        ) : null}
        <span className={badgeClass(row.type)}>
          {row.type}
          {row.type === "Report" ? " · PDF" : ""}
        </span>
        {row.materials.map((m) => (
          <span key={m} className="ih-tag ih-tag-mat">
            {m}
          </span>
        ))}
        {row.geographies.map((g) => (
          <span key={g} className="ih-tag ih-tag-geo">
            {g}
          </span>
        ))}
        {(row.tags ?? []).map((t) => (
          <span key={t} className="ih-tag ih-tag-mat">
            {t}
          </span>
        ))}
        {row.pillar ? (
          <span
            className="ih-tag"
            style={{
              color: pillarInfo(row.pillar)?.color,
              borderColor: pillarInfo(row.pillar)?.color,
              backgroundColor: `${pillarInfo(row.pillar)?.color ?? "#888"}14`,
            }}
          >
            {row.pillar}
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
  );
}
