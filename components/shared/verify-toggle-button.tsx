"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerifyToggleButtonProps {
  verified: boolean;
  onToggle: () => void;
  disabled?: boolean;
  markLabel?: string;
  unmarkLabel?: string;
}

export function VerifyToggleButton({
  verified,
  onToggle,
  disabled,
  markLabel = "Mark as verified",
  unmarkLabel = "Remove verification",
}: VerifyToggleButtonProps) {
  return (
    <Button variant="outline" size="sm" disabled={disabled} onClick={onToggle}>
      <CheckCircle2 className="h-3.5 w-3.5" />
      {verified ? unmarkLabel : markLabel}
    </Button>
  );
}

