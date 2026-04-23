"use client";

import { Flag } from "lucide-react";
import { EntityFlagIssueDialog } from "@/components/shared/entity-flag-issue-dialog";
import { Button } from "@/components/ui/button";
import type { FlaggableEntityType } from "@/lib/types";

interface FlagEntityButtonProps {
  entityType: FlaggableEntityType;
  entityId: string;
  parentId?: string;
  entityLabel?: string;
  sectionLabel?: string;
  buttonLabel: string;
}

export function FlagEntityButton({
  entityType,
  entityId,
  parentId,
  entityLabel,
  sectionLabel,
  buttonLabel,
}: FlagEntityButtonProps) {
  return (
    <EntityFlagIssueDialog
      entityType={entityType}
      entityId={entityId}
      parentId={parentId}
      entityLabel={entityLabel}
      sectionLabel={sectionLabel}
      trigger={
        <Button variant="outline" size="sm">
          <Flag className="h-3.5 w-3.5" />
          {buttonLabel}
        </Button>
      }
    />
  );
}

