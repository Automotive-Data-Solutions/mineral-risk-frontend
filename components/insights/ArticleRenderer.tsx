/**
 * ArticleRenderer — renders an insight_posts.body (Markdown produced by the
 * engine's docx ingestion) as the public article surface, mapping fenced
 * ```chart blocks to <ChartBlock/> (see ChartBlock.tsx for the spec).
 *
 * Used by BOTH the public article page and the admin editor's live preview
 * (one renderer, no drift — decided 2026-07-08).
 *
 * The Markdown subset here covers everything the docx pipeline emits:
 * ATX headings, paragraphs, bold/italic, links, images, - lists, ordered
 * lists, blockquotes, hr. It is deliberately dependency-free; swapping in
 * react-markdown later only requires replacing renderMarkdownSegment().
 */

import * as React from "react";
import { ChartBlock, type ChartSpec } from "./ChartBlock";

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
  // images, links, bold, italic — processed via a single tokenizing regex
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
      // image
      // eslint-disable-next-line @next/next/no-img-element
      out.push(
        <img
          key={k}
          src={m[2]}
          alt={m[1] ?? ""}
          className="my-6 w-full rounded-lg border"
        />
      );
    } else if (m[4] !== undefined) {
      out.push(
        <a
          key={k}
          href={m[4]}
          className="underline underline-offset-2 hover:text-primary"
          target={m[4].startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          {m[3]}
        </a>
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
      const cls = [
        "",
        "mt-10 mb-4 text-3xl font-bold tracking-tight",
        "mt-8 mb-3 text-2xl font-semibold",
        "mt-6 mb-2 text-xl font-semibold",
        "mt-4 mb-2 text-lg font-semibold",
      ][level];
      const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
      return (
        <Tag key={key} className={cls}>
          {renderInline(h[2] ?? "", key)}
        </Tag>
      );
    }

    if (/^(-{3,}|\*{3,})$/.test(block))
      return <hr key={key} className="my-8" />;

    if (block.startsWith(">")) {
      const inner = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ");
      return (
        <blockquote
          key={key}
          className="my-6 border-l-4 border-primary/40 pl-4 italic text-muted-foreground"
        >
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
        <ul key={key} className="my-4 list-disc space-y-1.5 pl-6">
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
        <ol key={key} className="my-4 list-decimal space-y-1.5 pl-6">
          {items.map((it, ii) => (
            <li key={`${key}-i${ii}`}>{renderInline(it, `${key}-i${ii}`)}</li>
          ))}
        </ol>
      );
    }

    // image-only paragraph renders bare (no <p> wrapper for valid HTML)
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(block)) {
      return <React.Fragment key={key}>{renderInline(block, key)}</React.Fragment>;
    }

    return (
      <p key={key} className="my-4 leading-7">
        {renderInline(block.replace(/\n/g, " "), key)}
      </p>
    );
  });
}

// ----------------------------------------------------------------- article

export function ArticleRenderer({ body }: { body: string }) {
  const segments = React.useMemo(() => splitBody(body), [body]);
  return (
    <div className="mx-auto max-w-3xl text-base text-foreground">
      {segments.map((seg, i) =>
        seg.kind === "chart" ? (
          <ChartBlock key={`c${i}`} spec={seg.spec} />
        ) : (
          <React.Fragment key={`m${i}`}>
            {renderMarkdownSegment(seg.text, `m${i}`)}
          </React.Fragment>
        )
      )}
    </div>
  );
}

export default ArticleRenderer;
