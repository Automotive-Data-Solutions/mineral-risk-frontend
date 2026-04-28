import { FeedPost } from "./types";

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
