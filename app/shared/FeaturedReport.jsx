/* global React */
function FeaturedReport() {
  return (
    <article className="ih-featured">
      <div className="ih-featured-tags">
        <span className="ih-badge ih-badge-report">Report · PDF</span>
        <span className="ih-tag ih-tag-mat">Graphite</span>
        <span className="ih-tag ih-tag-geo">CN</span>
        <span className="ih-featured-meta">Apr 2026 · 18 pages</span>
      </div>
      <h2 className="ih-featured-title">
        China graphite export licensing — supply chain exposure report Q1 2026
      </h2>
      <p className="ih-featured-lede">
        The April 17 revision to the FEOC interim guidance narrows the qualifying
        processing-step definition for graphite. Three pathways remain compliant
        under the revised rule; this report walks through each, with examples
        drawn from announced 2025–2027 cathode programs.
      </p>
      <div className="ih-callouts">
        <div className="ih-callout ih-callout-high">
          <div className="ih-callout-v">High</div>
          <div className="ih-callout-l">concentration risk</div>
        </div>
        <div className="ih-callout ih-callout-med">
          <div className="ih-callout-v">73%</div>
          <div className="ih-callout-l">processed in CN</div>
        </div>
        <div className="ih-callout ih-callout-neutral">
          <div className="ih-callout-v">18 pp</div>
          <div className="ih-callout-l">FEOC-eligible</div>
        </div>
      </div>
      <a className="ih-cta">Download PDF →</a>
    </article>
  );
}

Object.assign(window, { FeaturedReport });
