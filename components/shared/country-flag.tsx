"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { countryCodeToName, countryToFlag } from "@/lib/utils/format";

interface CountryFlagProps {
  code: string | null | undefined;
  showCode?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function CountryFlag({
  code,
  showCode = true,
  showTooltip = true,
  className,
}: CountryFlagProps) {
  if (!code) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }
  const flag = countryToFlag(code);
  const content = (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {flag && <span aria-hidden>{flag}</span>}
      {showCode && <span className="font-mono text-xs">{code.toUpperCase()}</span>}
    </span>
  );
  if (!showTooltip) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{content}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{countryCodeToName(code)}</TooltipContent>
    </Tooltip>
  );
}
