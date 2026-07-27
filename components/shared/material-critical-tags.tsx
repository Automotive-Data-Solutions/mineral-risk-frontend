"use client";

import { Badge } from "@/components/ui/badge";

interface MaterialCriticalTagsProps {
  isIraCritical: boolean;
  isEuCrmaCritical: boolean;
  emptyLabel?: string;
}

export function MaterialCriticalTags({
  isIraCritical,
  isEuCrmaCritical,
  emptyLabel,
}: MaterialCriticalTagsProps) {
  const showEmpty = !isIraCritical && !isEuCrmaCritical && emptyLabel;

  return (
    <div className="flex flex-wrap gap-1">
      {isIraCritical ? (
        <Badge
          variant="outline"
          className="border-0 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
        >
          IRA
        </Badge>
      ) : null}
      {isEuCrmaCritical ? (
        <Badge
          variant="outline"
          className="border-0 bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200"
        >
          EU CRMA
        </Badge>
      ) : null}
      {showEmpty ? (
        <span className="text-xs text-muted-foreground">{emptyLabel}</span>
      ) : null}
    </div>
  );
}

