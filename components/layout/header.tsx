"use client";

import { UserButton } from "@clerk/nextjs";
import { MobileSidebarMenu } from "@/components/layout/sidebar";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebarMenu />
        <div className="text-sm text-muted-foreground">
          Battery Supply Chain Risk Intelligence
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
      </div>
    </header>
  );
}
