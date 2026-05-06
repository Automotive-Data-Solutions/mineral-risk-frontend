"use client";

import { cn } from "@/lib/utils";
import {
  humanizeRegulationStatus,
  regulationStatusDotClass,
  regulationStatusPillClass,
} from "@/lib/utils/regulations";

interface RegulationStatusPillProps {
  status: string | null | undefined;
  className?: string;
}

export function RegulationStatusPill({
  status,
  className,
}: RegulationStatusPillProps) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        regulationStatusPillClass(status),
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-1.5 rounded-full",
          regulationStatusDotClass(status),
        )}
      />
      {humanizeRegulationStatus(status)}
    </span>
  );
}
