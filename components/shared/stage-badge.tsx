import { cn } from "@/lib/utils";
import { humanize } from "@/lib/utils/format";

/**
 * Maps supply-chain stage values to platform CSS p-badge-* modifier classes.
 * Uses the closest available platform colour for each stage; intentionally
 * avoids Tailwind bg-* classes so badges track the design-system tokens.
 */
const STAGE_BADGE: Record<string, string> = {
  oem:        "p-badge-blue",
  cell_maker: "p-badge-violet",
  pack_maker: "p-badge-violet",   // no fuchsia token; violet is closest
  miner:      "p-badge-amber",
  refiner:    "p-badge-amber",    // no orange token; amber is closest
  recycler:   "p-badge-emerald",
  trader:     "p-badge-slate",
  holding:    "p-badge-blue",
  other:      "p-badge-soft",
};

interface StageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  if (!stage) {
    return (
      <span className={cn("p-badge p-badge-outline", className)}>—</span>
    );
  }
  return (
    <span
      className={cn(
        "p-badge",
        STAGE_BADGE[stage] ?? STAGE_BADGE.other,
        className,
      )}
    >
      {humanize(stage)}
    </span>
  );
}
