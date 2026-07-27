"use client";

/**
 * Tag picker (admin content v1, 2026-07-22). Tags drive linked_posts on
 * public company/regulation pages by EXACT match on canonical_name /
 * regulation_key — free-text entry silently breaks those links, which is
 * the whole reason this component exists. Behavior:
 *   - typing ≥2 chars shows entity suggestions (companies + regulations);
 *     picking one adds the exact linking string as a chip
 *   - Enter (or comma) adds whatever is typed as a plain topic tag
 *   - existing tags are classified server-side on load, so entity chips
 *     render distinctly (icon + solid border) from topic chips
 *   - Backspace in an empty input removes the last chip
 */

import * as React from "react";
import { Building2, Scale, X } from "lucide-react";
import { useApiClient } from "@/lib/hooks/use-api-client";
import {
  classifyTags,
  suggestTags,
  type TagSuggestion,
} from "@/lib/api/insights";

type Kind = "company" | "regulation" | null;

export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const client = useApiClient();
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<TagSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [kinds, setKinds] = React.useState<Record<string, Kind>>({});
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Classify tags whose kind we don't know yet (initial load + external edits).
  React.useEffect(() => {
    const unknown = value.filter((t) => !(t in kinds));
    if (!unknown.length) return;
    let cancelled = false;
    classifyTags(client, unknown)
      .then((c) => {
        if (!cancelled) setKinds((k) => ({ ...k, ...c }));
      })
      .catch(() => {
        /* classification is cosmetic — chips just render as topic tags */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced suggestions.
  React.useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      suggestTags(client, q)
        .then((s) => {
          setSuggestions(s);
          setOpen(s.length > 0);
        })
        .catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  // Close dropdown on outside click.
  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function add(tag: string, kind: Kind = null) {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    if (kind !== null) setKinds((k) => ({ ...k, [t]: kind }));
    onChange([...value, t]);
    setInput("");
    setOpen(false);
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="mt-1 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
        {value.map((t) => {
          const kind = kinds[t] ?? null;
          return (
            <span
              key={t}
              className={
                kind
                  ? "inline-flex items-center gap-1 rounded-full border border-foreground/40 bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                  : "inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground"
              }
              title={
                kind === "company"
                  ? "Links to the public company page"
                  : kind === "regulation"
                    ? "Links to the public regulation page"
                    : "Topic tag (does not link to an entity page)"
              }
            >
              {kind === "company" ? <Building2 size={11} aria-hidden /> : null}
              {kind === "regulation" ? <Scale size={11} aria-hidden /> : null}
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="ml-0.5 opacity-60 hover:opacity-100"
                aria-label={`Remove tag ${t}`}
              >
                <X size={11} />
              </button>
            </span>
          );
        })}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && value.length) {
              remove(value[value.length - 1]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={value.length ? "" : "Type to search entities, Enter for topic tag"}
          className="min-w-32 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
      </div>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-md">
          {suggestions.map((s) => (
            <button
              key={`${s.kind}-${s.label}`}
              type="button"
              onClick={() => add(s.label, s.kind)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              {s.kind === "company" ? (
                <Building2 size={13} className="shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <Scale size={13} className="shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="font-medium">{s.label}</span>
              {s.hint ? (
                <span className="truncate text-xs text-muted-foreground">{s.hint}</span>
              ) : null}
            </button>
          ))}
          {input.trim() ? (
            <button
              type="button"
              onClick={() => add(input)}
              className="w-full border-t px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
            >
              Add “{input.trim()}” as a topic tag
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
