export function ScopeChips({
  label,
  items,
  kind,
}: {
  label: string;
  items: string[];
  kind: "mat" | "geo";
}) {
  if (!items.length) return null;
  return (
    <div className="ih-scope-group">
      <div className="ih-scope-label">{label}</div>
      <div className="ih-scope-items">
        {items.map((it) => (
          <span key={it} className={"ih-tag " + (kind === "geo" ? "ih-tag-geo" : "ih-tag-mat")}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
