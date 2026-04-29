"use client";

import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs } from "@/components/platform/breadcrumbs";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <div className="p-topbar">
        {/* Hamburger — visible only below lg breakpoint */}
        <button
          className="p-topbar-hamburger"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
        >
          <Menu size={20} />
        </button>

        {/* Left: breadcrumb trail */}
        <Breadcrumbs />

        {/* Center: search */}
        <div className="p-topbar-search">
          <Search className="p-search-icon" aria-hidden />
          <input
            type="search"
            placeholder="Search materials, companies, regulations…"
            aria-label="Search"
          />
        </div>

        {/* Right: actions */}
        <div className="p-topbar-actions">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--p-text-muted)] transition-colors hover:bg-[color:var(--p-bg-muted)] hover:text-[color:var(--p-text)]"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>
          <span className="p-kbd">⌘K</span>
        </div>
      </div>

      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
