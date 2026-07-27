/* global React */
function TypeLegend() {
  const cards = [
    { type: "Analysis", desc: "Long-form, data-backed analytical pieces" },
    { type: "Signal", desc: "Short-form alerts — a new event or data point" },
    { type: "Report", desc: "Downloadable PDF, citable research documents", isReport: true },
    { type: "News", desc: "Curated external coverage with context added", isNews: true },
  ];
  return (
    <div className="ih-legend">
      {cards.map((c) => (
        <div key={c.type} className="ih-legend-card">
          <span
            className={
              "ih-badge" +
              (c.isReport ? " ih-badge-report" : c.isNews ? " ih-badge-news" : " ih-badge-dark")
            }
          >
            {c.type}
            {c.isReport ? " · PDF" : ""}
          </span>
          <p className="ih-legend-desc">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { TypeLegend });
