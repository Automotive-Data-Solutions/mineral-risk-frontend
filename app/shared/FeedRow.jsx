/* global React */
function FeedRow({ row }) {
  const typeClass =
    row.type === "Analysis" ? "ih-badge-dark"
    : row.type === "Signal" ? "ih-badge-dark"
    : row.type === "News" ? "ih-badge-news"
    : "ih-badge-report";
  return (
    <article className="ih-feed-row">
      <div className="ih-feed-tags">
        <span className={"ih-badge " + typeClass}>
          {row.type}
          {row.type === "Report" ? " · PDF" : ""}
        </span>
        {row.materials.map((m) => (
          <span key={m} className="ih-tag ih-tag-mat">{m}</span>
        ))}
        {row.geographies.map((g) => (
          <span key={g} className="ih-tag ih-tag-geo">{g}</span>
        ))}
        <span className="ih-feed-meta">
          {row.date}
          {row.read ? ` · ${row.read} min` : ""}
        </span>
      </div>
      <h3 className="ih-feed-title">{row.title}</h3>
      {row.preview ? <p className="ih-feed-preview">{row.preview}</p> : null}
    </article>
  );
}

Object.assign(window, { FeedRow });
