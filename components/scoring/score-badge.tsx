import { cn } from "@/lib/utils";
import {
  riskBandClasses,
  RISK_BAND_LABEL,
  scoreToBand,
} from "@/lib/utils/risk-band";
import type { RiskBand } from "@/lib/types";

interface ScoreBadgeProps {
  score: number | null | undefined;
  band?: RiskBand | null;
  variant?: "solid" | "soft";
  showScore?: boolean;
  className?: string;
}

/**
 * Compact chip showing a numeric risk score + band. When ``band`` is omitted
 * it's derived from ``score`` via ``scoreToBand``. Use ``variant="solid"`` on
 * tables where strong color is desirable; the default "soft" is better for
 * cards / headers.
 */
export function ScoreBadge({
  score,
  band,
  variant = "soft",
  showScore = true,
  className,
}: ScoreBadgeProps) {
  const resolvedBand = (band ?? scoreToBand(score ?? null)) as RiskBand | null;
  const classes = riskBandClasses(resolvedBand);
  const label = resolvedBand ? RISK_BAND_LABEL[resolvedBand] : "Unscored";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "solid" ? classes.solid : classes.soft,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", classes.dot)} aria-hidden />
      {showScore && score != null && !Number.isNaN(score)
        ? `${score.toFixed(1)} · ${label}`
        : label}
    </span>
  );
}
