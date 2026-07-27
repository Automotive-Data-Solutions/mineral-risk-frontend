"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarContent } from "@/components/layout/sidebar";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`p-mobile-nav-backdrop${open ? " open" : ""}`}
        aria-hidden
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`p-mobile-nav-drawer${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button
          className="p-mobile-nav-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>

        <SidebarContent pathname={pathname} />
      </div>
    </>
  );
}
