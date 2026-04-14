import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Circle, NewCirclePayload } from "@/types";

export function useCreateCircle() {
  const queryClient = useQueryClient();

  return useMutation<Circle, Error, NewCirclePayload>({
    mutationFn: (payload) =>
      apiFetch<Circle>("/circles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}
