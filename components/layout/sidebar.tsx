"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  // AlertTriangle,
  // BarChart3,
  Building2,
  // Factory,
  FlaskConical,
  Layers,
  LayoutDashboard,
  Menu,
  // Scale,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SideSheet, SideSheetContent } from "@/components/ui/side-sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

// Phases 1 + 2 nav. Scoring, Reports, and Admin still come later.
const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Supply Chain",
    items: [
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/data/materials", label: "Materials", icon: Layers },
      // { href: "/data/facilities", label: "Facilities", icon: Factory },
      { href: "/data/chemistries", label: "Chemistries", icon: FlaskConical },
      // { href: "/data/market-scores", label: "Market Scores", icon: BarChart3 },
    ],
  },
  // {
  //   label: "Intelligence",
  //   items: [
  //     {
  //       href: "/data/risk-events",
  //       label: "Risk Events",
  //       icon: AlertTriangle,
  //     },
  //     { href: "/data/regulations", label: "Regulations", icon: Scale },
  //   ],
  // },
];

// Routes whose "active" state should require an exact pathname match instead
// of a prefix match (otherwise `/dashboard` would also light up on every
// nested admin/dashboard sub-route).
const EXACT_MATCH_ROUTES = new Set(["/dashboard"]);

function isItemActive(pathname: string, href: string) {
  if (EXACT_MATCH_ROUTES.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Battery Risk</span>
          <span className="text-[10px] text-muted-foreground">
            Intelligence Engine
          </span>
        </div>
      </div>
      <nav className="flex flex-col gap-3 p-2">
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div
            key={section.label ?? `section-${sectionIdx}`}
            className="flex flex-col gap-0.5"
          >
            {section.label && (
              <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background lg:block">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

export function MobileSidebarMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SideSheet open={open} onOpenChange={setOpen}>
        <SideSheetContent className="w-[85vw] max-w-[320px] p-0 sm:max-w-[320px]">
          <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
        </SideSheetContent>
      </SideSheet>
    </>
  );
}
