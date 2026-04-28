import type { ApiClient } from "./client";
import type { MarketScoresResponse, RescoredResult } from "@/lib/types";

export interface MarketScoresParams {
  page?: number;
  limit?: number;
  material_id?: number;
  geography_code?: string;
  /** Inclusive lower bound on overall_risk_score (0..100). */
  min_overall?: number;
}

/**
 * Latest material × geography risk surface. Server returns one row per
 * active (material, geography) pair on the requested ``as_of_date`` (the
 * default is the most recent run).
 */
export async function getMarketScores(
  client: ApiClient,
  params: MarketScoresParams = {},
): Promise<MarketScoresResponse> {
  const { data } = await client.get<MarketScoresResponse>(
    "/api/v1/market/scores",
    { params },
  );
  return data;
}

/**
 * Triggers a synchronous rescore of every active (material, geography)
 * pair. Returns the run id and the number of rows scored.
 */
export async function rescoreMarket(
  client: ApiClient,
): Promise<RescoredResult> {
  const { data } = await client.post<RescoredResult>("/api/v1/market/rescore");
  return data;
}
