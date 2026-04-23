"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "./use-api-client";
import { setEventReviewStatus } from "@/lib/api/events";
import type { EventReviewUpdate, ReviewStatus } from "@/lib/api/events";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Marked as pending review",
  confirmed: "Event confirmed as relevant",
  excluded: "Event excluded from score",
};

interface UseSetEventReviewStatusOptions {
  onSuccess?: (status: ReviewStatus) => void;
}

export function useSetEventReviewStatus(
  companyId: string,
  opts?: UseSetEventReviewStatusOptions,
) {
  const client = useApiClient();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      eventLinkId,
      ...body
    }: { eventLinkId: string } & EventReviewUpdate) =>
      setEventReviewStatus(client, companyId, eventLinkId, body),

    onSuccess: ({ review_status }) => {
      toast.success(STATUS_LABELS[review_status] ?? "Review status updated");
      qc.invalidateQueries({
        queryKey: ["companies", "detail", companyId, "events"],
      });
      opts?.onSuccess?.(review_status);
    },

    onError: () => {
      toast.error("Could not update review status");
    },
  });
}
