"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createApiClient, type ApiClient } from "@/lib/api/client";

/**
 * Returns a memoized Axios instance wired to the current Clerk session. The
 * instance is stable across renders so React Query's internal reference
 * equality checks don't re-fire queries on every render.
 */
export function useApiClient(): ApiClient {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient(async () => getToken()), [getToken]);
}
