/**
 * Typed client for the intelligence (insight posts) API — admin surface.
 * Mirrors app/schemas/intelligence.py on the FastAPI side.
 */

import type { ApiClient } from "./client";

export interface InsightPostListItem {
  id: number;
  slug: string;
  title: string;
  content_type: "analysis" | "signal" | "report" | "news";
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
}

export interface InsightPostDetail extends InsightPostListItem {
  body: string | null;
  pdf_url: string | null;
  status: "draft" | "published" | "archived";
}

export interface InsightPostUpdate {
  title?: string;
  tags?: string[] | null;
  pillar?: string | null;
  materials?: string[] | null;
  geographies?: string[] | null;
  summary?: string | null;
  body?: string | null;
  pdf_url?: string | null;
  read_time_minutes?: number | null;
  author?: string | null;
}

const BASE = "/api/v1/intelligence";

/** Standard list envelope from app/schemas/common.py: {data, total, page, limit}. */
interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export async function listDraftPosts(client: ApiClient) {
  const { data } = await client.get<Paginated<InsightPostListItem>>(
    `${BASE}/posts/drafts`,
    { params: { limit: 100 } },
  );
  return data.data;
}

export async function listPublishedPosts(client: ApiClient) {
  const { data } = await client.get<Paginated<InsightPostListItem>>(
    `${BASE}/posts`,
    { params: { limit: 100 } },
  );
  return data.data;
}

export async function getPostById(client: ApiClient, id: number) {
  const { data } = await client.get<InsightPostDetail>(`${BASE}/posts/by-id/${id}`);
  return data;
}

export async function updatePost(
  client: ApiClient,
  id: number,
  body: InsightPostUpdate,
) {
  const { data } = await client.patch<InsightPostDetail>(`${BASE}/posts/${id}`, body);
  return data;
}

export async function publishPost(client: ApiClient, id: number) {
  const { data } = await client.post<InsightPostDetail>(`${BASE}/posts/${id}/publish`);
  return data;
}

export async function unpublishPost(client: ApiClient, id: number) {
  const { data } = await client.post<InsightPostDetail>(`${BASE}/posts/${id}/unpublish`);
  return data;
}

export async function pinPost(client: ApiClient, id: number) {
  const { data } = await client.post<InsightPostDetail>(`${BASE}/posts/${id}/pin`);
  return data;
}

export async function unpinPost(client: ApiClient, id: number) {
  const { data } = await client.post<InsightPostDetail>(`${BASE}/posts/${id}/unpin`);
  return data;
}

export async function uploadDocx(
  client: ApiClient,
  args: { file: File; slug: string; contentType: string; title?: string; author?: string },
) {
  const form = new FormData();
  form.append("file", args.file);
  form.append("slug", args.slug);
  form.append("content_type", args.contentType);
  if (args.title) form.append("title", args.title);
  if (args.author) form.append("author", args.author);
  const { data } = await client.post<InsightPostDetail>(
    `${BASE}/posts/upload-docx`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
