export type ContentType = "Analysis" | "Signal" | "Report" | "News";

export type RiskLevel = "High" | "Med" | "Low";

export type TabLabel = "All" | ContentType;

export interface FeedPost {
  id: string;
  slug: string; // URL identifier — feed rows link to /intelligence/{slug}
  type: ContentType;
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

export interface MaterialRisk {
  name: string;
  level: RiskLevel;
  pct: number;
}

export interface PillarStat {
  name: string;
  count: number;
  color: string;
}
