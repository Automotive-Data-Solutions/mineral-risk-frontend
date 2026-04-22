import { Badge } from "@/components/ui/badge";
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
 * Small badge displaying a 0..1 confidence score as a percentage. Colors
 * follow the canonical "stoplight": green (>=0.75), amber (>=0.5), red
 * otherwise. Null/undefined renders a neutral "—".
 */
export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const pct = normalizeConfidencePercent(value);
  if (pct == null) {
    return (
      <Badge variant="outline" className={cn("font-mono", className)}>
        —
      </Badge>
    );
  }
  const tone =
    pct >= 75
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      : pct >= 50
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
      : "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200";
  return (
    <Badge variant="outline" className={cn("font-mono border-0", tone, className)}>
      {formatConfidence(value)}
    </Badge>
  );
}
