import type { ReactNode } from "react";

export function Section({
  title,
  aside,
  note,
  children,
}: {
  title: string;
  aside?: string | null;
  /** One-line muted caption under the header — used on the company
   *  profile (2026-07-21) to state each score set's basis (global
   *  material risk vs at-location risk) so the two lists can't be
   *  cross-read as contradictory. */
  note?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="ih-section">
      <div className="ih-section-head">
        <h2 className="ih-section-title">{title}</h2>
        {aside ? <span className="ih-section-aside">{aside}</span> : null}
      </div>
      {note ? <p className="ih-section-note">{note}</p> : null}
      {children}
    </section>
  );
}
