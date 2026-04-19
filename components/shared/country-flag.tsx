import { cn } from "@/lib/utils";
import { countryToFlag } from "@/lib/utils/format";

interface CountryFlagProps {
  code: string | null | undefined;
  showCode?: boolean;
  className?: string;
}

export function CountryFlag({ code, showCode = true, className }: CountryFlagProps) {
  if (!code) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }
  const flag = countryToFlag(code);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {flag && <span aria-hidden>{flag}</span>}
      {showCode && <span className="font-mono text-xs">{code.toUpperCase()}</span>}
    </span>
  );
}
