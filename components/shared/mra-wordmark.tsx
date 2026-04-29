"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface MraWordmarkProps {
  className?: string;
  logoClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showSubtitle?: boolean;
  subtitle?: string;
}

export function MraWordmark({
  className,
  logoClassName,
  titleClassName,
  subtitleClassName,
  showSubtitle = true,
  subtitle = "Supply Chain Intelligence",
}: MraWordmarkProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/hub/logo-mra-outline.svg"
        alt="Mineral Risk Analytics"
        width={28}
        height={30}
        className={cn("h-7 w-auto shrink-0", logoClassName)}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className={cn("truncate text-sm font-semibold", titleClassName)}>
          Mineral Risk Analytics
        </span>
        {showSubtitle ? (
          <span className={cn("truncate text-[10px]", subtitleClassName)}>
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
