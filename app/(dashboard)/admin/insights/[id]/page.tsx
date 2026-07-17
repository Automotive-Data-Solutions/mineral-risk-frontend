"use client";

/**
 * Admin — insight post editor (two-pane, per 2026-07-08 decisions).
 * Left: Markdown source + chart configuration + metadata.
 * Right: live preview using the SAME ArticleRenderer as the public page.
 * Charts: fenced ```chart blocks in the body; the ChartConfig panel lists
 * every block and edits its JSON spec in place (type, title, data, source).
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiClient } from "@/lib/hooks/use-api-client";
import {
  getPostById,
  updatePost,
  publishPost,
  unpublishPost,
  pinPost,
  unpinPost,
} from "@/lib/api/insights";
import ArticleRenderer from "@/components/insights/ArticleRenderer";
import type { ChartSpec } from "@/components/insights/ChartBlock";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CHART_FENCE_G = /```chart\s*\n([\s\S]*?)\n```/g;

function extractCharts(body: string): { index: number; spec: ChartSpec }[] {
  const out: { index: number; spec: ChartSpec }[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(CHART_FENCE_G.source, "g");
  while ((m = re.exec(body)) !== null) {
    let spec: ChartSpec = { type: "unconfigured" };
    try {
      spec = JSON.parse(m[1] ?? "");
    } catch {
      /* leave unconfigured */
    }
    out.push({ index: i++, spec });
  }
  return out;
}

function replaceChartSpec(body: string, index: number, spec: ChartSpec): string {
  let i = 0;
  return body.replace(new RegExp(CHART_FENCE_G.source, "g"), (full) =>
    i++ === index ? "```chart\n" + JSON.stringify(spec) + "\n```" : full,
  );
}

/** CSV/TSV paste → [{label, value}] */
function parseCsv(text: string): { label: string; value: number }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(/[,\t]/).map((s) => s?.trim() ?? "");
      return { label: parts[0] ?? "", value: Number(parts[1] ?? NaN) };
    })
    .filter((d) => d.label !== "" && Number.isFinite(d.value));
}

