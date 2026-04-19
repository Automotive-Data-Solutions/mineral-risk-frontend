import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { humanize } from "@/lib/utils/format";

const STAGE_STYLES: Record<string, string> = {
  oem: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  cell_maker: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  pack_maker: "bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200",
  miner: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  refiner: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  recycler: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  trader: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
  holding: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200",
  other: "bg-muted text-muted-foreground",
};

interface StageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (!stage) {
    return (
      <Badge variant="outline" className={className}>
        —
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn("border-0", STAGE_STYLES[stage] ?? STAGE_STYLES.other, className)}
    >
      {humanize(stage)}
    </Badge>
  );
}
