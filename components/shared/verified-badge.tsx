"use client";

import { CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  verified: boolean;
  /** Show an icon even when unverified (greyed out). Default: false — hide when unverified. */
  showUnverified?: boolean;
  className?: string;
}

/**
 * Small inline icon shown on table rows and side-sheet headers.
 * Green checkmark = verified. Nothing (or grey) = not yet verified.
 */
export function VerifiedBadge({
  verified,
  showUnverified = false,
  className,
}: VerifiedBadgeProps) {
  if (!verified && !showUnverified) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CheckCircle2
          className={cn(
            "inline-block h-3.5 w-3.5 shrink-0",
            verified
              ? "text-emerald-500"
              : "text-muted-foreground/40",
            className,
          )}
          aria-label={verified ? "Verified" : "Not yet verified"}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        {verified ? "Verified" : "Not yet verified"}
      </TooltipContent>
    </Tooltip>
  );
}
