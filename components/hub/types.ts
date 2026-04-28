export type ContentType = "Analysis" | "Signal" | "Report" | "News";

export type RiskLevel = "High" | "Med" | "Low";

export type TabLabel = "All" | ContentType;

export interface FeedPost {
  id: string;
  type: ContentType;
  materials: string[];
  geographies: string[];
  date: string;
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
  pages: number;
  title: string;
  lede: string;
  callouts: {
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
