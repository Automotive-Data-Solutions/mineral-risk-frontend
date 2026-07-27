import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// PlatformCard — outer wrapper (.p-card)
// ---------------------------------------------------------------------------

interface PlatformCardProps {
  children: ReactNode;
  className?: string;
  /** Remove overflow:hidden (e.g. when a dropdown inside needs to escape) */
  noOverflow?: boolean;
}

export function PlatformCard({ children, className, noOverflow }: PlatformCardProps) {
  return (
    <div
      className={cn("p-card", className)}
      style={noOverflow ? { overflow: "visible" } : undefined}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlatformCardHeader — .p-card-head
// ---------------------------------------------------------------------------

interface PlatformCardHeaderProps {
  /** Primary card title (renders inside an h3) */
  title: ReactNode;
  /** Secondary subtitle line below the title */
  subtitle?: ReactNode;
  /** Element placed at the trailing edge (e.g. "View all →" link, action menu) */
  actions?: ReactNode;
}

export function PlatformCardHeader({ title, subtitle, actions }: PlatformCardHeaderProps) {
  return (
    <div className="p-card-head">
      <div>
        <h3>{title}</h3>
        {subtitle && <div className="p-card-sub">{subtitle}</div>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlatformCardBody — .p-card-body
// ---------------------------------------------------------------------------

interface PlatformCardBodyProps {
  children: ReactNode;
  /** Remove the default 16px padding (useful for full-bleed tables/lists) */
  noPadding?: boolean;
  className?: string;
}

export function PlatformCardBody({ children, noPadding, className }: PlatformCardBodyProps) {
  return (
    <div
      className={cn("p-card-body", className)}
      style={noPadding ? { padding: 0 } : undefined}
    >
      {children}
    </div>
  );
}
