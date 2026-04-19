import type { RiskBand } from "@/lib/types";

/** Mirrors app/services/scoring/bands.py (backend). Returns null for null input. */
export function scoreToBand(score: number | null | undefined): RiskBand | null {
  if (score == null || Number.isNaN(score)) return null;
  if (score < 25) return "LOW";
  if (score < 50) return "MOD";
  if (score < 75) return "HIGH";
  return "CRIT";
}

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  LOW: "Low",
  MOD: "Moderate",
  HIGH: "High",
  CRIT: "Critical",
};

/**
 * Tailwind class fragments for each band. Usage:
 *   <span className={riskBandClasses("HIGH").solid}>
 */
export function riskBandClasses(band: RiskBand | null): {
  solid: string;
  soft: string;
  text: string;
  dot: string;
} {
  switch (band) {
    case "LOW":
      return {
        solid: "bg-emerald-600 text-white",
        soft: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        text: "text-emerald-600",
        dot: "bg-emerald-500",
      };
    case "MOD":
      return {
        solid: "bg-amber-500 text-white",
        soft: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        text: "text-amber-600",
        dot: "bg-amber-500",
      };
    case "HIGH":
      return {
        solid: "bg-orange-600 text-white",
        soft: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
        text: "text-orange-600",
        dot: "bg-orange-500",
      };
    case "CRIT":
      return {
        solid: "bg-red-600 text-white",
        soft: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
        text: "text-red-600",
        dot: "bg-red-500",
      };
    default:
      return {
        solid: "bg-muted text-muted-foreground",
        soft: "bg-muted text-muted-foreground",
        text: "text-muted-foreground",
        dot: "bg-muted-foreground",
      };
  }
}
