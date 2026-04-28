"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VerifyToggleButtonProps {
  verified: boolean;
  onToggle: () => void;
  disabled?: boolean;
  markLabel?: string;
  unmarkLabel?: string;
  highlightWhenVerified?: boolean;
}

export function VerifyToggleButton({
  verified,
  onToggle,
  disabled,
  markLabel = "Mark as verified",
  unmarkLabel = "Remove verification",
  highlightWhenVerified = false,
}: VerifyToggleButtonProps) {
  const showVerifiedHighlight = highlightWhenVerified && verified;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        showVerifiedHighlight &&
          "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50",
      )}
    >
      <CheckCircle2
        className={cn(
          "h-3.5 w-3.5",
          showVerifiedHighlight && "text-emerald-600 dark:text-emerald-300",
        )}
      />
      {verified ? unmarkLabel : markLabel}
    </Button>
  );
}

