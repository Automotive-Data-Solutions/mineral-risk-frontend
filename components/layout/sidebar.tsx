"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Download,
  FileText,
  FilePlus,
  FlaskConical,
  LayoutDashboard,
  Layers,
  Play,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { MraTile } from "@/components/platform/mra-tile";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

// Collect icon refs so ESLint no-unused-vars doesn't flag object-literal usage
const ICONS = {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Download,
  FileText,
  FilePlus,
  FlaskConical,
  LayoutDashboard,
  Layers,
  Play,
  Scale,
} as const;

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: ICONS.LayoutDashboard },
    ],
  },
  {
    label: "Supply Chain",
    items: [
      { href: "/companies",        label: "Companies",   icon: ICONS.Building2 },
      { href: "/data/materials",   label: "Materials",   icon: ICONS.Layers },
      { href: "/data/chemistries", label: "Chemistries", icon: ICONS.FlaskConical },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/data/regulations", label: "Regulations", icon: ICONS.Scale },
      // Other intelligence pages remain commented until they ship:
      // { href: "/data/market-scores", label: "Market Scores", icon: ICONS.BarChart3 },
      // { href: "/data/risk-events",   label: "Risk Events",   icon: ICONS.AlertTriangle },
    ],
  },
  // {
  //   label: "Reports",
  //   items: [
  //     { href: "/reports",     label: "All Reports",     icon: ICONS.FileText },
  //     { href: "/reports/new", label: "Generate Report", icon: ICONS.FilePlus },
  //   ],
  // },
  // {
  //   label: "Admin",
  //   items: [
  //     { href: "/admin/scoring",     label: "Run Scoring", icon: ICONS.Play },
  //     { href: "/admin/ingestion",   label: "Ingestion",   icon: ICONS.Download },
  //     { href: "/admin/seed-review", label: "Seed Review", icon: ICONS.ClipboardCheck },
  //   ],
  // },
];

const EXACT_MATCH_ROUTES = new Set(["/dashboard"]);

function isItemActive(pathname: string, href: string) {
  if (EXACT_MATCH_ROUTES.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="p-sidebar-brand">
        <MraTile />
      </div>

      <nav className="p-sidebar-nav">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={section.label ?? `section-${idx}`}>
            {section.label && (
              <div className="p-sidebar-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("p-sidebar-link", active && "active")}
                >
                  <Icon size={16} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-sidebar-footer">
        <div className="p-sidebar-user">
          <UserButton />
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="p-sidebar">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}
