"use client";

/**
 * ChartBlock — renders one declarative ```chart fenced block from an
 * insight-post body (see engine scripts/ingest_insight_docx.py docstring
 * for the authoring convention, decided 2026-07-08).
 *
 * Spec shape:
 *   {
 *     "name":  "cobalt-quota",            // stable id, set by [[chart:]] placeholder
 *     "type":  "bar" | "line" | "area" | "donut" | "unconfigured",
 *     "title": "DRC share of refined cobalt",
 *     "data":  [{ "label": "DRC", "value": 76 }, ...],   // inline data …
 *     "dataRef": "scores/latest?material=Cobalt",        // … OR live platform ref
 *     "source": "CMOC AR 2025",
 *     "size":  "full" | "inline"          // default full
 *   }
 *
 * v1 = Recharts, static (no zoom/brush) per launch-plan scope. A given
 * chart can later be re-pointed at a bespoke d3 renderer by type without
 * touching published content.
 */

import * as React from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ChartDatum {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartSpec {
  name?: string;
  type: "bar" | "line" | "area" | "donut" | "unconfigured" | string;
  title?: string;
  data?: ChartDatum[];
  dataRef?: string;
  source?: string;
  size?: "full" | "inline";
}

const PALETTE = [
  "var(--chart-1, #7c5cff)", // MRa purple
  "var(--chart-2, #b87333)", // copper
  "var(--chart-3, #4f8a8b)",
  "var(--chart-4, #c2b280)",
  "var(--chart-5, #8d99ae)",
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function useChartData(spec: ChartSpec) {
  const [data, setData] = React.useState<ChartDatum[] | null>(
    spec.data ?? null
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (spec.data || !spec.dataRef) return;
    let cancelled = false;
    // Public hub content — chart-data endpoints are unauthenticated reads.
    fetch(`${API_BASE}/api/v1/chart-data/${spec.dataRef}`)
      .then((r) => {
        if (!r.ok) throw new Error(`chart data ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json.data ?? json);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [spec.data, spec.dataRef]);

  return { data, error };
}

function ChartShell({
  spec,
  children,
}: {
  spec: ChartSpec;
  children: React.ReactNode;
}) {
  const inline = spec.size === "inline";
  return (
    <figure
      className={
        "my-6 rounded-lg border bg-card p-4 " +
        (inline ? "md:float-right md:ml-6 md:w-[46%]" : "w-full")
      }
      data-chart-name={spec.name}
    >
      {spec.title ? (
        <figcaption className="mb-3 text-sm font-semibold text-foreground">
          {spec.title}
        </figcaption>
      ) : null}
      <div className={inline ? "h-52" : "h-72"}>{children}</div>
      {spec.source ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Source: {spec.source}
        </p>
      ) : null}
    </figure>
  );
}

function Unconfigured({ spec }: { spec: ChartSpec }) {
  // Visible only in drafts/preview; published posts should never contain one.
  return (
    <div className="my-6 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      Chart “{spec.name ?? "unnamed"}” not configured yet — open this post in
      the admin editor to set its type and data.
    </div>
  );
}

export function ChartBlock({ spec }: { spec: ChartSpec }) {
  const { data, error } = useChartData(spec);

  if (spec.type === "unconfigured") return <Unconfigured spec={spec} />;
  if (error)
    return (
      <div className="my-6 rounded-lg border p-4 text-sm text-muted-foreground">
        Chart unavailable.
      </div>
    );
  if (!data)
    return (
      <div className="my-6 h-72 animate-pulse rounded-lg border bg-muted/30" />
    );

  const axisProps = {
    tick: { fontSize: 11 },
    stroke: "var(--muted-foreground, #888)",
  } as const;

  let body: React.ReactNode = null;
  switch (spec.type) {
    case "bar":
      body = (
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...axisProps} />
          <YAxis type="category" dataKey="label" width={110} {...axisProps} />
          <Tooltip />
          <Bar dataKey="value" fill={PALETTE[0]} radius={[0, 3, 3, 0]} />
        </BarChart>
      );
      break;
    case "line":
      body = (
        <LineChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={PALETTE[0]}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      );
      break;
    case "area":
      body = (
        <AreaChart data={data} margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="value"
            stroke={PALETTE[0]}
            fill={PALETTE[0]}
            fillOpacity={0.25}
          />
        </AreaChart>
      );
      break;
    case "donut":
      body = (
        <PieChart>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      );
      break;
    default:
      return <Unconfigured spec={spec} />;
  }

  return (
    <ChartShell spec={spec}>
      <ResponsiveContainer width="100%" height="100%">
        {body as React.ReactElement}
      </ResponsiveContainer>
    </ChartShell>
  );
}
