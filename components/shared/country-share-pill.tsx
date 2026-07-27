"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { countryCodeToName, countryToFlag } from "@/lib/utils/format";

interface CountrySharePillProps {
  code: string | null | undefined;
  /** Integer percentage, e.g. 47. Omit to render without the share label. */
  sharePct?: number | null;
}

/**
 * Grey pill showing a country flag, ISO-2 code, and optional production-share
 * percentage. Tooltip always shows the full country name on hover.
 *
 * Used as the single pill component wherever a country needs to be displayed
 * in pill form — materials list top sources, material detail overview,
 * dashboard KPI card, and the market scores geography column.
 */
export function CountrySharePill({ code, sharePct }: CountrySharePillProps) {
  if (!code) return null;

  const flag = countryToFlag(code);
  const countryName = countryCodeToName(code);

  const pill = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 6px",
        background: "var(--p-bg-subtle)",
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-radius-sm)",
        fontSize: 11,
        whiteSpace: "nowrap",
        lineHeight: 1,
        cursor: "default",
      }}
    >
      {flag && <span aria-hidden>{flag}</span>}
      <span style={{ fontFamily: "var(--p-font-mono)", fontWeight: 500, color: "var(--p-text)" }}>
        {code.toUpperCase()}
      </span>
      {sharePct != null && (
        <>
          <span style={{ color: "var(--p-text-faint)", fontSize: 10 }}>·</span>
          <span style={{ fontWeight: 600, color: "var(--p-text)" }}>{sharePct}%</span>
        </>
      )}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{pill}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{countryName}</TooltipContent>
    </Tooltip>
  );
}
