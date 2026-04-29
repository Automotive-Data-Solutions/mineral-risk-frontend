import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Top-level page wrapper that applies the platform page container: 24px padding,
 * 1280px max-width, 20px column gap. Drop this as the root element of every
 * dashboard list/detail page in place of the ad-hoc Tailwind container class.
 */
export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={cn("p-page", className)}>{children}</div>;
}
