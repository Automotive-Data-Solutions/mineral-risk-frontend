import { cn } from "@/lib/utils";

export type RiskBand = "HIGH" | "MED" | "LOW" | "CRIT" | null;

interface ScoreChipProps {
  score: number | null | undefined;
  /** If omitted, band is derived automatically from the score. */
  band?: RiskBand;
  /** When false, shows only the numeric score and tier dot (no “· Med” label). Default true. */
  showBandLabel?: boolean;
  className?: string;
}

function deriveBand(score: number): RiskBand {
  if (score >= 75) return "CRIT";
  if (score >= 55) return "HIGH";
  if (score >= 35) return "MED";
  return "LOW";
}

function bandClass(band: RiskBand): string {
  switch (band) {
    case "CRIT":
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
  className,
}: ScoreChipProps) {
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
