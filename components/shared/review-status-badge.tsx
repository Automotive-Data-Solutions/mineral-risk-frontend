"use client";

import { cn } from "@/lib/utils";

type ReviewStatus = "pending" | "confirmed" | "excluded";

const STATUS_CONFIG: Record<
  ReviewStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending review",
    className: "bg-muted text-muted-foreground",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  excluded: {
    label: "Excluded",
    className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  },
};

interface ReviewStatusBadgeProps {
  status: ReviewStatus | string;
  className?: string;
}

export function ReviewStatusBadge({ status, className }: ReviewStatusBadgeProps) {
  const config =
    STATUS_CONFIG[status as ReviewStatus] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-tight",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
