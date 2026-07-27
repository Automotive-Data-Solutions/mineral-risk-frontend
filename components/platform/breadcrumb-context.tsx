"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type LabelMap = Record<string, string>;

interface BreadcrumbContextValue {
  labels: LabelMap;
  /** Segments claimed by a detail page but whose label hasn't resolved yet */
  pendingSegments: ReadonlySet<string>;
  setLabel: (segment: string, label: string) => void;
  clearLabel: (segment: string) => void;
  markPending: (segment: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  pendingSegments: new Set(),
  setLabel: () => {},
  clearLabel: () => {},
  markPending: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [labels, setLabels] = useState<LabelMap>({});
  const [pendingSegments, setPendingSegments] = useState<Set<string>>(new Set());

  const setLabel = useCallback((segment: string, label: string) => {
    setLabels((prev) => {
      if (prev[segment] === label) return prev;
      return { ...prev, [segment]: label };
    });
    // Remove from pending once the label has resolved
    setPendingSegments((prev) => {
      if (!prev.has(segment)) return prev;
      const next = new Set(prev);
      next.delete(segment);
      return next;
    });
  }, []);

  const clearLabel = useCallback((segment: string) => {
    setLabels((prev) => {
      if (!(segment in prev)) return prev;
      const next = { ...prev };
      delete next[segment];
      return next;
    });
    setPendingSegments((prev) => {
      if (!prev.has(segment)) return prev;
      const next = new Set(prev);
      next.delete(segment);
      return next;
    });
  }, []);

  const markPending = useCallback((segment: string) => {
    setPendingSegments((prev) => {
      if (prev.has(segment)) return prev;
      return new Set(prev).add(segment);
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, pendingSegments, setLabel, clearLabel, markPending }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

/**
 * Call from a detail page to register a human-readable label for a dynamic
 * URL segment (e.g. the numeric ID). Cleans up automatically on unmount.
 *
 * @param segment - the raw URL segment to override (e.g. "42")
 * @param label   - the display name (e.g. "Lithium") — undefined while loading
 */
export function useBreadcrumbLabel(segment: string, label: string | undefined) {
  const { setLabel, clearLabel, markPending } = useBreadcrumbContext();
  const prevSegment = useRef<string>(segment);

  // Mark as pending immediately on mount so the breadcrumb never shows the raw ID
  useEffect(() => {
    markPending(segment);
    return () => clearLabel(segment);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment]);

  // Once the label resolves, register it
  useEffect(() => {
    if (!label) return;
    if (prevSegment.current !== segment) {
      clearLabel(prevSegment.current);
      prevSegment.current = segment;
    }
    setLabel(segment, label);
  }, [segment, label, setLabel, clearLabel]);
}
