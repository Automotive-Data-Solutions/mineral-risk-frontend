"use client";

/**
 * Public intelligence hub feed — wired to the live API (2026-07-08),
 * replacing the design-phase mock arrays.
 *
 * Ordering (decided 2026-07-08):
 *   1. Featured Report slot = latest published `report`-type post, by
 *      convention (no schema flag). Hidden entirely until one exists.
 *   2. Pinned posts (analysis/signal/news) — API orders pinned first;
 *      rendered with a "Pinned" chip.
 *   3. Date-ordered feed (published_at DESC).
 * Tab filtering is client-side over one fetch (feed ≤ ~50 posts at launch).
 * Public route — unauthenticated fetch, no Clerk dependency.
 */

import { useEffect, useState } from "react";
import { Nav }            from "@/components/hub/Nav";
import { FeaturedReport } from "@/components/hub/FeaturedReport";
import { FeedRow }        from "@/components/hub/FeedRow";
import { Sidebar }        from "@/components/hub/Sidebar";
import { TypeLegend }     from "@/components/hub/TypeLegend";
import { Footer }         from "@/components/hub/Footer";
import type { TabLabel, FeedPost, FeaturedPost, ContentType } from "@/components/hub/types";
import { pillarInfo } from "@/components/hub/pillars";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** API shape — mirrors InsightPostListItem (app/schemas/intelligence.py). */
interface ApiPost {
  id: number;
  slug: string;
  title: string;
  content_type: "analysis" | "signal" | "report" | "news";
  materials: string[] | null;
  geographies: string[] | null;
  summary: string | null;
  read_time_minutes: number | null;
  published_at: string | null;
  pinned: boolean;
  tags: string[] | null;
  pillar: string | null;
}

const TYPE_LABEL: Record<ApiPost["content_type"], ContentType> = {
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

function toFeedPost(p: ApiPost): FeedPost {
  return {
    id: String(p.id),
    slug: p.slug,
    type: TYPE_LABEL[p.content_type],
    materials: p.materials ?? [],
    geographies: p.geographies ?? [],
    tags: p.tags ?? [],
    pillar: p.pillar ? (pillarInfo(p.pillar)?.label ?? p.pillar) : undefined,
    date: formatDate(p.published_at),
    pinned: p.pinned,
    read: p.read_time_minutes ?? undefined,
    title: p.title,
    preview: p.summary ?? undefined,
  };
}

function toFeatured(p: ApiPost): FeaturedPost {
  return {
    type: "Report",
    materials: p.materials ?? [],
    geographies: p.geographies ?? [],
    date: formatDate(p.published_at),
    title: p.title,
    lede: p.summary ?? "",
    // Real posts carry no callout metrics yet — FeaturedReport guards this.
    callouts: [],
    ctaLabel: "Read →",
    ctaHref: `/intelligence/${p.slug}`,
  };
}

export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabLabel>("All");
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/v1/intelligence/posts?limit=50`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setPosts(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Featured = latest published report (API is date-ordered within types;
  // reports can't be pinned so the first report row is the latest one).
  const featuredApi = (posts ?? []).find((p) => p.content_type === "report");
  const featured = featuredApi ? toFeatured(featuredApi) : null;

  const feed: FeedPost[] = (posts ?? [])
    .filter((p) => p.id !== featuredApi?.id)
    .map(toFeedPost);

  const visibleFeed =
    activeTab === "All" ? feed : feed.filter((p) => p.type === activeTab);

  return (
    <>
      <Nav activeTab={activeTab} onTab={setActiveTab} />

      <main className="ih-main">
        <div className="ih-content">
          <TypeLegend />

          <div className="ih-body">
            {/* Main feed column */}
            <div className="ih-feed-col">
              {featured && (activeTab === "All" || activeTab === "Report") ? (
                <FeaturedReport post={featured} />
              ) : null}

              {visibleFeed.map((row) => (
                <FeedRow key={row.id} row={row} />
              ))}

              {posts === null && !error ? (
                <p style={{ color: "#9e7b72", padding: "2rem 0", fontSize: "0.9rem" }}>
                  Loading intelligence feed…
                </p>
              ) : null}
              {error ? (
                <p style={{ color: "#9e7b72", padding: "2rem 0", fontSize: "0.9rem" }}>
                  The feed is temporarily unavailable — please check back shortly.
                </p>
              ) : null}
              {posts !== null && !error && visibleFeed.length === 0 && !featured ? (
                <p style={{ color: "#9e7b72", padding: "2rem 0", fontSize: "0.9rem" }}>
                  No {activeTab === "All" ? "" : activeTab + " "}posts yet — check back soon.
                </p>
              ) : null}
            </div>

            {/* Sidebar */}
            <Sidebar />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
