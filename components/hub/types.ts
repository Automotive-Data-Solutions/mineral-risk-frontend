export type ContentType = "Analysis" | "Signal" | "Report" | "News";

/** Band level tokens — mirror RiskBandOut.level from the public API
 *  (crit added 2026-07-21 with the 4-tier band recalibration). */
export type RiskLevel = "crit" | "high" | "med" | "low";

export type TabLabel = "All" | ContentType;

export interface FeedPost {
  id: string;
  slug: string; // URL identifier — feed rows link to /intelligence/{slug}
  type: ContentType;
  /** Editorial risk severity tag set by the author (NOT an engine score). */
  riskBand?: "low" | "med" | "high" | "crit";
  materials: string[];
  geographies: string[];
  tags?: string[];
  pillar?: string; // display label, e.g. "Regulatory Compliance"
  date: string;
  pinned?: boolean; // editorial top-of-feed placement
  read?: number;   // minutes
  pages?: number;  // for Report type
  title: string;
  preview?: string;
}

export interface FeaturedPost {
  type: ContentType;
  materials: string[];
  geographies: string[];
  date: string;
  pages?: number;
  title: string;
  lede: string;
  callouts?: {
    value: string;
    label: string;
    variant: "high" | "med" | "neutral";
  }[];
  ctaLabel?: string;
  ctaHref?: string;
}


export interface PillarStat {
  name: string;
  count: number;
  color: string;
}
