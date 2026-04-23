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

/**
 * Coerce API values (number or numeric string) to a 0..100 display percent.
 * Accepts either a 0..1 score or an already-scaled 0..100 value.
 */
export function normalizeConfidencePercent(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return null;
  return n <= 1 ? n * 100 : n;
}

/** Confidence scores in our data range 0..1 (or 0..100). Display as 0..100%. */
export function formatConfidence(
  value: number | string | null | undefined,
): string {
  const pct = normalizeConfidencePercent(value);
  if (pct == null) return "—";
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

/** Converts ISO-3166 alpha-2 country code to a display name (e.g. "US" -> "United States"). */
export function countryCodeToName(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "Unknown country";
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    return displayNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
