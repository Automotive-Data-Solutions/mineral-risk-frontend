"use client";

import { useState, type ReactNode } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import type { FlaggableEntityType } from "@/lib/types";

interface RowActionsMenuProps {
  entityType: FlaggableEntityType;
  entityId: string;
  /** Required for nested-note entity types (e.g. hs-code mapping, company exposure). */
  parentId?: string;
  /** Human-readable label shown in the flag dialog header. */
  entityLabel?: string;
  /** Section context prepended to ``note_text``. */
  sectionLabel?: string;
  /** Extra dropdown items rendered above the divider + Flag action. */
  children?: ReactNode;
  /** Visible label for screen readers; defaults to "Row actions". */
  ariaLabel?: string;
}

/**
 * Reusable kebab (`⋯`) row-action menu for reference-data tables.
 * Always exposes a "Flag issue" item that opens an `EntityFlagIssueDialog`.
 *
 * Stops propagation on the trigger so clicking the menu doesn't bubble up
 * to the parent `<TableRow onClick>` (which usually navigates to a detail
 * page).
 */
export function RowActionsMenu({
  entityType,
  entityId,
  parentId,
  entityLabel,
  sectionLabel,
  children,
  ariaLabel = "Row actions",
}: RowActionsMenuProps) {
  const [flagOpen, setFlagOpen] = useState(false);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={ariaLabel}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {children}
          {children ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setFlagOpen(true);
            }}
            className="text-amber-700 focus:text-amber-800 dark:text-amber-300 dark:focus:text-amber-200"
          >
            <Flag className="h-3.5 w-3.5" />
            Flag issue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EntityFlagIssueDialog
        entityType={entityType}
        entityId={entityId}
        parentId={parentId}
        entityLabel={entityLabel}
        sectionLabel={sectionLabel}
        open={flagOpen}
        onOpenChange={setFlagOpen}
      />
    </div>
  );
}
