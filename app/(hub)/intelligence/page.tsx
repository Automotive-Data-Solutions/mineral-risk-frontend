"use client";

import { useState } from "react";
import { Nav }            from "@/components/hub/Nav";
import { FeaturedReport } from "@/components/hub/FeaturedReport";
import { FeedRow }        from "@/components/hub/FeedRow";
import { Sidebar }        from "@/components/hub/Sidebar";
import { TypeLegend }     from "@/components/hub/TypeLegend";
import { Footer }         from "@/components/hub/Footer";
import type { TabLabel, FeedPost, FeaturedPost } from "@/components/hub/types";

// ─── Mock data ────────────────────────────────────────────────
const FEATURED: FeaturedPost = {
  type: "Report",
  materials: ["Graphite"],
  geographies: ["CN"],
  date: "Apr 2026",
  pages: 18,
  title:
    "China graphite export licensing — supply chain exposure report Q1 2026",
  lede:
    "The April 17 revision to the FEOC interim guidance narrows the qualifying " +
    "processing-step definition for graphite. Three pathways remain compliant " +
    "under the revised rule; this report walks through each with examples drawn " +
    "from announced 2025–2027 cathode programs.",
  callouts: [
    { value: "High",  label: "concentration risk", variant: "high" },
    { value: "73%",   label: "processed in CN",    variant: "med"  },
    { value: "18 pp", label: "FEOC-eligible",       variant: "neutral" },
  ],
  ctaLabel: "Download PDF →",
  ctaHref: "#",
};

const FEED: FeedPost[] = [
  {
    id: "1",
    type: "Analysis",
    materials: ["Lithium"],
    geographies: ["CL", "AR"],
    date: "Apr 24, 2026",
    read: 8,
    title:
      "Lithium triangle permitting timelines — what 2026 DGA data actually shows",
    preview:
      "Chilean and Argentine lithium brine approvals are running 30–40% longer " +
      "than published guidance. We map the real timelines against project " +
      "announcements and flag which OEM supply deals are most exposed.",
  },
  {
    id: "2",
    type: "Signal",
    materials: ["Cobalt"],
    geographies: ["CD"],
    date: "Apr 22, 2026",
    read: 2,
    title:
      "DRC artisanal mining crackdown: Kolwezi zone suspension extended 60 days",
    preview:
      "The Congolese government has extended its Kolwezi artisanal and small-scale " +
      "mining suspension. Roughly 8% of global cobalt flows through affected zones.",
  },
  {
    id: "3",
    type: "Analysis",
    materials: ["Nickel"],
    geographies: ["ID"],
    date: "Apr 18, 2026",
    read: 7,
    title:
      "Indonesia nickel HPAL expansion — capacity vs. battery-grade yield gap",
    preview:
      "Six announced HPAL projects in Sulawesi and Maluku are tracking well on " +
      "nameplate capacity but reporting battery-grade MHP yields 15–20% below " +
      "design targets. Implications for NMC cathode supply 2027–2029.",
  },
  {
    id: "4",
    type: "Signal",
    materials: ["Graphite"],
    geographies: ["CN"],
    date: "Apr 15, 2026",
    title:
      "MOFCOM issues supplemental guidance on graphite export permit applications",
  },
  {
    id: "5",
    type: "Report",
    materials: ["Lithium", "Cobalt", "Nickel"],
    geographies: ["CN", "CD", "CL"],
    date: "Apr 10, 2026",
    pages: 24,
    title:
      "Q1 2026 Critical Minerals Regulatory Tracker — IRA, CRMA, FEOC update",
    preview:
      "Quarterly synthesis of regulatory developments across the IRA FEOC rules, " +
      "EU CRMA implementation schedule, and Chinese export control activity.",
  },
  {
    id: "6",
    type: "News",
    materials: ["Lithium"],
    geographies: ["AU"],
    date: "Apr 8, 2026",
    read: 3,
    title:
      "Pilbara Minerals flags Q2 spodumene production revision — context on what it means",
    preview:
      "Pilbara's downward guidance revision reflects hard rock grade variability " +
      "rather than structural demand weakness. How this fits the broader " +
      "Australian lithium supply picture.",
  },
  {
    id: "7",
    type: "Analysis",
    materials: ["Manganese"],
    geographies: ["ZA", "AU"],
    date: "Apr 3, 2026",
    read: 6,
    title:
      "Battery-grade manganese: the supply gap that IRA Section 45X quietly created",
    preview:
      "The 45X advanced manufacturing credit requires US-produced battery " +
      "components, but battery-grade HPMSM remains almost entirely sourced " +
      "outside the country. We size the gap and track the qualification pipeline.",
  },
  {
    id: "8",
    type: "Signal",
    materials: ["Cobalt"],
    geographies: ["CD"],
    date: "Mar 28, 2026",
    title:
      "Glencore Mutanda restart confirmed — 25 ktpa cobalt capacity re-entering market",
  },
];

// ─── Page ─────────────────────────────────────────────────────
export default function IntelligencePage() {
  const [activeTab, setActiveTab] = useState<TabLabel>("All");

  const visibleFeed =
    activeTab === "All"
      ? FEED
      : FEED.filter((p) => p.type === activeTab);

  return (
    <>
      <Nav activeTab={activeTab} onTab={setActiveTab} />

      <main className="ih-main">
        <div className="ih-content">
          <TypeLegend />

          <div className="ih-body">
            {/* Main feed column */}
            <div className="ih-feed-col">
              {(activeTab === "All" || activeTab === "Report") && (
                <FeaturedReport post={FEATURED} />
              )}

              {visibleFeed
                .filter((p) => !(activeTab === "All" && p.type === "Report" && p.id === FEED.find(r => r.type === "Report")?.id))
                .map((row) => (
                  <FeedRow key={row.id} row={row} />
                ))}

              {visibleFeed.length === 0 && (
                <p style={{ color: "#9e7b72", padding: "2rem 0", fontSize: "0.9rem" }}>
                  No {activeTab} posts yet — check back soon.
                </p>
              )}
            </div>

            {/* Sidebar */}
            <Sidebar />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
