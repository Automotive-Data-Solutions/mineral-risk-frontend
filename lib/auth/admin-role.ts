"use client";

/**
 * Admin role check — single "admin" role model (decided 2026-07-21:
 * Nicole + partner both full access; no analyst tier).
 *
 * LAUNCH_TODO (mirrors app/api/deps.py require_admin, disabled 2026-07-19):
 * enforcement is OFF so the only pre-launch account isn't locked out of
 * /admin before Clerk roles are assigned. Before launch:
 *   1. Set public_metadata.role = "admin" on both Clerk users.
 *   2. Flip ADMIN_ROLE_ENFORCEMENT to true (this file).
 *   3. Remove the early-return in require_admin (backend) — and narrow its
 *      accepted set to the "admin" role per PLAN_admin_content_section.md §3.
 * Client-side checks are cosmetic (hide nav / friendly gate page); the API
 * is the real boundary.
 */
export const ADMIN_ROLE_ENFORCEMENT = false;

import { useUser } from "@clerk/nextjs";

export function useIsAdmin(): boolean {
  const { user, isLoaded } = useUser();
  if (!ADMIN_ROLE_ENFORCEMENT) return true;
  if (!isLoaded || !user) return false;
  const role = String(user.publicMetadata?.role ?? "").toLowerCase();
  if (role === "admin") return true;
  // Clerk org admins/owners count as admin too (matches backend).
  return user.organizationMemberships.some((m) => {
    const r = m.role.toLowerCase();
    return r === "org:admin" || r === "admin" || r === "org:owner" || r === "owner";
  });
}
