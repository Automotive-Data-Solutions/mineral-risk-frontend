"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/platform/page-layout";
import { PageHeader } from "@/components/platform/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformTable } from "@/components/platform/platform-table";
import { DataTableToolbar } from "@/components/data-table/toolbar";
import { DataTablePagination } from "@/components/data-table/pagination";
import {
  buildMarketRiskScoreColumns,
  sortMarketRiskScoreRows,
} from "@/lib/table/market-risk-score-columns";
import {
  useMarketScores,
  useRescoreMarket,
} from "@/lib/hooks/use-market-scores";

const DEFAULT_LIMIT = 50;

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

  const pageRows = data?.data;

  const columns = useMemo(
    () =>
      buildMarketRiskScoreColumns({
        showMaterialColumn: true,
        overallBandLabels: true,
      }),
    [],
  );

  const displayRows = useMemo(
    () => sortMarketRiskScoreRows(pageRows ?? []),
    [pageRows],
  );

  const total = data?.total ?? 0;

  const handleRescore = async () => {
    try {
      const result = await rescore.mutateAsync();
      toast.success(`Scored ${result.scored.toLocaleString()} pairs`);
    } catch {
      toast.error("Rescore failed");
    }
  };

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
    <PageLayout>
      <PageHeader
        title="Market Risk Scores"
        subtitle="Latest material × geography risk surface. One row per active (material, geography) pair."
      />

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
          className="h-9 max-w-[140px]"
        />
        <Input
          placeholder="Geography (ISO-2)"
          maxLength={2}
          value={geographyInput}
          onChange={(e) => setGeographyInput(e.target.value)}
          onBlur={() => setGeographyInput((v) => v.trim().toUpperCase())}
          className="h-9 max-w-[160px] uppercase"
        />
        <Input
          placeholder="Min overall (0–100)"
          inputMode="numeric"
          value={minOverallInput}
          onChange={(e) => setMinOverallInput(e.target.value)}
          className="h-9 max-w-[160px]"
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </DataTableToolbar>

      <PlatformTable
        data={displayRows}
        columns={columns}
        isLoading={
          isLoading ||
          (isFetching && (pageRows == null || pageRows.length === 0))
        }
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
    </PageLayout>
  );
}
