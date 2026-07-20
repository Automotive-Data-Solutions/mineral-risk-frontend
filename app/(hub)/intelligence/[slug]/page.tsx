"use client";

/**
 * Public insight-post article — /intelligence/[slug].
 * Single layout serves all four content types (analysis / signal / report /
 * news); type chip color changes but the rest of the layout is shared
 * (Nicole 2026-07-19). Reports additionally surface a PDF download when
 * pdf_url is set.
 *
 * Wine + Stone hub renderer (HubArticleRenderer) — do NOT reuse the admin
 * ArticleRenderer here; it's Cool Slate/shadcn-themed and would drift.
 *
 * Public API GET /intelligence/posts/{slug} only returns status='published'
 * (drafts / archived → 404).
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Nav } from "@/components/hub/Nav";
import { Breadcrumb } from "@/components/hub/entity/Breadcrumb";
import { Footer } from "@/components/hub/Footer";
import { HubArticleRenderer } from "@/components/hub/HubArticleRenderer";
import {
  getPublicPost,
  type PublicInsightPost,
  type ContentType,
} from "@/lib/api/hub-insights";
import { pillarInfo } from "@/components/hub/pillars";

const TYPE_LABEL: Record<ContentType, string> = {
  analysis: "Analysis",
  signal: "Signal",
  report: "Report",
  news: "News",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<PublicInsightPost | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!params?.slug) return;
    getPublicPost(params.slug)
      .then((p) => {
        setPost(p);
        setState("ready");
      })
      .catch((e: Error) => setState(e.message === "404" ? "missing" : "error"));
  }, [params?.slug]);

  if (state !== "ready" || !post) {
    return (
      <div className="ih-page">
        <Nav section="intelligence" />
        <main className="ih-entity-main">
          <div className="ih-browse-meta">
            {state === "loading"
              ? "Loading…"
              : state === "missing"
                ? "Article not found."
                : "Couldn't load this article — try again shortly."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const typeLabel = TYPE_LABEL[post.content_type];
  const pillar =
    post.pillar ? (pillarInfo(post.pillar)?.label ?? post.pillar) : null;
  const dateStr = formatDate(post.published_at);

  return (
    <div className="ih-page">
      <Nav section="intelligence" />
      <main className="ih-entity-main">
        <Breadcrumb
          trail={[
            { label: "Intelligence", href: "/intelligence" },
            { label: typeLabel, href: "/intelligence" },
            { label: post.title },
          ]}
        />

        <article className="ih-article">
          <header className="ih-article-head">
            <div className="ih-article-eyebrow">
              <span
                className={`ih-article-type ih-article-type--${post.content_type}`}
              >
                {typeLabel}
              </span>
              {dateStr ? (
                <span className="ih-article-date">{dateStr}</span>
              ) : null}
              {post.read_time_minutes ? (
                <span className="ih-article-read">
                  {post.read_time_minutes} min read
                </span>
              ) : null}
            </div>

            <h1 className="ih-article-title">{post.title}</h1>

            {post.summary ? (
              <p className="ih-article-lede">{post.summary}</p>
            ) : null}

            <div className="ih-article-meta">
              {post.author ? (
                <span className="ih-article-byline">By {post.author}</span>
              ) : null}
              {pillar ? (
                <span className="ih-article-pillar">Pillar · {pillar}</span>
              ) : null}
            </div>

            {(post.materials?.length || post.geographies?.length) ? (
              <div className="ih-article-tags">
                {(post.materials ?? []).map((m) => (
                  <span key={`m-${m}`} className="ih-tag ih-tag-mat">
                    {m}
                  </span>
                ))}
                {(post.geographies ?? []).map((g) => (
                  <span key={`g-${g}`} className="ih-tag ih-tag-geo">
                    {g}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {post.hero_image_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.hero_image_url}
              alt=""
              className="ih-article-hero"
            />
          ) : null}

          {post.content_type === "report" && post.pdf_url ? (
            <a
              href={post.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="ih-article-pdf"
            >
              Download PDF ↓
            </a>
          ) : null}

          {post.body ? (
            <HubArticleRenderer body={post.body} />
          ) : (
            <p className="ih-empty-note">
              This article hasn&rsquo;t been published with body content yet.
            </p>
          )}

          <footer className="ih-article-foot">
            <a href="/intelligence" className="ih-article-back">
              ← Back to Intelligence
            </a>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
