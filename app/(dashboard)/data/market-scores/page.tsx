"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { ConfidenceBadge } from "@/components/shared/confidence-badge";
import {
  useMarketScores,
  useRescoreMarket,
} from "@/lib/hooks/use-market-scores";
import type { MaterialGeographyScoreRead } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

const DEFAULT_LIMIT = 50;

function formatScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

export default function MarketScoresPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [materialIdInput, setMaterialIdInput] = useState("");
  const [geographyInput, setGeographyInput] = useState("");
  const [minOverallInput, setMinOverallInput] = useState("");

  const [materialId, setMaterialId] = useState<number | undefined>(undefined);
  const [geographyCode, setGeographyCode] = useState("");
  const [minOverall, setMinOverall] = useState<number | undefined>(undefined);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = materialIdInput.trim();
      const next = trimmed === "" ? undefined : Number(trimmed);
      const normalized =
        next != null && Number.isFinite(next) && next > 0 ? next : undefined;
      if (normalized !== materialId) {
        setMaterialId(normalized);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialIdInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = geographyInput.trim().toUpperCase();
      if (next !== geographyCode) {
        setGeographyCode(next);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geographyInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = minOverallInput.trim();
      const next = trimmed === "" ? undefined : Number(trimmed);
      const normalized =
        next != null && Number.isFinite(next) ? next : undefined;
      if (normalized !== minOverall) {
        setMinOverall(normalized);
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minOverallInput]);

  const apiParams = useMemo(
    () => ({
      page,
      limit,
      material_id: materialId,
      geography_code: geographyCode || undefined,
      min_overall: minOverall,
    }),
    [page, limit, materialId, geographyCode, minOverall],
  );

  const { data, isLoading, error, refetch, isFetching } =
    useMarketScores(apiParams);

  const rescore = useRescoreMarket();

  const handleRescore = async () => {
    try {
      const result = await rescore.mutateAsync();
      toast.success(`Scored ${result.scored.toLocaleString()} pairs`);
    } catch {
      toast.error("Rescore failed");
    }
  };

  const columns = useMemo<
    ColumnDef<MaterialGeographyScoreRead, unknown>[]
  >(
    () => [
      {
        accessorKey: "material_id",
        header: () => <div className="text-right">Material ID</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-sm">
            {row.original.material_id}
          </div>
        ),
      },
      {
        accessorKey: "geography_code",
        header: "Geography",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono uppercase">
            {row.original.geography_code}
          </Badge>
        ),
      },
      {
        accessorKey: "overall_risk_score",
        header: () => <div className="text-right">Overall</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <ConfidenceBadge value={row.original.overall_risk_score} />
          </div>
        ),
      },
      {
        accessorKey: "material_concentration_score",
        header: () => <div className="text-right">Concentration</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatScore(row.original.material_concentration_score)}
          </div>
        ),
      },
      {
        accessorKey: "geopolitical_trade_score",
        header: () => <div className="text-right">Geopolitical</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatScore(row.original.geopolitical_trade_score)}
          </div>
        ),
      },
      {
        accessorKey: "regulatory_compliance_score",
        header: () => <div className="text-right">Regulatory</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatScore(row.original.regulatory_compliance_score)}
          </div>
        ),
      },
      {
        accessorKey: "operational_score",
        header: () => <div className="text-right">Operational</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatScore(row.original.operational_score)}
          </div>
        ),
      },
      {
        accessorKey: "financial_pressure_score",
        header: () => <div className="text-right">Financial</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono tabular-nums">
            {formatScore(row.original.financial_pressure_score)}
          </div>
        ),
      },
      {
        accessorKey: "event_count",
        header: () => <div className="text-right">Events</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Badge variant="secondary" className="font-mono">
              {row.original.event_count.toLocaleString()}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "as_of_date",
        header: "As of",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.as_of_date)}
          </span>
        ),
      },
    ],
    [],
  );

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasFilters =
    materialIdInput !== "" ||
    geographyInput !== "" ||
    minOverallInput !== "";

  const handleClearFilters = () => {
    setMaterialIdInput("");
    setGeographyInput("");
    setMinOverallInput("");
    setMaterialId(undefined);
    setGeographyCode("");
    setMinOverall(undefined);
    setPage(1);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Market Risk Scores
        </h1>
        <p className="text-sm text-muted-foreground">
          Latest material × geography risk surface. One row per active
          (material, geography) pair.
        </p>
      </div>

      <DataTableToolbar
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {data?.total != null
                ? `${data.total.toLocaleString()} pairs`
                : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRescore}
              disabled={rescore.isPending}
            >
              {rescore.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Rescore all
            </Button>
          </div>
        }
      >
        <Input
          placeholder="Material ID"
          inputMode="numeric"
          value={materialIdInput}
          onChange={(e) => setMaterialIdInput(e.target.value)}
          className="h-9 w-[140px]"
        />
        <Input
          placeholder="Geography (ISO-2)"
          maxLength={2}
          value={geographyInput}
          onChange={(e) => setGeographyInput(e.target.value)}
          onBlur={() => setGeographyInput((v) => v.trim().toUpperCase())}
          className="h-9 w-[160px] uppercase"
        />
        <Input
          placeholder="Min overall (0–100)"
          inputMode="numeric"
          value={minOverallInput}
          onChange={(e) => setMinOverallInput(e.target.value)}
          className="h-9 w-[160px]"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </DataTableToolbar>

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading || (isFetching && rows.length === 0)}
        error={error}
        onRetry={() => refetch()}
        emptyTitle="No market scores match your filters"
        emptyDescription={
          hasFilters
            ? "Try clearing filters or rescoring the market."
            : "Run a rescore to populate the latest material × geography surface."
        }
      />

      <DataTablePagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />
    </div>
  );
}
