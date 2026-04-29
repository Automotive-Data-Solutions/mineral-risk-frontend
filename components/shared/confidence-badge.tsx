import { cn } from "@/lib/utils";
import {
  formatConfidence,
  normalizeConfidencePercent,
} from "@/lib/utils/format";

interface ConfidenceBadgeProps {
  /** Backend may send 0..1 or 0..100 as number or numeric string. */
  value: number | string | null | undefined;
  className?: string;
}

/**
 * Small badge displaying a 0..1 confidence score as a percentage.
 * Colors follow the canonical stoplight: green (>=75%), amber (>=50%), rose (<50%).
 * Uses platform CSS p-badge-* classes for consistent theming.
 */
export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const pct = normalizeConfidencePercent(value);

  if (pct == null) {
    return (
      <span className={cn("p-badge p-badge-outline font-mono", className)}>
        —
      </span>
    );
  }

  const tone =
    pct >= 75
      ? "p-badge-emerald"
      : pct >= 50
      ? "p-badge-amber"
      : "p-badge-rose";

  return (
    <span className={cn("p-badge", tone, "font-mono", className)}>
      {formatConfidence(value)}
    </span>
  );
}
