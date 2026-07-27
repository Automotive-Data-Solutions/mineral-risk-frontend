import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Optional element rendered in the top-right corner (actions, buttons, etc.) */
  actions?: ReactNode;
}

/**
 * Standardised page header: title + optional subtitle + optional action area.
 * Uses .p-page-title / .p-page-sub from platform.css.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div className="p-page-header">
        <h1 className="p-page-title">{title}</h1>
        {subtitle && <p className="p-page-sub">{subtitle}</p>}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
