// Materials list screen

const MaterialsList = ({ onOpen }) => {
  const M = window.MRA_DATA.MATERIALS;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Materials</h1>
          <p>Canonical material registry. Click a row to compare against its HS-code mappings.</p>
        </div>
        <div className="row">
          <button className="btn btn-outline btn-sm"><I.alert size={13} /> All mismatched mappings <I.external size={11} /></button>
        </div>
      </div>

      <div className="banner banner-amber">
        <I.alert />
        <span style={{ flex: 1 }}>Some materials on this page have HS-code mappings the system flagged as suspect.</span>
        <button className="btn btn-ghost btn-sm" style={{ color: "#78350F" }}>Show only those</button>
      </div>

      <div className="filterbar">
        <div className="input-wrap">
          <I.search />
          <input className="input" placeholder="Search material name or symbol…" />
        </div>
        <select className="select"><option>All categories</option></select>
        <select className="select"><option>All criticality</option><option>IRA critical</option><option>EU CRMA</option></select>
        <select className="select"><option>Mapping health: any</option></select>
        <button className="btn btn-ghost btn-sm"><I.filter size={13} /> More filters</button>
        <span className="total">{M.length} materials</span>
      </div>

      <div className="table-wrap">
        <table className="dt">
          <thead><tr>
            <th>Material</th>
            <th>Critical</th>
            <th className="cell-right">Criticality</th>
            <th>Top sources</th>
            <th className="cell-right">Risk</th>
            <th className="cell-right">HS mappings</th>
            <th></th>
          </tr></thead>
          <tbody>
            {M.map(m => (
              <tr key={m.id} onClick={() => onOpen?.(m.id)}>
                <td>
                  <div className="col">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="row-primary">{m.name}</span>
                      {m.id === "lithium" || m.id === "graphite" ? <I.checkCircle size={13} style={{ color: "var(--risk-low)" }} /> : null}
                    </div>
                    <span className="row-secondary mono">{m.symbol} · {m.category}</span>
                  </div>
                </td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    {m.iraCritical && <span className="badge badge-blue">IRA critical</span>}
                    {m.euCrma && <span className="badge badge-violet">EU CRMA</span>}
                    {!m.iraCritical && !m.euCrma && <span className="muted small">—</span>}
                  </div>
                </td>
                <td className="cell-right cell-mono">{m.criticality}</td>
                <td>
                  <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                    {m.countries.slice(0, 4).map(c => (
                      <span className="country" key={c.code}>
                        <span className="flag">{c.flag}</span>{c.code}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="cell-right">
                  <span className={`score ${m.overallRisk >= 70 ? "score-high" : m.overallRisk >= 50 ? "score-med" : "score-low"}`}>
                    <span className={`badge-dot ${m.overallRisk >= 70 ? "dot-high" : m.overallRisk >= 50 ? "dot-med" : "dot-low"}`} />
                    {m.overallRisk.toFixed(1)}
                  </span>
                </td>
                <td className="cell-right">
                  <div className="col" style={{ alignItems: "flex-end" }}>
                    <span className="cell-mono">{m.hsMappings}</span>
                    {m.mismatches > 0 && (
                      <span className="row tiny" style={{ gap: 3, color: "#92400E" }}>
                        <I.alert size={11} /> {m.mismatches} suspect
                      </span>
                    )}
                  </div>
                </td>
                <td className="cell-right" style={{ width: 32 }}>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => e.stopPropagation()}><I.more size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ justifyContent: "space-between", color: "var(--text-muted)", fontSize: 12 }}>
        <div>Showing 1–{M.length} of 47</div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.5 }}>Previous</button>
          <span className="kbd">1</span><span className="muted">/</span><span className="muted">2</span>
          <button className="btn btn-outline btn-sm">Next</button>
        </div>
      </div>
    </div>
  );
};

window.MaterialsList = MaterialsList;
