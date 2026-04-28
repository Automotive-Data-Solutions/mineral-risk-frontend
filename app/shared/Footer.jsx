/* global React */
function Footer() {
  return (
    <footer className="ih-footer">
      <div className="ih-footer-inner">
        <div className="ih-footer-brand">
          <img src="../../assets/logo-mra-outline.svg" alt="" className="ih-logo" />
          <div>
            <div className="ih-footer-wm">Mineral Risk Analytics</div>
            <div className="ih-footer-tag">Supply Chain Intelligence</div>
          </div>
        </div>
        <div className="ih-footer-cols">
          <div>
            <div className="ih-footer-h">Intelligence</div>
            <a>Analysis</a>
            <a>Signals</a>
            <a>Reports</a>
            <a>News</a>
          </div>
          <div>
            <div className="ih-footer-h">Pillars</div>
            <a>Material concentration</a>
            <a>Geopolitical trade</a>
            <a>Regulatory compliance</a>
            <a>Operational</a>
          </div>
          <div>
            <div className="ih-footer-h">About</div>
            <a>Methodology</a>
            <a>Contact</a>
            <a>Subscribe</a>
          </div>
        </div>
      </div>
      <div className="ih-footer-base">
        <span>© 2026 Mineral Risk Analytics</span>
        <span className="ih-mono">CN · DRC · CL · ID · AU</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
