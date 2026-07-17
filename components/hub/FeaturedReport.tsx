import { FeaturedPost } from "./types";

interface FeaturedReportProps {
  post: FeaturedPost;
}

export function FeaturedReport({ post }: FeaturedReportProps) {
  return (
    <article className="ih-featured">
      <div className="ih-featured-tags">
        <span className="ih-badge ih-badge-report">
          {post.type}
          {post.type === "Report" ? " · PDF" : ""}
        </span>
        {post.materials.map((m) => (
          <span key={m} className="ih-tag ih-tag-mat">
            {m}
          </span>
        ))}
        {post.geographies.map((g) => (
          <span key={g} className="ih-tag ih-tag-geo">
            {g}
          </span>
        ))}
        <span className="ih-featured-meta">
          {post.date}{post.pages ? ` · ${post.pages} pages` : ""}
        </span>
      </div>

      <h2 className="ih-featured-title">{post.title}</h2>
      <p className="ih-featured-lede">{post.lede}</p>

      <div className="ih-callouts">
        {(post.callouts ?? []).map((c, i) => (
          <div key={i} className={`ih-callout ih-callout-${c.variant}`}>
            <div className="ih-callout-v">{c.value}</div>
            <div className="ih-callout-l">{c.label}</div>
          </div>
        ))}
      </div>

      <a
        href={post.ctaHref ?? "#"}
        className="ih-cta"
      >
        {post.ctaLabel ?? "Download PDF →"}
      </a>
    </article>
  );
}
