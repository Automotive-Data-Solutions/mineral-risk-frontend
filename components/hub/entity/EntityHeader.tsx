/**
 * Masthead for a company or regulation page. Informative-first launch:
 * no risk-band chip (the mockup's band aside returns in Phase 4 when
 * company scoring is live and the engine is honed).
 */

import type { CompanyFactOut } from "@/lib/api/entities";

interface EntityHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string | null;
  facts?: CompanyFactOut[];
}

export function EntityHeader({ eyebrow, title, subtitle, facts = [] }: EntityHeaderProps) {
  return (
    <header className="ih-entity-head">
      <div className="ih-entity-head-main">
        <div className="ih-eyebrow">{eyebrow}</div>
        <h1 className="ih-entity-title">{title}</h1>
        {subtitle ? <div className="ih-entity-sub">{subtitle}</div> : null}
        {facts.length ? (
          <div className="ih-entity-facts">
            {facts.map((f, i) => (
              <span key={i} className="ih-fact">
                <span className="ih-fact-label">{f.label}</span>
                <span className={"ih-fact-value" + (f.mono ? " ih-mono" : "")}>{f.value}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
