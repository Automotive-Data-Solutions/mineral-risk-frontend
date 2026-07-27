import { cn } from "@/lib/utils";
import { scoreToBand } from "@/lib/utils/risk-band";

export type RiskBand = "HIGH" | "MED" | "LOW" | "CRIT" | null;

interface ScoreChipProps {
  score: number | null | undefined;
  /** If omitted, band is derived automatically from the score. */
  band?: RiskBand;
  /** When false, shows only the numeric score and tier dot (no “· Med” label). Default true. */
  showBandLabel?: boolean;
  /** 2026-07-20 insufficient-data gate: when true (concentration pillar
   *  unscored — backend `concentration_scored === false`) render a neutral
   *  "Insufficient data" chip instead of banding the score. */
  insufficientData?: boolean;
  className?: string;
}

// 2026-07-20: previously this component had its OWN 75/55/35 ladder,
// silently diverging from the risk-band.ts source of truth.  Now derives
// from the canonical scoreToBand and maps MOD -> this component's legacy
// "MED" token (CSS classes unchanged).
function deriveBand(score: number): RiskBand {
  const b = scoreToBand(score);
  return b === "MOD" ? "MED" : b;
}

function bandClass(band: RiskBand): string {
  switch (band) {
    case "CRIT":
      return "p-score-crit";
    case "HIGH":
      return "p-score-high";
    case "MED":
      return "p-score-med";
    case "LOW":
      return "p-score-low";
    default:
      return "p-score-none";
  }
}

function dotClass(band: RiskBand): string {
  switch (band) {
    case "CRIT":
      return "p-dot-crit";
    case "HIGH":
      return "p-dot-high";
    case "MED":
      return "p-dot-med";
    case "LOW":
      return "p-dot-low";
    default:
      return "p-dot-none";
  }
}

function bandLabel(band: RiskBand): string {
  switch (band) {
    case "CRIT": return "Crit";
    case "HIGH": return "High";
    case "MED":  return "Med";
    case "LOW":  return "Low";
    default:     return "—";
  }
}

export function ScoreChip({
  score,
  band,
  showBandLabel = true,
  insufficientData = false,
  className,
}: ScoreChipProps) {
  if (insufficientData) {
    return (
      <span className={cn("p-score p-score-none", className)}>
        Insufficient data
      </span>
    );
  }
  if (score == null) {
    return (
      <span className={cn("p-score p-score-none", className)}>—</span>
    );
  }

  const resolvedBand = band ?? deriveBand(score);

  return (
    <span className={cn("p-score", bandClass(resolvedBand), className)}>
      <span className={cn("p-score-dot", dotClass(resolvedBand))} />
      {showBandLabel ? (
        <>
          {score.toFixed(1)} · {bandLabel(resolvedBand)}
        </>
      ) : (
        score.toFixed(1)
      )}
    </span>
  );
}
