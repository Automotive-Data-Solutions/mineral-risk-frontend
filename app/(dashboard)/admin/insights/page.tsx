"use client";

/**
 * Admin — Content: insight posts list, creation, docx upload.
 * Admin content v1 (2026-07-21, PLAN_admin_content_section.md):
 *   - "New post" creates an empty draft (POST /posts) — Signals no longer
 *     require a Word file. Docx upload stays for partner-authored pieces.
 *   - One table (was drafts+published pair), filterable by search text,
 *     type, and status — drafts inbox returns draft AND archived, now
 *     distinguishable via the list item's `status` field.
 * Route protection: (dashboard) Clerk gate + admin/layout.tsx gate;
 * API enforces require_admin server-side (LAUNCH_TODO to re-enable).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/hooks/use-api-client";
import {
  createPost,
  listDraftPosts,
  listPublishedPosts,
  uploadDocx,
  type InsightPostListItem,
} from "@/lib/api/insights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TYPES = ["analysis", "signal", "report", "news"] as const;

function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function statusBadge(status: InsightPostListItem["status"]) {
  if (status === "published") return <Badge variant="default">published</Badge>;
  if (status === "archived") return <Badge variant="outline">archived</Badge>;
  return <Badge variant="secondary">draft</Badge>;
}

function PostRow({ post }: { post: InsightPostListItem }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40">
      <td className="py-2 pr-3">
        <Link
          href={`/admin/insights/${post.id}`}
          className="font-medium underline-offset-2 hover:underline"
        >
          {post.title}
        </Link>
        <div className="text-xs text-muted-foreground">/{post.slug}</div>
      </td>
      <td className="py-2 pr-3">
        <Badge variant="outline">{post.content_type}</Badge>
        {post.pinned ? <span className="ml-1" title="Pinned">📌</span> : null}
      </td>
      <td className="py-2 pr-3 text-sm">{(post.materials ?? []).join(", ")}</td>
      <td className="py-2 pr-3">{statusBadge(post.status)}</td>
      <td className="py-2 text-sm text-muted-foreground">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString()
          : "—"}
      </td>
    </tr>
  );
}

/** "New post" — minimal create dialog; everything else happens in the editor. */
function NewPostDialog() {
  const client = useApiClient();
  const qc = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [type, setType] = React.useState<string>("analysis");
  const [date, setDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createPost(client, {
        slug,
        title,
        content_type: type,
        // Noon UTC keeps the calendar date stable across viewer timezones.
        ...(date ? { published_at: `${date}T12:00:00Z` } : {}),
      }),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["insights"] });
      setOpen(false);
      router.push(`/admin/insights/${post.id}`);
    },
    onError: (e) =>
      setError(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <DialogTrigger asChild>
        <Button>New post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Title</span>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="DRC cobalt quota — what changed"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Slug (URL) — editable until first publish
            </span>
            <input
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              placeholder="drc-cobalt-quota-2026"
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Article date (optional — when it was written; blank = stamped at publish)
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            onClick={() => { setError(null); create.mutate(); }}
            disabled={create.isPending || !title.trim() || !slug}
          >
            {create.isPending ? "Creating…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminInsightsPage() {
  const client = useApiClient();
  const qc = useQueryClient();
  const router = useRouter();

  const drafts = useQuery({
    queryKey: ["insights", "drafts"],
    queryFn: () => listDraftPosts(client),
  });
  const published = useQuery({
    queryKey: ["insights", "published"],
    queryFn: () => listPublishedPosts(client),
  });

  // ── filters ──────────────────────────────────────────────────────────
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const allPosts: InsightPostListItem[] = React.useMemo(() => {
    // Dedupe by id: during a status transition (publish/archive) one query
    // refetches before the other, so a post can momentarily be in BOTH
    // cached lists — rendering both threw React's duplicate-key error.
    // The drafts-inbox row wins (it refetches on every transition, so it
    // carries the fresher status).
    const byId = new Map<number, InsightPostListItem>();
    for (const p of published.data ?? []) byId.set(p.id, p);
    for (const p of drafts.data ?? []) byId.set(p.id, p);
    // published_at desc, nulls (fresh drafts) first, id desc tiebreak.
    return [...byId.values()].sort((a, b) => {
      const ta = a.published_at ? Date.parse(a.published_at) : Infinity;
      const tb = b.published_at ? Date.parse(b.published_at) : Infinity;
      return tb === ta ? b.id - a.id : tb - ta;
    });
  }, [drafts.data, published.data]);

  const visible = allPosts.filter((p) => {
    if (typeFilter !== "all" && p.content_type !== typeFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.slug.toLowerCase().includes(q) &&
        !(p.materials ?? []).some((m) => m.toLowerCase().includes(q)) &&
        !(p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
        return false;
    }
    return true;
  });

  // ── docx upload (unchanged mechanics) ────────────────────────────────
  const [file, setFile] = React.useState<File | null>(null);
  const [slug, setSlug] = React.useState("");
  const [contentType, setContentType] = React.useState("analysis");
  const [uploadDate, setUploadDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const upload = useMutation({
    mutationFn: () => {
      if (!file || !slug) throw new Error("Choose a .docx file and a slug.");
      return uploadDocx(client, {
        file,
        slug,
        contentType,
        ...(uploadDate ? { publishedAt: `${uploadDate}T12:00:00Z` } : {}),
      });
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ["insights"] });
      router.push(`/admin/insights/${post.id}`);
    },
    onError: (e) => setError(e instanceof Error ? e.message : String(e)),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <NewPostDialog />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Upload a Word document</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              .docx file
            </span>
            <input
              type="file"
              accept=".docx"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !slug) setSlug(slugify(f.name.replace(/\.docx$/i, "")));
              }}
              className="block text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Slug (URL)
            </span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="drc-cobalt-quota-2026"
              className="w-64 rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Type
            </span>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">
              Article date (optional)
            </span>
            <input
              type="date"
              value={uploadDate}
              onChange={(e) => setUploadDate(e.target.value)}
              className="rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <Button
            onClick={() => {
              setError(null);
              upload.mutate();
            }}
            disabled={upload.isPending || !file || !slug}
          >
            {upload.isPending ? "Converting…" : "Upload & convert"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: type <code>[[chart: name]]</code> on its own line in Word to
          reserve a chart position — you’ll configure it in the editor.
        </p>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-semibold">
            Posts ({visible.length})
          </h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, slug, material, tag…"
            className="w-56 rounded-md border bg-background px-2 py-1.5 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>
        <table className="w-full text-left text-sm">
          <tbody>
            {visible.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </tbody>
        </table>
        {drafts.isLoading || published.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
        {!drafts.isLoading && !published.isLoading && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts match the current filters.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
