import { create } from "zustand";
import type { Report } from "@/types";

type ReportState = {
  submittedReports: Report[];
  addReport: (report: Report) => void;
};

export const useReportStore = create<ReportState>()((set) => ({
  submittedReports: [],
  addReport: (report) =>
    set((state) => ({ submittedReports: [...state.submittedReports, report] })),
}));
