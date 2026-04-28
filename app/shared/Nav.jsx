/* global React */
const { useState } = React;

function Nav({ activeTab, onTab }) {
  const tabs = ["All", "Analysis", "Signal", "Report", "News"];
  return (
    <header className="ih-nav-wrap">
      <div className="ih-gradient-bar" />
      <div className="ih-nav">
        <div className="ih-nav-brand">
          <img src="../../assets/logo-mra-outline.svg" alt="" className="ih-logo" />
          <div className="ih-wm">Mineral Risk Analytics</div>
        </div>
        <nav className="ih-nav-links">
          <a>Intelligence</a>
          <a>Reports</a>
          <a>About</a>
          <button className="ih-btn-primary">Subscribe</button>
        </nav>
      </div>
      <div className="ih-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={"ih-tab" + (t === activeTab ? " is-active" : "")}
            onClick={() => onTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </header>
  );
}

Object.assign(window, { Nav });
