import type { ReactNode } from "react";

export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string | null;
  children: ReactNode;
}) {
  return (
    <section className="ih-section">
      <div className="ih-section-head">
        <h2 className="ih-section-title">{title}</h2>
        {aside ? <span className="ih-section-aside">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}
