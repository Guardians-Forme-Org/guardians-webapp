import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminStore } from "@/store/adminStore";

type ReviewPayload = { id: string; status: "APPROVED" | "REJECTED" | "MORE_INFO" };

// Admin review endpoint is not live — optimistic update via Zustand
function mockReview(payload: ReviewPayload): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

export function useReviewReport() {
  const updateReportStatus = useAdminStore((s) => s.updateReportStatus);
  const queryClient = useQueryClient();

  return useMutation<void, Error, ReviewPayload>({
    mutationFn: mockReview,
    onSuccess: (_, { id, status }) => {
      updateReportStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ["admin", "queue"] });
    },
  });
}
