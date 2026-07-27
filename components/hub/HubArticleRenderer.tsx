"use client";

/**
 * HubArticleRenderer — Wine + Stone body renderer for the public article page.
 *
 * Parallel to components/insights/ArticleRenderer.tsx, which powers the admin
 * editor's preview + is styled with Cool Slate / shadcn tokens. Keeping a
 * separate hub renderer avoids theme bleed (never mix Stack 1 and Stack 2 —
 * project_intelligence_hub memory).
 *
 * Same input contract:
 *   - Markdown subset emitted by scripts/ingest_insight_docx.py
 *   - Fenced ```chart blocks materialized via ChartBlock
 * Same output shape (headings/lists/blockquote/hr/img/link/bold/italic)
 * but emits ih-article-* classes styled in app/(hub)/hub.css.
 */

import * as React from "react";
import { ChartBlock, type ChartSpec } from "@/components/insights/ChartBlock";

// ---------------------------------------------------------------- segments

type Segment =
  | { kind: "markdown"; text: string }
  | { kind: "chart"; spec: ChartSpec };

const CHART_FENCE = /^```chart\s*\n([\s\S]*?)\n```\s*$/m;

export function splitBody(body: string): Segment[] {
  const segments: Segment[] = [];
  let rest = body;
  for (;;) {
    const m = CHART_FENCE.exec(rest);
    if (!m) break;
    const before = rest.slice(0, m.index).trim();
    if (before) segments.push({ kind: "markdown", text: before });
    let spec: ChartSpec;
    try {
      spec = JSON.parse(m[1] ?? "") as ChartSpec;
    } catch {
      spec = { type: "unconfigured", name: "invalid-spec" };
    }
    segments.push({ kind: "chart", spec });
    rest = rest.slice(m.index + m[0].length);
  }
  const tail = rest.trim();
  if (tail) segments.push({ kind: "markdown", text: tail });
  return segments;
}

// ------------------------------------------------------------ inline marks

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[2] !== undefined) {
      /* eslint-disable-next-line @next/next/no-img-element */
      out.push(
        <img key={k} src={m[2]} alt={m[1] ?? ""} className="ih-article-img" />,
      );
    } else if (m[4] !== undefined) {
      const href = m[4];
      out.push(
        <a
          key={k}
          href={href}
          className="ih-article-link"
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {m[3]}
        </a>,
      );
    } else if (m[5] !== undefined) {
      out.push(<strong key={k}>{m[5]}</strong>);
    } else if (m[6] !== undefined) {
      out.push(<em key={k}>{m[6]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ----------------------------------------------------------- block parsing

function renderMarkdownSegment(text: string, keyBase: string): React.ReactNode {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((raw, bi) => {
    const block = raw.trim();
    const key = `${keyBase}-b${bi}`;
    if (!block) return null;

    const h = /^(#{1,4})\s+(.*)$/.exec(block);
    if (h) {
      const level = (h[1] ?? "#").length;
      const cls = `ih-article-h${level}`;
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return (
        <Tag key={key} className={cls}>
          {renderInline(h[2] ?? "", key)}
        </Tag>
      );
    }

    if (/^(-{3,}|\*{3,})$/.test(block))
      return <hr key={key} className="ih-article-hr" />;

    if (block.startsWith(">")) {
      const inner = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ");
      return (
        <blockquote key={key} className="ih-article-quote">
          {renderInline(inner, key)}
        </blockquote>
      );
    }

    if (/^[-*]\s+/m.test(block)) {
      const items = block
        .split("\n")
        .filter((l) => /^[-*]\s+/.test(l))
        .map((l) => l.replace(/^[-*]\s+/, ""));
      return (
        <ul key={key} className="ih-article-ul">
          {items.map((it, ii) => (
            <li key={`${key}-i${ii}`}>{renderInline(it, `${key}-i${ii}`)}</li>
          ))}
        </ul>
      );
    }

    if (/^\d+\.\s+/m.test(block)) {
      const items = block
        .split("\n")
        .filter((l) => /^\d+\.\s+/.test(l))
        .map((l) => l.replace(/^\d+\.\s+/, ""));
      return (
        <ol key={key} className="ih-article-ol">
          {items.map((it, ii) => (
            <li key={`${key}-i${ii}`}>{renderInline(it, `${key}-i${ii}`)}</li>
          ))}
        </ol>
      );
    }

    // image-only paragraph renders bare
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(block)) {
      return <React.Fragment key={key}>{renderInline(block, key)}</React.Fragment>;
    }

    return (
      <p key={key} className="ih-article-p">
        {renderInline(block.replace(/\n/g, " "), key)}
      </p>
    );
  });
}

// ----------------------------------------------------------------- article

export function HubArticleRenderer({ body }: { body: string }) {
  const segments = React.useMemo(() => splitBody(body), [body]);
  return (
    <div className="ih-article-body">
      {segments.map((seg, i) =>
        seg.kind === "chart" ? (
          <ChartBlock key={`c${i}`} spec={seg.spec} />
        ) : (
          <React.Fragment key={`m${i}`}>
            {renderMarkdownSegment(seg.text, `m${i}`)}
          </React.Fragment>
        ),
      )}
    </div>
  );
}

export default HubArticleRenderer;
