import { useReportStore } from "@/store/reportStore";
import type { AdminReport } from "@/types";

export function useAdminQueue() {
  const submittedReports = useReportStore((s) => s.submittedReports);

  const data: AdminReport[] = submittedReports.map((r) => ({
    id: r.id,
    circle_name: r.circle_id || "—",
    challenge_title: r.challenge_title ?? r.challenge_id,
    submitted_at: r.submitted_at,
    evidence_url: r.evidence_url ?? "",
    status: r.status,
  }));

  return { data, isLoading: false, isError: false };
}
