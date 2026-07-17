/**
 * Single source of truth for the five scoring pillars' display labels and
 * colours on the hub. Extracted 2026-07-08 from the Sidebar mock so feed
 * chips, sidebar buttons, and future pillar UI can never drift apart.
 *
 * Keys are the backend enum values (insight_posts.pillar / scoring engine).
 */

export interface PillarInfo {
  label: string;
  color: string;
}

export const PILLARS = {
  material_concentration: { label: "Material Concentration", color: "#7A4A8E" },
  geopolitical_trade:     { label: "Geopolitical Trade",     color: "#1F6B8A" },
  regulatory_compliance:  { label: "Regulatory Compliance",  color: "#C8623A" },
  operational:            { label: "Operational",            color: "#6B5B3A" },
  financial_pressure:     { label: "Financial Pressure",     color: "#3B6E55" },
} as const satisfies Record<string, PillarInfo>;

export type PillarKey = keyof typeof PILLARS;

/** Look up by either enum key or display label (feed rows carry labels). */
export function pillarInfo(value: string): PillarInfo | undefined {
  if (value in PILLARS) return PILLARS[value as PillarKey];
  return Object.values(PILLARS).find((p) => p.label === value);
}
