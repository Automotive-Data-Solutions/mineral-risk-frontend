// Overview / Dashboard screen

const Overview = () => {
  const M = window.MRA_DATA.MATERIALS;
  const N = window.MRA_DATA.RECENT_NOTES;

  const KPIS = [
    { label: "Materials tracked", value: "47", sub: <><span className="delta-up">+3</span><span className="muted">this quarter</span></> },
    { label: "Companies scored", value: "1,284", sub: <><span className="muted">of 1,612 ·</span><span>80%</span></> },
    { label: "Suspect mappings", value: "23", sub: <><span className="delta-down">+6</span><span className="muted">since last run</span></> },
    { label: "Notes (7d)", value: "18", sub: <><span className="muted">across 12 entities</span></> },
  ];

  const stages = [
    { label: "Mining",      value: 312 },
    { label: "Refining",    value: 184 },
    { label: "Cathode",     value: 226 },
    { label: "Cell maker",  value: 271 },
    { label: "Pack / OEM",  value: 167 },
    { label: "Recycling",   value: 124 },
  ];
  const stageMax = Math.max(...stages.map(s => s.value));

  const topRisk = [...M].sort((a,b) => b.overallRisk - a.overallRisk).slice(0, 5);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p>Coverage, scoring progress, and recent analyst activity across the scoring engine.</p>
        </div>
        <div className="row">
          <button className="btn btn-outline btn-sm"><I.refresh size={13} /> Refresh data</button>
          <button className="btn btn-primary btn-sm"><I.download size={13} /> Export</button>
        </div>
      </div>

      <div className="kpi-grid">
        {KPIS.map((k, i) => (
          <div className="kpi" key={i}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Top materials by risk</h3>
              <div className="sub">Global risk score, weighted by trade exposure</div>
            </div>
            <button className="btn btn-ghost btn-sm">View all <I.arrowRight size={12} /></button>
          </div>
          <div style={{ padding: 0 }}>
            <table className="dt">
              <thead><tr>
                <th>Material</th>
                <th>Concentration</th>
                <th className="cell-right">Risk</th>
                <th>Trend</th>
              </tr></thead>
              <tbody>
                {topRisk.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="row">
                        <span className="row" style={{ gap: 6 }}>
                          <span className="badge-dot dot-accent" />
                          <span className="row-primary">{m.name}</span>
                        </span>
                      </div>
                      <div className="row-secondary mono">{m.symbol} · {m.category}</div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {m.countries.slice(0, 3).map(c => (
                          <span className="country" key={c.code}>
                            <span className="flag">{c.flag}</span>{c.code} · {c.share}%
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="cell-right">
                      <span className={`score ${m.overallRisk >= 70 ? "score-high" : m.overallRisk >= 50 ? "score-med" : "score-low"}`}>
                        {m.overallRisk.toFixed(1)} · {m.overallRisk >= 70 ? "High" : m.overallRisk >= 50 ? "Med" : "Low"}
                      </span>
                    </td>
                    <td>
                      {m.trend === "rising" && <span className="trend-up row" style={{ gap: 4 }}><I.trendUp size={13} /> <span className="small">Rising</span></span>}
                      {m.trend === "stable" && <span className="trend-flat row" style={{ gap: 4 }}><I.minus size={13} /> <span className="small">Stable</span></span>}
                      {m.trend === "declining" && <span className="trend-down row" style={{ gap: 4 }}><I.trendDown size={13} /> <span className="small">Declining</span></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Companies by stage</h3><div className="sub">Distribution across the supply chain</div></div></div>
          <div className="card-body">
            <div className="bar-list">
              {stages.map(s => (
                <div className="bar-row" key={s.label}>
                  <div className="bar-row-top">
                    <span className="lbl">{s.label}</span>
                    <span className="val tabular">{s.value}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(s.value/stageMax)*100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-head"><div><h3>Score-run progress</h3><div className="sub">Last full run: Apr 21, 2026 · 14:32 UTC</div></div></div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div>
                <div className="kpi" style={{ padding: 12 }}>
                  <div className="label">Geographies</div>
                  <div className="value" style={{ fontSize: 20 }}>34<span className="muted small" style={{ fontWeight: 400 }}> / 38</span></div>
                </div>
              </div>
              <div>
                <div className="kpi" style={{ padding: 12 }}>
                  <div className="label">Materials</div>
                  <div className="value" style={{ fontSize: 20 }}>47<span className="muted small" style={{ fontWeight: 400 }}> / 47</span></div>
                </div>
              </div>
              <div>
                <div className="kpi" style={{ padding: 12 }}>
                  <div className="label">Pillars</div>
                  <div className="value" style={{ fontSize: 20 }}>5<span className="muted small" style={{ fontWeight: 400 }}> / 5</span></div>
                </div>
              </div>
            </div>
            <div className="bar-list" style={{ marginTop: 14 }}>
              {[
                { lbl: "Material concentration", val: 94, cls: "pillar-material" },
                { lbl: "Geopolitical / trade",  val: 88, cls: "pillar-geo" },
                { lbl: "Regulatory compliance", val: 76, cls: "pillar-regulatory" },
                { lbl: "Operational",           val: 71, cls: "pillar-operational" },
                { lbl: "Financial pressure",    val: 64, cls: "pillar-financial" },
              ].map(p => (
                <div className="bar-row" key={p.lbl}>
                  <div className="bar-row-top">
                    <span className="lbl">{p.lbl}</span>
                    <span className="val tabular">{p.val}% complete</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill ${p.cls}`} style={{ width: `${p.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Recent analyst activity</h3><div className="sub">Notes flagged in the last 7 days</div></div></div>
          <div style={{ padding: 0 }}>
            {N.map((n, i) => (
              <div key={n.id} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--rule)" }}>
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="badge badge-soft">{n.who}</span>
                    <span className="small muted">on</span>
                    <span className="small" style={{ fontWeight: 500 }}>{n.entity}</span>
                  </div>
                  <span className="tiny faint">{n.when}</span>
                </div>
                <div className="row" style={{ gap: 6, marginBottom: 4 }}>
                  {n.type === "data_error" && <span className="badge badge-rose">Data error</span>}
                  {n.type === "outdated" && <span className="badge badge-amber">Outdated</span>}
                  {n.type === "missing_data" && <span className="badge badge-amber">Missing data</span>}
                </div>
                <div className="small muted" style={{ lineHeight: 1.5 }}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Overview = Overview;
