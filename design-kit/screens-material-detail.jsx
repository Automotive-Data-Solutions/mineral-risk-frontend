// Material detail screen (cobalt as exemplar)

const MaterialDetail = ({ id = "cobalt", onBack }) => {
  const m = window.MRA_DATA.MATERIALS.find(x => x.id === id) || window.MRA_DATA.MATERIALS[0];
  const [tab, setTab] = React.useState("overview");

  const PILLARS = [
    { key: "material",    label: "Mat. concentration", cls: "pillar-material" },
    { key: "geo",         label: "Geopolitical",       cls: "pillar-geo" },
    { key: "regulatory",  label: "Regulatory",         cls: "pillar-regulatory" },
    { key: "operational", label: "Operational",        cls: "pillar-operational" },
    { key: "financial",   label: "Financial pressure", cls: "pillar-financial" },
  ];

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><I.arrowLeft size={13} /> All materials</button>
        <div className="row">
          <button className="btn btn-outline btn-sm"><I.checkCircle size={13} /> Verified</button>
          <button className="btn btn-outline btn-sm"><I.flag size={13} /> Flag issue</button>
        </div>
      </div>

      <div className="detail-head">
        <div className="detail-title">
          <h1>{m.name}</h1>
          <div className="detail-meta">
            <span className="mono" style={{ fontWeight: 600, color: "var(--text)" }}>{m.symbol}</span>
            <span>·</span>
            <span>{m.category}</span>
            <span>·</span>
            {m.iraCritical && <span className="badge badge-blue">IRA critical</span>}
            {m.euCrma && <span className="badge badge-violet">EU CRMA</span>}
            <span>·</span>
            <span>data: high availability</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="kpi" style={{ padding: "8px 12px", border: 0, background: "transparent" }}>
            <div className="label">Overall risk</div>
            <div className="row" style={{ gap: 6, marginTop: 2 }}>
              <span className={`score ${m.overallRisk >= 70 ? "score-high" : m.overallRisk >= 50 ? "score-med" : "score-low"}`} style={{ fontSize: 13, padding: "3px 10px" }}>
                <span className={`badge-dot ${m.overallRisk >= 70 ? "dot-high" : m.overallRisk >= 50 ? "dot-med" : "dot-low"}`} />
                {m.overallRisk.toFixed(1)} · {m.overallRisk >= 70 ? "High" : m.overallRisk >= 50 ? "Med" : "Low"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="tabs">
          {[
            { id: "overview",  label: "Overview" },
            { id: "mappings",  label: "HS mappings", count: m.hsMappings },
            { id: "scores",    label: "Market scores", count: 12 },
            { id: "notes",     label: "Notes", count: 3 },
          ].map(t => (
            <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.count != null && <span className="count">{t.count}</span>}
            </div>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Material profile */}
            <div className="card">
              <div className="card-head"><div><h3>Material profile</h3></div></div>
              <div className="card-body">
                <div className="stat-grid">
                  <div className="stat"><div className="lbl">Symbol / code</div><div className="val mono">{m.symbol}</div></div>
                  <div className="stat"><div className="lbl">Category</div><div className="val">{m.category}</div></div>
                  <div className="stat"><div className="lbl">Data availability</div><div className="val">High</div></div>
                  <div className="stat"><div className="lbl">Price basis</div><div className="val mono">per metric ton</div></div>
                  <div className="stat"><div className="lbl">Patent trend</div><div className="val" style={{ color: "var(--risk-low)" }}>Declining</div></div>
                  <div className="stat" style={{ gridColumn: "span 3" }}>
                    <div className="lbl">Primary producing countries</div>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      {m.countries.map(c => (
                        <span className="country" key={c.code}>
                          <span className="flag">{c.flag}</span>{c.code} · {c.share}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="stat" style={{ gridColumn: "span 4" }}>
                    <div className="lbl">Analyst notes</div>
                    <div className="val" style={{ fontWeight: 400, color: "var(--text-muted)", lineHeight: 1.55 }}>
                      DRC concentration drives the material-concentration pillar. Recent Indonesian HPAL ramp partially offsets, but artisanal-mining inclusion in EU CRMA reporting creates a regulatory tail risk through 2027.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global risk score */}
            <div className="card">
              <div className="card-head">
                <div><h3>Global risk score</h3><div className="sub">{m.countries.length} geographies weighted · as of {m.asOf}</div></div>
              </div>
              <div className="card-body">
                <div className="score-grid">
                  <div className="score-cell overall">
                    <div className="lbl">Overall</div>
                    <div className="val">{m.overallRisk.toFixed(1)}</div>
                    <div className="pillar-strip" style={{ background: "var(--accent)" }} />
                  </div>
                  {PILLARS.map(p => (
                    <div className="score-cell" key={p.key}>
                      <div className="lbl">{p.label}</div>
                      <div className="val">{m.pillars[p.key]}</div>
                      <div className={`pillar-strip bar-fill ${p.cls}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Found in batteries */}
            <div className="card">
              <div className="card-head"><div><h3>Found in batteries</h3></div></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {m.chemistries.map(ch => (
                    <div key={ch} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px", background: "#fff" }}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{ch}</span>
                        <span className="score score-med" style={{ fontSize: 10 }}>0.{6 + (ch.length % 3)}</span>
                      </div>
                      <div className="tiny muted" style={{ marginTop: 4 }}>Cathode active material</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HS-mapping health */}
            <div className="card">
              <div className="card-head">
                <div><h3>HS-mapping health</h3></div>
                <button className="btn btn-outline btn-sm" onClick={() => setTab("mappings")}>Open mappings <I.chevronRight size={12} /></button>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { lbl: "Total mappings", val: m.hsMappings, tone: "ok" },
                    { lbl: "Suspect (any reason)", val: m.mismatches, tone: m.mismatches > 0 ? "amber" : "ok" },
                    { lbl: "Low confidence", val: 1, tone: "amber" },
                    { lbl: "Missing description", val: 0, tone: "ok" },
                  ].map((s, i) => (
                    <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px" }}>
                      <div className="lbl tiny muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{s.lbl}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: s.tone === "amber" ? "#92400E" : "var(--text)" }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "mappings" && (
          <div className="card">
            <div className="card-head"><div><h3>HS code mappings</h3><div className="sub">{m.hsMappings} mappings · {m.mismatches} flagged as suspect</div></div></div>
            <div style={{ padding: 0 }}>
              <table className="dt">
                <thead><tr>
                  <th>HS prefix</th>
                  <th>Customs description</th>
                  <th>Mapped to</th>
                  <th className="cell-right">Confidence</th>
                  <th>Status</th>
                </tr></thead>
                <tbody>
                  {[
                    { hs: "8105.20", desc: "Cobalt mattes and intermediate products of metallurgy", conf: 0.94, status: "ok" },
                    { hs: "8105.30", desc: "Cobalt waste and scrap", conf: 0.88, status: "ok" },
                    { hs: "2822.00", desc: "Cobalt oxides and hydroxides; commercial cobalt oxides", conf: 0.61, status: "suspect" },
                    { hs: "2605.00", desc: "Cobalt ores and concentrates", conf: 0.92, status: "ok" },
                    { hs: "8105.90", desc: "Cobalt; articles thereof, n.e.s.", conf: 0.45, status: "low_conf" },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="cell-mono" style={{ fontWeight: 500 }}>{r.hs}</td>
                      <td className="small">{r.desc}</td>
                      <td>{m.name}</td>
                      <td className="cell-right cell-mono">{r.conf.toFixed(2)}</td>
                      <td>
                        {r.status === "ok" && <span className="badge badge-emerald"><I.check size={10} /> OK</span>}
                        {r.status === "suspect" && <span className="badge badge-rose"><I.alert size={10} /> Suspect</span>}
                        {r.status === "low_conf" && <span className="badge badge-amber"><I.alert size={10} /> Low conf.</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "scores" && (
          <div className="card">
            <div className="card-head"><div><h3>Country-level risk scores</h3><div className="sub">Sorted by overall risk descending</div></div></div>
            <div style={{ padding: 0 }}>
              <table className="dt">
                <thead><tr>
                  <th>Country</th>
                  <th className="cell-right">Overall</th>
                  <th className="cell-right">Mat. conc.</th>
                  <th className="cell-right">Geopolitical</th>
                  <th className="cell-right">Regulatory</th>
                  <th className="cell-right">Operational</th>
                  <th className="cell-right">Financial</th>
                  <th className="cell-right">Events</th>
                  <th className="cell-right">As of</th>
                </tr></thead>
                <tbody>
                  {m.countries.map((c, i) => {
                    const base = m.overallRisk - (i * 6);
                    return (
                      <tr key={c.code}>
                        <td><span className="country"><span className="flag">{c.flag}</span>{c.code}</span></td>
                        <td className="cell-right"><span className={`score ${base >= 70 ? "score-high" : base >= 50 ? "score-med" : "score-low"}`}>{Math.max(20, base).toFixed(1)}</span></td>
                        {[m.pillars.material, m.pillars.geo, m.pillars.regulatory, m.pillars.operational, m.pillars.financial].map((v, j) => (
                          <td className="cell-right cell-mono" key={j}>{Math.max(15, v - i*8)}</td>
                        ))}
                        <td className="cell-right cell-mono">{14 - i*2}</td>
                        <td className="cell-right tiny muted">{m.asOf}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="card">
            <div className="card-head"><div><h3>Analyst notes</h3></div></div>
            <div style={{ padding: 0 }}>
              {window.MRA_DATA.RECENT_NOTES.slice(0, 3).map((n, i) => (
                <div key={n.id} style={{ padding: "12px 16px", borderTop: i === 0 ? "none" : "1px solid var(--rule)" }}>
                  <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                    {n.type === "data_error" && <span className="badge badge-rose">Data error</span>}
                    {n.type === "outdated" && <span className="badge badge-amber">Outdated</span>}
                    {n.type === "missing_data" && <span className="badge badge-amber">Missing data</span>}
                    <span className="small muted">by {n.who} · {n.when}</span>
                  </div>
                  <div className="small" style={{ lineHeight: 1.55 }}>{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

window.MaterialDetail = MaterialDetail;
