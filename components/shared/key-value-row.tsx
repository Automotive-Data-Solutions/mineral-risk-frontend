"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KeyValueRowProps {
  label: string;
  value: ReactNode;
  /**
   * Grid column template class for label/value sizing.
   * Default fits most side-sheet layouts.
   */
  gridTemplateClassName?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function KeyValueRow({
  label,
  value,
  gridTemplateClassName = "grid-cols-[160px_minmax(0,1fr)]",
  className,
  labelClassName,
  valueClassName,
}: KeyValueRowProps) {
  return (
    <div
      className={cn(
        "grid items-start gap-3",
        gridTemplateClassName,
        className,
      )}
    >
      <span className={cn("text-muted-foreground", labelClassName)}>{label}</span>
      <span className={cn("min-w-0 break-words font-medium", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