function ChartConfigPanel({
  body,
  onChange,
}: {
  body: string;
  onChange: (next: string) => void;
}) {
  const charts = extractCharts(body);
  if (charts.length === 0)
    return (
      <p className="text-xs text-muted-foreground">
        No chart blocks. Add <code>[[chart: name]]</code> in the source (as a
        chart fence) to place one.
      </p>
    );
  return (
    <div className="space-y-4">
      {charts.map(({ index, spec }) => (
        <div key={index} className="rounded-md border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">
              {spec.name ?? `chart ${index + 1}`}
            </span>
            <Badge variant={spec.type === "unconfigured" ? "destructive" : "outline"}>
              {spec.type}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <select
              value={spec.type}
              onChange={(e) =>
                onChange(replaceChartSpec(body, index, { ...spec, type: e.target.value }))
              }
              className="rounded-md border bg-background px-2 py-1"
            >
              <option value="unconfigured">unconfigured</option>
              <option value="bar">bar</option>
              <option value="line">line</option>
              <option value="area">area</option>
              <option value="donut">donut</option>
            </select>
            <select
              value={spec.size ?? "full"}
              onChange={(e) =>
                onChange(
                  replaceChartSpec(body, index, {
                    ...spec,
                    size: e.target.value as ChartSpec["size"],
                  }),
                )
              }
              className="rounded-md border bg-background px-2 py-1"
            >
              <option value="full">full width</option>
              <option value="inline">inline (floated)</option>
            </select>
            <input
              placeholder="Title"
              value={spec.title ?? ""}
              onChange={(e) =>
                onChange(replaceChartSpec(body, index, { ...spec, title: e.target.value }))
              }
              className="col-span-2 rounded-md border bg-background px-2 py-1"
            />
            <input
              placeholder="Source line (e.g. CMOC AR 2025)"
              value={spec.source ?? ""}
              onChange={(e) =>
                onChange(replaceChartSpec(body, index, { ...spec, source: e.target.value }))
              }
              className="col-span-2 rounded-md border bg-background px-2 py-1"
            />
            <input
              placeholder="dataRef (live platform series, optional)"
              value={spec.dataRef ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const next: ChartSpec = { ...spec };
                if (v) next.dataRef = v;
                else delete next.dataRef;
                onChange(replaceChartSpec(body, index, next));
              }}
              className="col-span-2 rounded-md border bg-background px-2 py-1"
            />
            <textarea
              placeholder={"Paste data: label,value per line\nDRC,76\nOther,24"}
              defaultValue={(spec.data ?? [])
                .map((d) => `${d.label},${d.value}`)
                .join("\n")}
              onBlur={(e) => {
                const data = parseCsv(e.target.value);
                const next: ChartSpec = { ...spec };
                if (data.length) next.data = data;
                else delete next.data;
                onChange(replaceChartSpec(body, index, next));
              }}
              rows={4}
              className="col-span-2 rounded-md border bg-background px-2 py-1 font-mono text-xs"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminInsightEditorPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const client = useApiClient();
  const qc = useQueryClient();

  const post = useQuery({
    queryKey: ["insights", "post", id],
    queryFn: () => getPostById(client, id),
    enabled: Number.isFinite(id),
  });

  const [body, setBody] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState<string | null>(null);
  // Tag fields are edited as comma-separated text; parsed on save.
  const [materials, setMaterials] = React.useState<string | null>(null);
  const [geographies, setGeographies] = React.useState<string | null>(null);
  const [tags, setTags] = React.useState<string | null>(null);
  const [pillar, setPillar] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (post.data && body === null) {
      setBody(post.data.body ?? "");
      setSummary(post.data.summary ?? "");
      setTitle(post.data.title ?? "");
      setMaterials((post.data.materials ?? []).join(", "));
      setGeographies((post.data.geographies ?? []).join(", "));
      setTags((post.data.tags ?? []).join(", "));
      setPillar(post.data.pillar ?? "");
    }
  }, [post.data, body]);

  const parseList = (v: string | null, upper = false): string[] | null => {
    const items = (v ?? "")
      .split(",")
      .map((s) => (upper ? s.trim().toUpperCase() : s.trim()))
      .filter(Boolean);
    return items.length ? items : null;
  };

  const dirty =
    post.data != null &&
    (body !== (post.data.body ?? "") ||
      summary !== (post.data.summary ?? "") ||
      title !== (post.data.title ?? "") ||
      materials !== (post.data.materials ?? []).join(", ") ||
      geographies !== (post.data.geographies ?? []).join(", ") ||
      tags !== (post.data.tags ?? []).join(", ") ||
      pillar !== (post.data.pillar ?? ""));

  const [actionError, setActionError] = React.useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      updatePost(client, id, {
        body: body ?? "",
        summary: summary ?? "",
        title: title || undefined,
        materials: parseList(materials),
        geographies: parseList(geographies, true),
        tags: parseList(tags),
        pillar: pillar || null,
      }),
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (e) => setActionError(`Save failed: ${e instanceof Error ? e.message : e}`),
  });
  const publish = useMutation({
    // Publish auto-saves pending edits first — one click, no hidden two-step.
    mutationFn: async () => {
      if (dirty) await save.mutateAsync();
      return publishPost(client, id);
    },
    onSuccess: () => {
      setActionError(null);
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (e) =>
      setActionError(`Publish failed: ${e instanceof Error ? e.message : e}`),
  });
  const unpublish = useMutation({
    mutationFn: () => unpublishPost(client, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insights"] }),
  });
  const togglePin = useMutation({
    mutationFn: () =>
      post.data?.pinned ? unpinPost(client, id) : pinPost(client, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insights"] }),
  });

  if (post.isLoading || body === null)
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  if (post.isError || !post.data)
    return <p className="p-6 text-sm text-destructive">Post not found.</p>;

  const unconfigured = extractCharts(body).filter(
    (c) => c.spec.type === "unconfigured",
  ).length;

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{post.data.title}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>/{post.data.slug} · {post.data.content_type} ·</span>
            <Badge variant={post.data.status === "published" ? "default" : "secondary"}>
              {post.data.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {post.data.content_type !== "report" ? (
            <Button
              variant={post.data.pinned ? "secondary" : "outline"}
              onClick={() => togglePin.mutate()}
              disabled={togglePin.isPending}
              title="Pinned posts surface above the date-ordered feed"
            >
              {post.data.pinned ? "📌 Unpin" : "Pin to top"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
          >
            {save.isPending ? "Saving…" : dirty ? "Save draft" : "Saved"}
          </Button>
          {post.data.status === "published" ? (
            <Button variant="secondary" onClick={() => unpublish.mutate()}>
              Unpublish
            </Button>
          ) : (
            <Button
              onClick={() => publish.mutate()}
              disabled={unconfigured > 0 || publish.isPending}
              title={
                unconfigured > 0
                  ? `${unconfigured} chart(s) not configured`
                  : undefined
              }
            >
              {publish.isPending
                ? "Publishing…"
                : dirty
                  ? "Save & publish"
                  : "Publish"}
            </Button>
          )}
        </div>
      </div>
      {unconfigured > 0 ? (
        <p className="text-sm text-amber-600">
          {unconfigured} chart block(s) still unconfigured — publish is disabled
          until they’re set up below.
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-3">
            <h2 className="mb-2 text-sm font-semibold">Title</h2>
            <input
              value={title ?? ""}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-3 w-full rounded-md border bg-background p-2 text-sm font-medium"
            />
            <h2 className="mb-2 text-sm font-semibold">Summary (feed card)</h2>
            <textarea
              value={summary ?? ""}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background p-2 text-sm"
            />
            <h2 className="mb-2 mt-4 text-sm font-semibold">Tags & taxonomy</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="col-span-2 text-xs text-muted-foreground">
                Materials (comma-separated, canonical names)
                <input
                  value={materials ?? ""}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="Graphite, Lithium"
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Geographies (ISO2)
                <input
                  value={geographies ?? ""}
                  onChange={(e) => setGeographies(e.target.value)}
                  placeholder="CN, CD"
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Pillar
                <select
                  value={pillar ?? ""}
                  onChange={(e) => setPillar(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
                >
                  <option value="">— none / multi —</option>
                  <option value="material_concentration">Material Concentration</option>
                  <option value="geopolitical_trade">Geopolitical Trade</option>
                  <option value="regulatory_compliance">Regulatory Compliance</option>
                  <option value="operational">Operational</option>
                  <option value="financial_pressure">Financial Pressure</option>
                </select>
              </label>
              <label className="col-span-2 text-xs text-muted-foreground">
                Topic tags (comma-separated, e.g. IRA, FEOC, Section 232)
                <input
                  value={tags ?? ""}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="IRA, FEOC"
                  className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
            </div>
            <h2 className="mb-2 mt-4 text-sm font-semibold">Markdown source</h2>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={24}
              className="w-full rounded-md border bg-background p-2 font-mono text-xs leading-5"
            />
          </Card>
          <Card className="p-3">
            <h2 className="mb-2 text-sm font-semibold">Charts</h2>
            <ChartConfigPanel body={body} onChange={setBody} />
          </Card>
        </div>
        <Card className="max-h-[80vh] overflow-y-auto p-6">
          <p className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          <ArticleRenderer body={body} />
        </Card>
      </div>
    </div>
  );
}
