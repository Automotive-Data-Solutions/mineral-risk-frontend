"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { useDashboardOverview } from "@/lib/hooks/use-dashboard";
import { formatNumber } from "@/lib/utils/format";
import { humanize } from "@/lib/utils/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const confidenceChartConfig = {
  count: { label: "Companies", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export default function DashboardOverviewPage() {
  const { data, isLoading, error, refetch } = useDashboardOverview();
  const stageCounts = data?.company_count_by_stage ?? [];
  const confidenceBuckets = data?.confidence_distribution ?? [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          High-level view of data coverage, scoring progress, and recent analyst
          activity.
        </p>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Companies"
              value={data?.company_count_total}
              description="All companies in the database"
              isLoading={isLoading}
            />
            <KpiCard
              title="With Risk Score"
              value={data?.companies_with_score}
              description={
                data
                  ? `${scorePct(
                      data.companies_with_score,
                      data.company_count_total,
                    )}% scored`
                  : undefined
              }
              isLoading={isLoading}
            />
            <KpiCard
              title="Stages Covered"
              value={stageCounts.filter((s) => s.count > 0).length}
              description="Supply chain stages with ≥1 company"
              isLoading={isLoading}
            />
            <KpiCard
              title="Notes (7d)"
              value={data?.recent_notes_count_7d}
              description="Analyst flags in the last week"
              isLoading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Companies by Stage</CardTitle>
                <CardDescription>Distribution across the supply chain.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : stageCounts.length === 0 ? (
                  <EmptyState title="No stage data" />
                ) : (
                  <BarList
                    items={stageCounts.map((s) => ({
                      label: humanize(s.stage),
                      value: s.count,
                    }))}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
                <CardDescription>
                  Data-confidence bucketing across companies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : confidenceBuckets.length === 0 ? (
                  <EmptyState title="No confidence data" />
                ) : (
                  <ChartContainer
                    config={confidenceChartConfig}
                    className="h-56 w-full"
                  >
                    <BarChart
                      data={confidenceBuckets.map((b) => ({
                        bucket: b.bucket,
                        count: b.count,
                      }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="bucket"
                        tickLine={false}
                        axisLine={false}
                        className="text-xs"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        className="text-xs"
                        width={32}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="count"
                        fill="var(--color-count)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function scorePct(n: number, total: number): number {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

interface KpiCardProps {
  title: string;
  value: number | undefined;
  description?: string;
  isLoading?: boolean;
}

function KpiCard({ title, value, description, isLoading }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {formatNumber(value ?? null)}
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        {isLoading ? <Skeleton className="h-3 w-32" /> : description ?? ""}
      </CardContent>
    </Card>
  );
}

interface BarListItem {
  label: string;
  value: number;
}

function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const sorted = [...items].sort((a, b) => b.value - a.value);
  return (
    <div className="flex flex-col gap-2">
      {sorted.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium tabular-nums">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-primary"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
