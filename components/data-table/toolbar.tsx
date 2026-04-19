"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * Thin wrapper that gives filter toolbars consistent spacing/layout above a
 * DataTable. The first child group is the filter controls; ``actions`` sits on
 * the right (e.g. "Add" or "Flag" buttons).
 */
export function DataTableToolbar({
  children,
  actions,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 py-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
