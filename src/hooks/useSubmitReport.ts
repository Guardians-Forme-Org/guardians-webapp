import { useMutation } from "@tanstack/react-query";
import { useReportStore } from "@/store/reportStore";
import type { Report, NewReportPayload } from "@/types";

// Reports endpoint is not live yet — mock locally with Zustand
function mockSubmit(payload: NewReportPayload): Promise<Report> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: crypto.randomUUID(),
        challenge_id: payload.challenge_id,
        challenge_title: payload.challenge_title,
        circle_id: "",
        guardian_id: "",
        validation_tier: { level: 1, name: "Self Declared", description: "", code: "SELF_DECLARED" },
        description: payload.description,
        quantity: payload.quantity,
        evidence_url: payload.evidence_url,
        verifier_id: payload.verifier_id,
        status: "PENDING",
        submitted_at: new Date().toISOString(),
      });
    }, 600);
  });
}

export function useSubmitReport() {
  const addReport = useReportStore((s) => s.addReport);

  return useMutation<Report, Error, NewReportPayload>({
    mutationFn: mockSubmit,
    onSuccess: (report) => {
      addReport(report);
    },
  });
}
