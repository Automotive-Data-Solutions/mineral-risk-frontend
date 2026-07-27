"use client";

/**
 * Admin route-group gate. Friendly page for non-admins who navigate to an
 * /admin URL directly (the sidebar already hides the group for them).
 * Cosmetic only — the API enforces require_admin server-side (once the
 * LAUNCH_TODO re-enables it; see lib/auth/admin-role.ts).
 */

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useIsAdmin } from "@/lib/auth/admin-role";

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin();
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card className="p-6">
          <h1 className="mb-2 text-lg font-semibold">Admin area</h1>
          <p className="text-sm text-muted-foreground">
            This section is limited to admin users. If you should have
            access, ask an admin to set your role.
          </p>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}
