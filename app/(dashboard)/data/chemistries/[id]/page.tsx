"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/platform/page-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformTable } from "@/components/platform/platform-table";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import { ErrorState } from "@/components/shared/error-state";
import {
  useChemistryDetail,
  useChemistryRiskHistory,
  useRescoreChemistry,
} from "@/lib/hooks/use-chemistry-detail";
import type {
  ChemistryMaterialRead,
  ChemistryRiskScoreRead,
} from "@/lib/types";
import { formatDate, humanize } from "@/lib/utils/format";
import { useBreadcrumbLabel } from "@/components/platform/breadcrumb-context";

function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

function formatPercent01(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(0)}%`;
}

function formatIntensity(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(0)}%`;
}

export default function ChemistryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const id = Number(idParam);

  const {
    data: chemistry,
    isLoading,
    error,
    refetch,
  } = useChemistryDetail(id);
  const { data: history = [], isLoading: historyLoading } =
    useChemistryRiskHistory(id);
  const rescore = useRescoreChemistry(id);

  // Register the chemistry name so the breadcrumb shows the name instead of the ID
  useBreadcrumbLabel(idParam, chemistry?.name);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <PageLayout>
        <ErrorState error={new Error("Invalid chemistry id")} />
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </PageLayout>
    );
  }

  if (error || !chemistry) {
    return (
      <PageLayout>
        <ErrorState
          error={error ?? new Error("Chemistry not found")}
          onRetry={() => refetch()}
        />
      </PageLayout>
    );
  }

  const score = chemistry.latest_risk_score;

  return (
    <PageLayout>
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/data/chemistries"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Chemistries
        </Link>
        <div className="flex items-center gap-3">
          {rescore.isSuccess && rescore.data && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Rescored {format(parseISO(rescore.data.as_of_date), "MMM d")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => rescore.mutate()}
            disabled={rescore.isPending}
          >
            {rescore.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Rescore
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {chemistry.name}
          </h1>
          <Badge variant="outline" className="font-mono text-xs">
            {chemistry.slug}
          </Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{humanize(chemistry.status)}</Badge>
          <Badge
            variant="outline"
            className={
              chemistry.is_active
                ? "border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                : "border-0 bg-muted text-muted-foreground"
            }
          >
            {chemistry.is_active ? "Active" : "Inactive"}
          </Badge>
          {chemistry.verified && (
            <Badge
              variant="outline"
              className="border-0 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
            >
              Verified
            </Badge>
          )}
          {chemistry.current_market_share_pct != null && (
            <span className="text-xs text-muted-foreground">
              Market share:{" "}
              <span className="font-medium text-foreground">
                {chemistry.current_market_share_pct.toFixed(1)}%
              </span>
              {chemistry.market_share_as_of_date && (
                <>
                  {" "}
                  (as of {formatDate(chemistry.market_share_as_of_date)})
                </>
              )}
            </span>
          )}
        </div>
        {chemistry.description && (
          <p className="mt-3 text-sm text-muted-foreground">
            {chemistry.description}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PillarScoresCard score={score} />
        <RiskHistoryCard history={history} isLoading={historyLoading} />
      </div>

      <ActiveCompositionTable materials={chemistry.active_materials} />
    </PageLayout>
  );
}

interface PillarScoresCardProps {
  score: ChemistryRiskScoreRead | null;
}

function PillarScoresCard({ score }: PillarScoresCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pillar scores</h2>
        {score && (
          <span className="text-xs text-muted-foreground">
            v{score.methodology_version} · {formatDate(score.as_of_date)}
          </span>
        )}
      </div>
      {score == null ? (
        <p className="text-sm text-muted-foreground">
          No risk score has been computed for this chemistry yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard
            label="Material Concentration"
            value={formatScore(score.material_concentration_score)}
          />
          <ScoreCard
            label="Geopolitical"
            value={formatScore(score.geopolitical_score)}
          />
          <ScoreCard
            label="Composite (overall)"
            value={formatScore(score.composite_risk_score)}
            emphasis
          />
          <ScoreCard
            label="Score Confidence"
            value={formatPercent01(score.score_confidence)}
          />
        </div>
      )}
    </div>
  );
}

interface ScoreCardProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function ScoreCard({ label, value, emphasis }: ScoreCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          emphasis
            ? "mt-1 text-3xl font-bold tabular-nums"
            : "mt-1 text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

interface RiskHistoryCardProps {
  history: ChemistryRiskScoreRead[];
  isLoading: boolean;
}

function RiskHistoryCard({ history, isLoading }: RiskHistoryCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Risk score history</h2>
        <span className="text-xs text-muted-foreground">
          last {history.length || 0} runs
        </span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No prior runs on file.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-medium">As of</th>
                <th className="py-2 pr-3 text-right font-medium">Composite</th>
                <th className="py-2 pr-3 text-right font-medium">
                  Concentration
                </th>
                <th className="py-2 pr-3 text-right font-medium">
                  Geopolitical
                </th>
                <th className="py-2 text-right font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {formatDate(row.as_of_date)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {formatScore(row.composite_risk_score)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {formatScore(row.material_concentration_score)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {formatScore(row.geopolitical_score)}
                  </td>
                  <td className="py-2 text-right">
                    <ConfidenceBadge value={row.score_confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface ActiveCompositionTableProps {
  materials: ChemistryMaterialRead[];
}

function ActiveCompositionTable({ materials }: ActiveCompositionTableProps) {
  const columns = useMemo<ColumnDef<ChemistryMaterialRead, unknown>[]>(
    () => [
      {
        accessorKey: "material_canonical_name",
        header: "Material",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.material_canonical_name}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline">{humanize(row.original.role)}</Badge>
        ),
      },
      {
        accessorKey: "intensity",
        header: () => <div className="text-right">Intensity</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatIntensity(row.original.intensity)}
          </div>
        ),
      },
      {
        accessorKey: "is_substitutable",
        header: "Substitutable",
        cell: ({ row }) =>
          row.original.is_substitutable ? (
            <Badge
              variant="outline"
              className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
            >
              Yes
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-0 bg-muted text-muted-foreground"
            >
              No
            </Badge>
          ),
      },
      {
        accessorKey: "valid_from",
        header: "Valid from",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.valid_from)}
          </span>
        ),
      },
      {
        accessorKey: "valid_to",
        header: "Valid to",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.valid_to ? formatDate(row.original.valid_to) : "—"}
          </span>
        ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) =>
          row.original.notes ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.notes}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">Active composition</h2>
      <PlatformTable
        data={materials}
        columns={columns}
        emptyTitle="No active materials linked to this chemistry."
      />
    </div>
  );
}
