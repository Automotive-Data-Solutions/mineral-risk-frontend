/* global React */
function Sidebar() {
  const materials = [
    { name: "Lithium", level: "High", pct: 78 },
    { name: "Graphite", level: "High", pct: 82 },
    { name: "Cobalt", level: "Med", pct: 55 },
    { name: "Nickel", level: "Med", pct: 48 },
    { name: "Manganese", level: "Low", pct: 22 },
  ];
  const pillars = [
    { name: "Material Concentration", count: 12, color: "#7A4A8E" },
    { name: "Geopolitical Trade", count: 9, color: "#1F6B8A" },
    { name: "Regulatory Compliance", count: 14, color: "#C8623A" },
    { name: "Operational", count: 7, color: "#6B5B3A" },
    { name: "Financial Pressure", count: 5, color: "#3B6E55" },
  ];
  return (
    <aside className="ih-sidebar">
      <section className="ih-side-block">
        <div className="ih-eyebrow">Material risk</div>
        <div className="ih-mat-list">
          {materials.map((m) => (
            <div key={m.name} className="ih-mat-row">
              <span className="ih-mat-name">{m.name}</span>
              <div className="ih-mat-track">
                <div
                  className={"ih-mat-fill ih-mat-" + m.level.toLowerCase()}
                  style={{ width: m.pct + "%" }}
                />
              </div>
              <span className={"ih-mat-level ih-mat-level-" + m.level.toLowerCase()}>
                {m.level}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="ih-side-block">
        <div className="ih-eyebrow">Browse by pillar</div>
        <div className="ih-pillars">
          {pillars.map((p) => (
            <button key={p.name} className="ih-pillar-btn" style={{ color: p.color }}>
              <span className="ih-pillar-l">
                <span className="ih-pillar-dot" style={{ background: p.color }} />
                {p.name}
              </span>
              <span className="ih-pillar-n">{p.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ih-side-block ih-subscribe">
        <div className="ih-eyebrow ih-eyebrow-on-dark">Subscribe</div>
        <p className="ih-subscribe-copy">
          Weekly intelligence digest — new analysis, signals, and reports.
        </p>
        <input type="email" placeholder="your@email.com" />
        <button className="ih-btn-primary ih-btn-block">Subscribe →</button>
      </section>
    </aside>
  );
}

Object.assign(window, { Sidebar });
