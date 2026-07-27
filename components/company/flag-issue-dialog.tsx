"use client";

import type { ReactNode } from "react";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";

interface FlagIssueDialogProps {
  companyId: string;
  /**
   * Short string describing which panel / section the user flagged from.
   * It's prepended to the note text for context (e.g. ``"[Relationships]"``).
   */
  sectionLabel?: string;
  /** Optional custom trigger. Defaults to a small outline "Flag Issue" button. */
  trigger?: ReactNode;
}

/**
 * Thin backward-compatible wrapper around `EntityFlagIssueDialog` for the
 * Phase-1 company detail page. New callers should prefer
 * `EntityFlagIssueDialog` directly.
 */
export function FlagIssueDialog({
  companyId,
  sectionLabel,
  trigger,
}: FlagIssueDialogProps) {
  return (
    <EntityFlagIssueDialog
      entityType="company"
      entityId={companyId}
      sectionLabel={sectionLabel}
      trigger={trigger}
    />
  );
}
