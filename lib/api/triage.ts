/**
 * Triage API client — the write surface for the event triage queue.
 *
 * Mirrors app/api/routes/triage.py (backend) exactly; if a field is added
 * there, add it here. Types are local to this module: the triage surface is
 * consumed only by the triage page and drawer.
 */

import type { ApiClient } from "./client";

export type TriageStatus =
  | "pending_triage"
  | "scoring"
  | "display_only"
  | "rejected";

export type LinkStatus = "suggested" | "confirmed" | "rejected";

export interface TriageLink {
  id: number;
  material_id: number;
  label: string;
  status: LinkStatus;
  match_reason: string | null;
  relevance_score: number | null;
  is_direct: boolean;
}

export interface TriageEvent {
  id: number;
  title: string;
  summary: string | null;
  event_type: string | null;
  event_subtype: string | null;
  event_date: string | null;
  severity_score: number | null;
  confidence_score: number | null;
  triage_status: TriageStatus;
  suggested_category: string | null;
  primary_category: string | null;
  direction: "restrictive" | "supportive" | "neutral" | null;
  verified: boolean;
  triaged_by: string | null;
  triaged_at: string | null;
  source_system: string | null;
  source_url: string | null;
  geography_primary: string | null;
  suggested_subtype: string | null;
  quality_defects: string[];
  flags_count: number;
  links: TriageLink[];
}

export interface TriageEventList {
  items: TriageEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface TriageSummary {
  pending_triage: number;
  scoring: number;
  display_only: number;
  rejected: number;
  total: number;
}

export interface OperationalSubtype {
  value: string;
  label: string;
  default_severity: number;
}

export interface DuplicateHints {
  checked: boolean;
  reason: string | null;
  hints: Array<Record<string, unknown>>;
}

export interface TriageListParams {
  page?: number;
  limit?: number;
  status?: TriageStatus | "";
  search?: string;
  source?: string;
  pillar?: string;
  direction?: string;
  event_type?: string;
  severity_min?: number;
  material?: string;
  defect?: string;
  sort?: "event_date" | "severity_score" | "triage_status";
}

const BASE = "/api/v1/triage";

export async function getTriageSummary(client: ApiClient): Promise<TriageSummary> {
  const { data } = await client.get<TriageSummary>(`${BASE}/summary`);
  return data;
}

export async function getTriageEvents(
  client: ApiClient,
  params: TriageListParams = {},
): Promise<TriageEventList> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v != null),
  );
  const { data } = await client.get<TriageEventList>(`${BASE}/events`, {
    params: clean,
  });
  return data;
}

export async function getTriageEvent(
  client: ApiClient,
  id: number,
): Promise<TriageEvent> {
  const { data } = await client.get<TriageEvent>(`${BASE}/events/${id}`);
  return data;
}

export async function setTriageStatus(
  client: ApiClient,
  id: number,
  status: TriageStatus,
  primaryCategory?: string,
): Promise<TriageEvent> {
  const { data } = await client.patch<TriageEvent>(`${BASE}/events/${id}/status`, {
    status,
    primary_category: primaryCategory ?? null,
  });
  return data;
}

export async function setPrimaryCategory(
  client: ApiClient,
  id: number,
  primaryCategory: string,
): Promise<TriageEvent> {
  const { data } = await client.patch<TriageEvent>(`${BASE}/events/${id}/category`, {
    primary_category: primaryCategory,
  });
  return data;
}

export async function acceptSuggestions(
  client: ApiClient,
  id: number,
): Promise<TriageEvent> {
  const { data } = await client.post<TriageEvent>(`${BASE}/events/${id}/accept`);
  return data;
}

export async function promoteOperational(
  client: ApiClient,
  id: number,
  body: { subtype: string; severity?: number; note?: string; facility_name?: string },
): Promise<TriageEvent> {
  const { data } = await client.post<TriageEvent>(
    `${BASE}/events/${id}/promote-operational`,
    body,
  );
  return data;
}

export async function setLinkStatus(
  client: ApiClient,
  linkId: number,
  status: LinkStatus,
): Promise<TriageLink> {
  const { data } = await client.patch<TriageLink>(`${BASE}/links/${linkId}`, {
    status,
  });
  return data;
}

export async function addMaterialLink(
  client: ApiClient,
  eventId: number,
  materialId: number,
): Promise<TriageLink> {
  const { data } = await client.post<TriageLink>(`${BASE}/events/${eventId}/links`, {
    material_id: materialId,
  });
  return data;
}

export async function flagEvent(
  client: ApiClient,
  id: number,
  body: { note_type?: string; note_text: string },
): Promise<TriageEvent> {
  const { data } = await client.post<TriageEvent>(`${BASE}/events/${id}/flags`, body);
  return data;
}

export async function getDuplicateHints(
  client: ApiClient,
  id: number,
): Promise<DuplicateHints> {
  const { data } = await client.get<DuplicateHints>(
    `${BASE}/events/${id}/duplicate-hints`,
  );
  return data;
}

export async function getOperationalSubtypes(
  client: ApiClient,
): Promise<OperationalSubtype[]> {
  const { data } = await client.get<OperationalSubtype[]>(
    `${BASE}/operational-subtypes`,
  );
  return data;
}
