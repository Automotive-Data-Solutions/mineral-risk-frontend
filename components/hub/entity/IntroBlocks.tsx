/**
 * Multi-paragraph entity lede (2026-07-16). public_intro / regulation
 * summary cells store paragraphs separated by blank lines (the workbook
 * loader preserves newlines verbatim). First paragraph renders in the
 * large lede style; subsequent paragraphs step down to body prose.
 * Single-block text (no breaks) renders exactly as before.
 */

export function IntroBlocks({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  const paras = text
    .split(/\n\s*\n|\r\n\s*\r\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (!paras.length) return null;
  return (
    <div className="ih-entity-intro">
      {paras.map((p, i) => (
        <p key={i} className={i === 0 ? "ih-entity-lede" : "ih-entity-body"}>
          {p}
        </p>
      ))}
    </div>
  );
}
