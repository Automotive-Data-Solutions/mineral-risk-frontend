import { cn } from "@/lib/utils";
import { humanize } from "@/lib/utils/format";

/**
 * Supply-chain *material* stage badge — distinct from `StageBadge` which
 * encodes company-actor types (miner, refiner, cell_maker, oem, etc.).
 *
 * The two share visual treatment via `p-badge-*` classes, but the values
 * are different:
 *
 *   StageBadge (actor):     oem | cell_maker | pack_maker | miner | refiner | recycler | trader
 *   This (material stage):  ore | concentrate | intermediate | refined |
 *                           battery_grade | fabricated | scrap | unassigned
 *
 * Sequenced earliest → latest in the supply chain so colour can encode
 * proximity to the cell (battery_grade and fabricated are the highest-
 * value, most-concentrated risk; ore is the most upstream).
 */

export type SupplyChainStage =
  | "ore"
  | "concentrate"
  | "intermediate"
  | "refined"
  | "battery_grade"
  | "fabricated"
  | "scrap"
  | "unassigned";

const SUPPLY_STAGE_BADGE: Record<SupplyChainStage, string> = {
  ore:           "p-badge-amber",
  concentrate:   "p-badge-amber",
  intermediate:  "p-badge-blue",
  refined:       "p-badge-violet",
  battery_grade: "p-badge-rose",
  fabricated:    "p-badge-emerald",
  scrap:         "p-badge-slate",
  unassigned:    "p-badge-outline",
};

const STAGE_LABEL: Record<SupplyChainStage, string> = {
  ore:           "Ore / mining",
  concentrate:   "Concentrate",
  intermediate:  "Intermediate",
  refined:       "Refined",
  battery_grade: "Battery grade",
  fabricated:    "Fabricated",
  scrap:         "Scrap",
  unassigned:    "Unassigned",
};

/**
 * Stable ordering for stage groupings — earliest → latest in the supply
 * chain. Use to sort grouped stage views.
 */
export const SUPPLY_STAGE_SEQUENCE: readonly SupplyChainStage[] = [
  "ore",
  "concentrate",
  "intermediate",
  "refined",
  "battery_grade",
  "fabricated",
  "scrap",
  "unassigned",
] as const;

interface SupplyChainStageBadgeProps {
  stage: string | null | undefined;
  className?: string;
}

export function SupplyChainStageBadge({ stage, className }: SupplyChainStageBadgeProps) {
  if (!stage) {
    return (
      <span className={cn("p-badge p-badge-outline", className)}>—</span>
    );
  }
  const key = stage as SupplyChainStage;
  const variant = SUPPLY_STAGE_BADGE[key] ?? "p-badge-outline";
  const label = STAGE_LABEL[key] ?? humanize(stage);
  return (
    <span className={cn("p-badge", variant, className)}>{label}</span>
  );
}
