import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Confidence scores in our data range 0..1. Display as a 0..100% value. */
export function formatConfidence(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(0)}%`;
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy p");
}

export function formatRelative(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? parseISO(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * ``"cell_maker"`` → ``"Cell Maker"``. Falls back to ``"—"`` for nullish
 * strings; preserves already Title-Cased input.
 */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Converts ISO-3166 alpha-2 country codes to a flag emoji. */
export function countryToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const a = code[0];
  const b = code[1];
  if (!a || !b) return "";
  const cp = (c: string) => 127397 + c.toUpperCase().charCodeAt(0);
  return String.fromCodePoint(cp(a), cp(b));
}
