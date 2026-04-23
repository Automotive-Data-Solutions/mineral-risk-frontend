/**
 * Event review/triage API helpers.
 *
 * The review workflow lives on the risk_event_companies junction row, not on
 * the global risk_event, so each action targets a specific company + link pair.
 */

import type { ApiClient } from "./client";

export type ReviewStatus = "pending" | "confirmed" | "excluded";

export interface EventReviewUpdate {
  review_status: ReviewStatus;
  review_note?: string | null;
}

export interface EventReviewResponse {
  event_link_id: string;
  review_status: ReviewStatus;
  review_note?: string | null;
}

export async function setEventReviewStatus(
  client: ApiClient,
  companyId: string,
  eventLinkId: string,
  body: EventReviewUpdate,
): Promise<EventReviewResponse> {
  const { data } = await client.patch<EventReviewResponse>(
    `/api/v1/companies/${companyId}/events/${eventLinkId}/review`,
    body,
  );
  return data;
}
