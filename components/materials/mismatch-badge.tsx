import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/utils/format";
import type { HsMappingMismatchReason } from "@/lib/types";

const REASON_TONE: Record<HsMappingMismatchReason, string> = {
  low_confidence:
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  missing_description:
    "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  category_chapter_mismatch:
    "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  duplicate_hs_prefix:
    "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200",
};

const REASON_LABEL: Record<HsMappingMismatchReason, string> = {
  low_confidence: "Low conf.",
  missing_description: "Missing description",
  category_chapter_mismatch: "Chapter mismatch",
  duplicate_hs_prefix: "Duplicate prefix",
};

interface MismatchBadgeProps {
  reason: HsMappingMismatchReason;
  className?: string;
}

export function MismatchBadge({ reason, className }: MismatchBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 border-0 px-2 py-0.5 font-medium",
        REASON_TONE[reason],
        className,
      )}
      title={REASON_LABEL[reason] ?? humanize(reason)}
    >
      <AlertTriangle className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      <span>{REASON_LABEL[reason] ?? humanize(reason)}</span>
    </Badge>
  );
}

interface MismatchBadgeListProps {
  reasons: HsMappingMismatchReason[];
  className?: string;
}

export function MismatchBadgeList({
  reasons,
  className,
}: MismatchBadgeListProps) {
  if (reasons.length === 0) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1 border-0 bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
          className,
        )}
      >
        <CheckCircle2 className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
        OK
      </Badge>
    );
  }
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {reasons.map((r) => (
        <MismatchBadge key={r} reason={r} />
      ))}
    </div>
  );
}
