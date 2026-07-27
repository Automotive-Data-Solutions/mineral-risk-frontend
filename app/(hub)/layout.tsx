import type { Metadata } from "next";
import { Source_Serif_4 } from "next/font/google";
import "./hub.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mineral Risk Analytics — Supply Chain Intelligence",
  description:
    "Regulatory and supply chain risk analysis for critical battery minerals. " +
    "Lithium, cobalt, graphite, nickel — concentration risk, geopolitical trade, " +
    "and compliance signals tracked by our scoring engine.",
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`ih-root ${sourceSerif.variable}`}>
      {children}
    </div>
  );
}
