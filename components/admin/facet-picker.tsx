"use client";

/**
 * Facet picker (admin content v1, 2026-07-22) — a pick-ONLY autocomplete
 * for closed-set metadata (materials, geographies). Unlike the entity
 * TagPicker it does NOT allow free-text: the whole point is that the
 * stored value (canonical_name / ISO2) matches the column exactly, so
 * ?material=/?geography= filters and future profile pages resolve. Values
 * that aren\u2019t real rows can\u2019t be added.
 *
 * Chips display the stored value (canonical_name reads fine; ISO2 is terse
 * but matches how geographies render everywhere else on the hub).
 */

import * as React from "react";
import { X } from "lucide-react";
import { useApiClient } from "@/lib/hooks/use-api-client";
import type { ApiClient } from "@/lib/api/client";
import type { FacetSuggestion } from "@/lib/api/insights";

export function FacetPicker({
  value,
  onChange,
  fetcher,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  fetcher: (client: ApiClient, q: string) => Promise<FacetSuggestion[]>;
  placeholder: string;
}) {
  const client = useApiClient();
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<FacetSuggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = input.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(() => {
      fetcher(client, q)
        .then((s) => {
          setSuggestions(s);
          setOpen(s.length > 0);
        })
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  React.useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function add(v: string) {
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setInput("");
    setOpen(false);
  }

  function remove(v: string) {
    onChange(value.filter((t) => t !== v));
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="mt-1 flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1.5">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-foreground/40 bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {v}
            <button
              type="button"
              onClick={() => remove(v)}
              className="ml-0.5 opacity-60 hover:opacity-100"
              aria-label={`Remove ${v}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !input && value.length) {
              remove(value[value.length - 1]!);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Enter" && suggestions.length) {
              // Enter picks the top suggestion — never commits raw text.
              e.preventDefault();
              add(suggestions[0]!.value);
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-32 flex-1 bg-transparent text-sm text-foreground outline-none"
        />
      </div>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-background shadow-md">
          {suggestions.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => add(s.value)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted"
            >
              <span className="font-medium">{s.label}</span>
              {s.hint ? (
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
