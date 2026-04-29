// Sidebar + Topbar shell

const Sidebar = ({ active, onNavigate }) => {
  const items = [
    { id: "overview",    label: "Overview",    icon: I.layout },
  ];
  const supplyChain = [
    { id: "companies",   label: "Companies",   icon: I.building },
    { id: "materials",   label: "Materials",   icon: I.layers },
    { id: "chemistries", label: "Chemistries", icon: I.flask },
  ];
  const intel = [
    { id: "scores",      label: "Market scores",  icon: I.bar },
    { id: "events",      label: "Risk events",    icon: I.alert },
    { id: "regs",        label: "Regulations",    icon: I.scale },
  ];

  const Link = ({ item }) => (
    <div
      className={`sidebar-link ${active === item.id ? "active" : ""}`}
      onClick={() => onNavigate?.(item.id)}
    >
      <item.icon />
      <span>{item.label}</span>
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="tile">
          <span className="num">83</span>
          <span className="glyph">MRa</span>
        </div>
        <div className="name">
          Mineral Risk
          <span className="sub">Analytics</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div>
          {items.map((it) => <Link key={it.id} item={it} />)}
        </div>
        <div>
          <div className="sidebar-section-label">Supply chain</div>
          {supplyChain.map((it) => <Link key={it.id} item={it} />)}
        </div>
        <div>
          <div className="sidebar-section-label">Intelligence</div>
          {intel.map((it) => <Link key={it.id} item={it} />)}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">MR</div>
          <div className="who">
            M. Reyes
            <small>Analyst · Acme Capital</small>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs }) => (
  <div className="topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={i === crumbs.length - 1 ? "here" : ""}>{c}</span>
          {i < crumbs.length - 1 && <span className="sep">/</span>}
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-search">
      <I.search />
      <input placeholder="Search materials, companies, regulations…" />
    </div>
    <div className="topbar-actions">
      <button className="btn btn-ghost btn-sm" title="Notifications">
        <I.bell />
      </button>
      <span className="kbd">⌘K</span>
    </div>
  </div>
);

window.Sidebar = Sidebar;
window.Topbar = Topbar;
