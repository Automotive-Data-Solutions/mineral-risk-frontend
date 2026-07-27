import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-[color:var(--p-bg-muted)]",
        className,
      )}
    />
  );
}

export function KpiCard({ label, value, sub, isLoading, className }: KpiCardProps) {
  return (
    <div className={cn("p-kpi", className)}>
      <div className="p-kpi-label">{label}</div>
      {isLoading ? (
        <Skeleton className="mt-1 h-8 w-24" />
      ) : (
        <div className="p-kpi-value">{value}</div>
      )}
      {sub && (
        <div className="p-kpi-sub">
          {isLoading ? <Skeleton className="h-3 w-32" /> : sub}
        </div>
      )}
    </div>
  );
}
