"use client";

/**
 * Admin — insight posts list + docx upload.
 * MVP per 2026-07-08 decisions: posts table (drafts + published), upload a
 * partner .docx (server converts via mammoth pipeline), open the editor.
 * Route protection: (dashboard) group is Clerk-gated; the upload/edit API
 * calls additionally require admin role server-side (require_admin).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/hooks/use-api-client";
import {
  listDraftPosts,
  listPublishedPosts,
  uploadDocx,
  type InsightPostListItem,
} from "@/lib/api/insights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function PostRow({ post, status }: { post: InsightPostListItem; status: string }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40">
      <td className="py-2 pr-3">
        <Link
          href={`/admin/insights/${post.id}`}
          className="font-medium underline-offset-2 hover:underline"
        >
          {post.title}
        </Link>
        <div className="text-xs text-muted-foreground">{post.slug}</div>
      </td>
      <td className="py-2 pr-3">
        <Badge variant="outline">{post.content_type}</Badge>
      </td>
      <td className="py-2 pr-3 text-sm">{(post.materials ?? []).join(", ")}</td>
      <td className="py-2 pr-3">
        <Badge variant={status === "published" ? "default" : "secondary"}>
          {status}
        </Badge>
      </td>
      <td className="py-2 text-sm text-muted-foreground">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString()
          : "—"}
      </td>
    </tr>
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

  const [file, setFile] = React.useState<File | null>(null);
  const [slug, setSlug] = React.useState("");
  const [contentType, setContentType] = React.useState("analysis");
  const [error, setError] = React.useState<string | null>(null);

  const upload = useMutation({
    mutationFn: () => {
      if (!file || !slug) throw new Error("Choose a .docx file and a slug.");
      return uploadDocx(client, { file, slug, contentType });
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
        <h1 className="text-2xl font-bold">Insight posts</h1>
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
                if (f && !slug) {
                  setSlug(
                    f.name
                      .replace(/\.docx$/i, "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, ""),
                  );
                }
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
              <option value="analysis">Analysis</option>
              <option value="signal">Signal</option>
              <option value="report">Report</option>
              <option value="news">News</option>
            </select>
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
        <h2 className="mb-3 text-sm font-semibold">
          Drafts ({drafts.data?.length ?? 0})
        </h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {(drafts.data ?? []).map((p) => (
              <PostRow key={p.id} post={p} status="draft" />
            ))}
          </tbody>
        </table>
        {drafts.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">
          Published ({published.data?.length ?? 0})
        </h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {(published.data ?? []).map((p) => (
              <PostRow key={p.id} post={p} status="published" />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
