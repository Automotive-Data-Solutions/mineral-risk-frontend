// Chemistries screen

const Chemistries = () => {
  const C = window.MRA_DATA.CHEMISTRIES;
  const [view, setView] = React.useState("grid");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Chemistries</h1>
          <p>Catalogued battery chemistries, with material composition and downstream OEM coverage.</p>
        </div>
        <div className="row">
          <button className="btn btn-outline btn-sm"><I.download size={13} /> Export CSV</button>
          <button className="btn btn-primary btn-sm"><I.plus size={13} /> New chemistry</button>
        </div>
      </div>

      <div className="filterbar">
        <div className="input-wrap">
          <I.search />
          <input className="input" placeholder="Search chemistries…" />
        </div>
        <select className="select"><option>All families</option><option>NMC</option><option>LFP</option><option>NCA</option><option>Solid-state</option></select>
        <select className="select"><option>Any risk band</option><option>High</option><option>Medium</option><option>Low</option></select>
        <div className="row" style={{ marginLeft: "auto", gap: 4, border: "1px solid var(--border)", borderRadius: 4, padding: 2 }}>
          <button className={`btn btn-sm ${view === "grid" ? "btn-outline" : "btn-ghost"}`} style={{ height: 24 }} onClick={() => setView("grid")}>Grid</button>
          <button className={`btn btn-sm ${view === "table" ? "btn-outline" : "btn-ghost"}`} style={{ height: 24 }} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {C.map(c => (
            <div className="card" key={c.id} style={{ cursor: "pointer", transition: "border-color 120ms ease" }}>
              <div className="card-body">
                <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{c.name}</span>
                  <span className={`score ${c.risk >= 70 ? "score-high" : c.risk >= 50 ? "score-med" : "score-low"}`}>
                    <span className={`badge-dot ${c.risk >= 70 ? "dot-high" : c.risk >= 50 ? "dot-med" : "dot-low"}`} />
                    {c.risk}
                  </span>
                </div>
                <div className="row" style={{ gap: 4, marginBottom: 10 }}>
                  <span className="badge badge-slate">{c.family}</span>
                  <span className="tiny muted mono">{c.energy}</span>
                </div>
                <div className="tiny muted" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Composition</div>
                <div className="small mono" style={{ marginBottom: 10, color: "var(--text)" }}>{c.mix}</div>
                <div className="tiny muted" style={{ marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Materials</div>
                <div className="row" style={{ gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {c.materials.map(m => <span className="badge badge-outline mono" key={m}>{m}</span>)}
                </div>
                <div className="row" style={{ justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--rule)" }}>
                  <span className="tiny"><span className="muted">Cells</span> <span className="mono" style={{ fontWeight: 500 }}>{c.cells.toLocaleString()}</span></span>
                  <span className="tiny"><span className="muted">OEMs</span> <span className="mono" style={{ fontWeight: 500 }}>{c.oems}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="dt">
            <thead><tr>
              <th>Chemistry</th><th>Family</th><th>Composition</th><th>Materials</th>
              <th className="cell-right">Energy</th><th className="cell-right">Cells</th>
              <th className="cell-right">OEMs</th><th className="cell-right">Risk</th>
            </tr></thead>
            <tbody>
              {C.map(c => (
                <tr key={c.id}>
                  <td className="row-primary">{c.name}</td>
                  <td><span className="badge badge-slate">{c.family}</span></td>
                  <td className="cell-mono small">{c.mix}</td>
                  <td><div className="row" style={{ gap: 3, flexWrap: "wrap" }}>{c.materials.map(m => <span className="badge badge-outline mono" key={m}>{m}</span>)}</div></td>
                  <td className="cell-right cell-mono">{c.energy}</td>
                  <td className="cell-right cell-mono">{c.cells.toLocaleString()}</td>
                  <td className="cell-right cell-mono">{c.oems}</td>
                  <td className="cell-right">
                    <span className={`score ${c.risk >= 70 ? "score-high" : c.risk >= 50 ? "score-med" : "score-low"}`}>{c.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

window.Chemistries = Chemistries;
