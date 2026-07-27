import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <nav className="ih-crumb" aria-label="Breadcrumb">
      {trail.map((c, i) => (
        <span key={i} className="ih-crumb-item">
          {i > 0 ? <span className="ih-crumb-sep">/</span> : null}
          {c.href ? (
            <Link href={c.href}>{c.label}</Link>
          ) : (
            <span className="ih-crumb-current">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
