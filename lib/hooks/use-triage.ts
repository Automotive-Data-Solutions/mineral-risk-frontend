"use client";

/**
 * Data hooks for the triage queue.
 *
 * The triage surface is a write-heavy work queue: every mutation is followed
 * by an explicit refetch of the list and the summary, so these hooks expose
 * `refetch` prominently and keep previous data visible while re-fetching
 * (no skeleton flash between a decision and its confirmed result).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient, type ApiClient } from "@/lib/api/client";
import {
  getTriageEvents,
  getTriageSummary,
  type TriageEventList,
  type TriageListParams,
  type TriageSummary,
} from "@/lib/api/triage";

/** Authenticated API client for triage calls (Clerk token attached per request). */
export function useTriageApi(): ApiClient {
  const { getToken } = useAuth();
  return useMemo(() => createApiClient(getToken), [getToken]);
}

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
}

export function useTriageSummary(): AsyncState<TriageSummary> & {
  refetch: () => Promise<void>;
} {
  const client = useTriageApi();
  const [state, setState] = useState<AsyncState<TriageSummary>>({
    data: null,
    isLoading: true,
    isFetching: true,
    error: null,
  });
  const requestSeq = useRef(0);

  const refetch = useCallback(async () => {
    const seq = ++requestSeq.current;
    setState((s) => ({ ...s, isFetching: true, isLoading: s.data == null }));
    try {
      const data = await getTriageSummary(client);
      if (seq !== requestSeq.current) return;
      setState({ data, isLoading: false, isFetching: false, error: null });
    } catch (error) {
      if (seq !== requestSeq.current) return;
      setState((s) => ({ ...s, isLoading: false, isFetching: false, error }));
    }
  }, [client]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { ...state, refetch };
}

export function useTriageEvents(params: TriageListParams): AsyncState<TriageEventList> & {
  refetch: () => Promise<void>;
} {
  const client = useTriageApi();
  const [state, setState] = useState<AsyncState<TriageEventList>>({
    data: null,
    isLoading: true,
    isFetching: true,
    error: null,
  });
  const requestSeq = useRef(0);

  // Track the latest params in a ref so `refetch` stays identity-stable
  // across filter changes and always fetches the current filter set.
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const paramsKey = JSON.stringify(params);

  const refetch = useCallback(async () => {
    const seq = ++requestSeq.current;
    setState((s) => ({ ...s, isFetching: true, isLoading: s.data == null }));
    try {
      const data = await getTriageEvents(client, paramsRef.current);
      if (seq !== requestSeq.current) return;
      setState({ data, isLoading: false, isFetching: false, error: null });
    } catch (error) {
      if (seq !== requestSeq.current) return;
      setState((s) => ({ ...s, isLoading: false, isFetching: false, error }));
    }
  }, [client]);

  useEffect(() => {
    void refetch();
    // paramsKey is the serialized filter set; refetch is stable.
  }, [refetch, paramsKey]);

  return { ...state, refetch };
}
