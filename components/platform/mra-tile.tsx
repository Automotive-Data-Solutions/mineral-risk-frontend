import { cn } from "@/lib/utils";

interface MraTileProps {
  className?: string;
}

export function MraTile({ className }: MraTileProps) {
  return (
    <div className={cn("flex items-center gap-[10px]", className)}>
      <div className="p-tile">
        <span className="p-tile-num">83</span>
        <span className="p-tile-glyph">MRa</span>
      </div>
      <div className="p-brand-name">
        Mineral Risk
        <span className="p-brand-sub">Analytics</span>
      </div>
    </div>
  );
}
