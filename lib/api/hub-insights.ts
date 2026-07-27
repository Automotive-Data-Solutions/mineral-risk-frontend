/**
 * Typed client for the PUBLIC insight-post endpoint (single article) —
 * mirrors GET /api/v1/intelligence/posts/{slug} on the FastAPI side
 * (app/api/routes/intelligence.py, response_model=InsightPostDetail).
 *
 * Kept separate from lib/api/insights.ts because that file is the ADMIN
 * client (Clerk-authenticated ApiClient, admin CRUD surface). This is
 * unauthenticated plain fetch, matching the convention established by
 * lib/api/entities.ts and app/(hub)/intelligence/page.tsx.
 *
 * The public GET only serves posts with status='published'. Draft
 * bodies remain admin-only (via /posts/by-id/{id}).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE = `${API_BASE}/api/v1/intelligence`;

export type ContentType = "analysis" | "signal" | "report" | "news";

export interface PublicInsightPost {
  /** Editorial risk severity tag (author judgment, not an engine score). */
  risk_band?: "low" | "med" | "high" | "crit" | null;
  id: number;
  slug: string;
  title: string;
  content_type: ContentType;
  pillar: string | null;
  materials: string[] | null;
  geographies: string[] | null;
  summary: string | null;
  read_time_minutes: number | null;
  author: string | null;
  published_at: string | null;
  pinned: boolean;
  hero_image_url: string | null;
  tags: string[] | null;
  /** Resolved outbound links to public entity pages (article→entity),
   *  computed from tags server-side; only publicly-visible entities. */
  entity_links?: {
    kind: "company" | "regulation";
    label: string;
    url: string;
  }[];
  body: string | null;
  pdf_url: string | null;
  status: "draft" | "published" | "archived";
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getPublicPost(slug: string) {
  return getJson<PublicInsightPost>(
    `${BASE}/posts/${encodeURIComponent(slug)}`,
  );
}
